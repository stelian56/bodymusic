import os
import re
import glob
import threading
import time
import datetime  
import math
import urlparse
import mimetypes
import json
import BaseHTTPServer
from BaseHTTPServer import BaseHTTPRequestHandler
from collections import OrderedDict
from SimpleWebSocketServer import WebSocket, SimpleWebSocketServer
import threespace_api as api

config_file_name = "bmconfig.json"
log_dir = "log"
log_file_regex = re.compile(".+\.(.+)\.log")

class BMHttpHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def __init__(self, on_start, on_stop, on_playback, *args):
        self.on_start = on_start
        self.on_stop = on_stop
        self.on_playback = on_playback
        BaseHTTPRequestHandler.__init__(self, *args)
    
    def send_text(self, text, content_type):
        self.send_response(200)
        self.send_header("Content-type", content_type)
        self.end_headers()
        self.wfile.write(text)
    
    def send_not_found(self, file_path):
        self.send_response(404)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write("<h1>File %s not found</h1>" % file_path)
    
    def send_bad_request(self, text):
        self.send_response(400)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write("<h1>Bad request: %s" % text)
    
    def send_log_files(self):
        os.chdir(log_dir)
        file_names = glob.glob("*.log")
        os.chdir("..")
        file_names.sort()
        text = ",".join(file_names)
        self.send_text(text, "text/plain")
    
    def do_GET(self):
        parsed_path = urlparse.urlparse(self.path)
        file_path = parsed_path[2]
        if file_path[0] == "/":
            file_path = file_path[1:]
        if len(file_path) > 0:
            try:
                f = open(file_path)
            except IOError:
                self.send_not_found(file_path)
            else:
                text = f.read()
                mime_type = mimetypes.guess_type(file_path)[0]
                self.send_text(text, mime_type)
        else:
            query_string = parsed_path[4]
            if query_string: 
                params = query_string.split("&")
                query = dict()
                for param in params:
                    name_value = param.split("=")
                    if len(name_value) > 1:
                        query[name_value[0]] = name_value[1]
                if "command" in query:
                    command = query["command"]
                    if command == "stop":
                        self.on_stop()
                        self.send_text("ok", "text/plain")
                    elif command == "start":
                        update_rate = None
                        if "updateRate" in query:
                            update_rate = int(query["updateRate"])
                        self.on_start(update_rate)
                        self.send_text("ok", "text/plain")
                    elif command == "playback":
                        log_file_name = query["logFile"]
                        self.on_playback(log_file_name)
                        self.send_text("ok", "text/plain")
                    elif command == "getLogFiles":
                        self.send_log_files()
                    else:
                        self.send_bad_request(query_string)
                else:
                    self.send_bad_request(query_string)
            else:
                self.send_bad_request("")
                
    def log_message(self, *args):
        return
        
class BMHttpWorker(threading.Thread):
    def __init__(self, port, on_start, on_stop, on_playback):
        threading.Thread.__init__(self)
        self.port = port
        self.on_start = on_start
        self.on_stop = on_stop
        self.on_playback = on_playback

    def handler(self, *args):
        BMHttpHandler(self.on_start, self.on_stop, self.on_playback, *args)

    def run(self):
        httpd = BaseHTTPServer.HTTPServer(("localhost", self.port), self.handler)
        httpd.serve_forever()
        
class BMWebsocketWorker(threading.Thread):
    def __init__(self, websocket):
        threading.Thread.__init__(self)
        self.websocket = websocket

    def run(self):
        self.websocket.serveforever()

class BMPlaybackWorker(threading.Thread):
    def __init__(self, log_file_name, on_log_data, stop_event):
        threading.Thread.__init__(self)
        self.log_file_name = log_file_name
        self.stop_event = stop_event
        self.on_log_data = on_log_data

    def run(self):
        log_file_path = "%s/%s" % (log_dir, self.log_file_name)
        prev_timestamps = {}
        try:
            log_file = open(log_file_path)
            print "Started playback from file %s" % self.log_file_name
            while not self.stop_event.is_set():
                text = log_file.readline()
                if not text:
                    break
                self.on_log_data(text)
                data_object = json.loads(text)
                sensor_id = data_object["id"]
                timestamp = data_object["time"]
                if sensor_id in prev_timestamps:
                    delay = timestamp - prev_timestamps[sensor_id]
                    self.stop_event.wait(delay)
                prev_timestamps[sensor_id] = timestamp
            log_file.close()
            print "Stopped playback"
        except IOError:
            print "Log file %s not found" % self.log_file_name

class BMSensorWorker(threading.Thread):
    def __init__(self, config, update_rate, on_sensor_data, stop_event):
        threading.Thread.__init__(self)
        self.config = config
        self.update_rate = update_rate
        self.on_sensor_data = on_sensor_data
        self.stop_event = stop_event
        self.dongle = None
        self.sensors = None
        
    def create_log_file(self):
        file_names = glob.glob("%s/*.log" % log_dir)
        file_count = len(file_names)
        suffix = "1"
        if file_count > 0:
            file_names.sort()
            last_file_name = file_names.pop()
            match = log_file_regex.match(last_file_name)
            suffix = int(match.group(1)) + 1
        file_path = "%s/%s.%s.log" % (log_dir, datetime.date.today(), suffix)
        dir_name = os.path.dirname(file_path)
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
        return open(file_path, 'w')
        
    def init(self):
        self.log_file = self.create_log_file()
        if not self.log_file:
            return False
        print "Started logging to %s" % self.log_file.name
        device_list = api.getComPorts(filter = api.TSS_FIND_DNG|api.TSS_FIND_WL)
        for device_port in device_list:
            com_port, device_name, device_type = device_port
            if device_type == "DNG":
                if self.dongle:
                    print("Multiple dongles detected")
                    return False
                self.dongle = api.TSDongle(com_port = com_port)
                if not self.dongle:
                    print("Failed to init dongle")
                    return False
            elif device_type == "WL":
                print("Wired sensor detected on COM port %s" % (com_port))
            else:
                print("Device %s is of unexpected type %s" % (device_name, device_type))
                return False
    
        if not self.dongle:
            print("No dongle detected")
            return False
        self.sensors = []
        sensor_index = 0
        while True:
            sensor_serial_number = self.dongle.wireless_table[sensor_index]
            if sensor_serial_number < 1:
                break
            sensor = self.dongle[sensor_index]
            if sensor:
                self.sensors.append(sensor)
                print("Sensor %d: Serial number = %x, Battery life = %d%%" %
                      (sensor_index, sensor.serial_number, sensor.getBatteryPercentRemaining()))
            sensor_index += 1
        if not self.sensors:
            print("No sensors detected")
            return False
        print("Devices inited")
        if self.update_rate < 1 or self.update_rate > self.config["sensors"]["maxUpdateRate"]:
            self.update_rate = self.config["sensors"]["defaultUpdateRate"]
        update_interval = 1.0/self.update_rate;
        for sensor in self.sensors:
            sensor.stopStreaming()
            sensor.setStreamingTiming(math.floor(5e5*update_interval), 0xffffffff, 0)
            expression = "sensor.setStreamingSlots('%s')" % "','".join([reading["command"] \
                    for reading in self.config["sensors"]["readings"]])
            eval(expression)
            sensor.startStreaming()
        print "Started sensors at update rate %dHz" % self.update_rate
        return True
    
    def stop(self):
        for sensor in self.sensors:
            sensor.stopStreaming()
            sensor.close()
        self.dongle.close()
        self.stop_event.set()
        print "Stopped sensors"
            
    def run(self):
        update_interval = 1.0/self.update_rate;
        self.stop_event.wait(update_interval)
        while not self.stop_event.is_set():
            now = datetime.datetime.now()
            for sensor in self.sensors:
                sensor_data = sensor.stream_last_data
                if sensor_data:
                    self.on_sensor_data(sensor.logical_id, sensor_data, self.log_file)
            elapsed = datetime.datetime.now() - now
            delay = update_interval - elapsed.total_seconds()
            if delay > 0:
                self.stop_event.wait(delay)
        self.stop()
        self.log_file.close()
        
class BMServer:
    def __init__(self):
        self.config = self.read_config()
        self.websocket = None
        self.stop_event = None

    def read_config(self):
        config_file = open(config_file_name)
        config = json.load(config_file)
        return config
    
    def start_http(self):
        port = self.config["server"]["http"]["port"]
        thread = BMHttpWorker(port, self.start_sensors, self.stop, self.playback)
        thread.daemon = False
        thread.start()
        print "Started HTTP server on port %d" % port
        
    def start_websocket(self):
        port = self.config["server"]["websocket"]["port"]
        self.websocket = SimpleWebSocketServer("", port, WebSocket)
        thread = BMWebsocketWorker(self.websocket)
        thread.start()
        print "Started web socket server on port %d" % port
    
    def stop(self):
        if self.stop_event:
            self.stop_event.set()
            self.stop_event = None
        time.sleep(1.0)
    
    def on_log_data(self, text):
        for client in self.websocket.connections.itervalues():
            client.sendMessage(text)
    
    def on_sensor_data(self, sensor_id, sensor_data, log_file):
        data_object = OrderedDict([("id", str(sensor_id)), ("time", round(1e-6*sensor_data[0], 5))])
        offset = 0
        for reading in self.config["sensors"]["readings"]:
            reading_name = reading["name"]
            reading_object = data_object[reading_name] = OrderedDict()
            components = reading["components"]
            component_count = len(components)
            for component_index in range(component_count):
                component_name = components[component_index]
                component_data = round(sensor_data[1][offset + component_index], 5)
                reading_object[component_name] = component_data
            offset += component_count
        text = json.dumps(data_object)
        for client in self.websocket.connections.itervalues():
            client.sendMessage(text)
        log_file.write(text + '\n')

    def start_sensors(self, update_rate):
        if self.stop_event:
            self.stop()
        self.stop_event = threading.Event()
        worker = BMSensorWorker(self.config, update_rate, self.on_sensor_data, self.stop_event);
        if worker.init():
            worker.start()
        
    def playback(self, log_file_name):
        if self.stop_event:
            self.stop()
        self.stop_event = threading.Event()
        thread = BMPlaybackWorker(log_file_name, self.on_log_data, self.stop_event)
        thread.start()
        
    def start(self):
        self.start_http()
        self.start_websocket()

bm_server = BMServer()
bm_server.start()
