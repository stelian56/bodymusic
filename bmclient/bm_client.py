import time
import socket
import math

import threespace_api as api

update_interval = 0.01 # seconds
listener_port = 12345
stop_requested = False

def init_devices():
    dongle = None
    device_list = api.getComPorts(filter = api.TSS_FIND_DNG|api.TSS_FIND_WL)
    for device_port in device_list:
        com_port, device_name, device_type = device_port
        if device_type == "DNG":
            if dongle:
                print("Multiple dongles detected")
                return None
            dongle = api.TSDongle(com_port = com_port)
            if not dongle:
                print("Failed to init dongle")
                return None
        elif device_type == "WL":
            print("Wired sensor detected on COM port %s" % (com_port))
        else:
            print("Device %s is of unexpected type %s" % (device_name, device_type))
            return None

    if not dongle:
        print("No dongle detected")
        return None
    sensors = []
    sensor_index = 0
    while True:
        sensor_serial_number = dongle.wireless_table[sensor_index]
        if sensor_serial_number < 1:
            break
        sensor = dongle[sensor_index]
        if sensor:
            sensor.setCompassEnabled(False)
            sensor.getButtonState(); # Clear button state
            sensor_props = {'enabled': False, 'buttonPressed': False}
            sensors.append([sensor, sensor_props])
            print("Sensor %d: Serial number = %x, Battery life = %d%%" %
                  (sensor_index, sensor.serial_number, sensor.getBatteryPercentRemaining()))
        sensor_index += 1
    if not sensors:
        print("No sensors detected")
        return None
    print("Devices inited")
    return [dongle, sensors]

def start_reader(devices, client_socket):
    print("Started reading sensor data")
    sensors = devices[1]
    for [sensor, sensor_props] in sensors:
        sensor.stopStreaming()
        sensor.setStreamingTiming(math.floor(update_interval*5e5), 0xffffffff, 0)
        sensor.setStreamingSlots('getButtonState', 'getCorrectedAccelerometerVector', 'getTaredOrientationAsTwoVector')
        sensor.startStreaming()
    while not stop_requested:
        now = time.time()
        for [sensor, sensor_props] in sensors:
            sensor_data = sensor.stream_last_data
            if sensor_data:
                button_pressed = sensor_data[1][0] == 1
                button_clicked = sensor_props['buttonPressed'] and not button_pressed
                sensor_props['buttonPressed'] = button_pressed
                if (button_clicked):
                    sensor_props['enabled'] ^= True
                    if sensor_props['enabled']:
                        sensor.tareWithCurrentOrientation()
                        continue
                if not send_data(sensor, sensor_props, sensor_data, client_socket):
                    return
        elapsed = time.time() - now
        delay = update_interval - elapsed
        if delay > 0:
            time.sleep(delay)

def send_data(sensor, sensor_props, sensor_data, client_socket):
    enabled = sensor_props['enabled']
    text = "%s %s %d" % (sensor.logical_id, 1 if enabled else 0, math.floor(1/update_interval))
    text += " %.5f" % (sensor_data[0] * 1e-6)
    text += " %.3f %.3f %.3f %.3f %.3f %.3f %.3f %.3f %.3f" % sensor_data[1][1:]
    try:
        client_socket.send(text + "\n")
    except Exception as exception:
        if exception.errno == 10054:
            print("Connection closed by server")
        else:
            print "Error:", exception
        stop_requested = True
        return False
    return True
    
def start_sender():
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect(("localhost", listener_port))
    return client_socket

def start_client():
    devices = init_devices()
    if not devices:
        return None
    client_socket = start_sender()
    start_reader(devices, client_socket)
    return devices

def stop_client(devices):
    dongle = devices[0]
    sensors = devices[1]
    for sensor in sensors:
        sensor[0].stopStreaming()
    dongle.close()
    print("Client stopped")

devices = start_client()
if devices:
    stop_client(devices)
