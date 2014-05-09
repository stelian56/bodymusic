## Reading a YEI 3-Space Sensor device's orientation asynchronously with
## Python 2.7, PySerial 2.6, and YEI 3-Space Python API

import threespace_api as ts_api
import time

################################################################################
########## First getting asynchronous data over a wireless connection ##########
################################################################################

## If the COM port is not known or the device type is not known for the 3-Space
## Sensor device, we must do a search for the devices. We can do this by calling
## the getAvailableComPorts function which returns two lists of COM port
## information.
## (known 3-Space Sensor devices and unknown devices)
## getAvailableComPorts also as a parameter called filter_list that takes a list
## of 3-Space Sensor device types which can be used to find specific 3-Space
## Sensor devices. If filter_list is not used or set to None all connected
## 3-Space Sensor devices are found.
## Each COM port information is a list containing
## (COM port name, friendly name, 3-Space Sensor device type)
## This example makes use of the filter_list parameter of getAvailableComPorts
## and just searches for Dongle devices.
aval_dngl_list, unknown_ports = ts_api.getAvailableComPorts(filter_list=["DNG"])


## Only one 3-Space Sensor device is needed so we are just going to take the
## first one from the list.
com_port = aval_dngl_list[0]
dng_device = ts_api.TSDongle(com_port=com_port)

## If a connection to the COM port fails, None is returned.
if dng_device is None:
    ## The YEI 3-Space Python API keeps track of its last error as does each
    ## instance of the 3-Space Sensor classes.
    print(ts_api.getLastError())
else:
    ## Now this assumes that the Wireless device and Dongle device have already
    ## been paired previously.
    wl_device = dng_device[0]
    
    if wl_device is None:
        print(ts_api.getLastError())
    else:
        ## Setting up the asynchronous session for getting the tared orientation
        ## of the Wireless device as a quaternion
        ## Asynchronuos calls have the same name as non asynchronous calls
        ## except they have a prepended "asynch" and parameters for the
        ## interval and duration.
        if wl_device.asynchGetFiltTaredOrientQuat(interval=15, duration=0xffff):
            start_time = time.clock()
            asynch_data = None
            while time.clock() - start_time < 2:
                asynch_data = wl_device.getAsynchronousData()
                print(asynch_data)
                print("=======================================\n")
            
            ## Now we must stop the asynchronous communication of getting the
            ## tared orientation of the Wireless device as a quaternion
            wl_device.stopAsynchronous()
        else:
            print(wl_device.getLastError())
    
    ## Now close the port.
    dng_device.close()

################################################################################
######### Second using an asynchronous broadcaster to get asynchronous #########
######### data for every 3-Space Sensor device known ###########################
################################################################################
print("=============================")
print("AsynchronuosBroadcaster calls")
print("=============================")
aval_dev_list, unknown_ports = ts_api.getAvailableComPorts()

device_list = []
for device_port in aval_dev_list:
    com_port, friendly_name, device_type = device_port
    if device_type == "USB":
        device = ts_api.TSSensor(com_port=com_port)
    elif device_type == "DNG":
        device = ts_api.TSDongle(com_port=com_port)
    elif device_type == "WL":
        device = ts_api.TSWLSensor(com_port=com_port)
    elif device_type == "EM":
        device = ts_api.TSEMSensor(com_port=com_port)
    elif device_type == "DL":
        device = ts_api.TSDLSensor(com_port=com_port)
    elif device_type == "BT":
        device = ts_api.TSBTSensor(com_port=com_port)
    
    if device is not None:
        ## Have to make TSWLSensor instances for the paired Wireless devices
        ## else the broadcaster will not use them.
        if device_type == "DNG":
            for i in range(15):
                wl_device = device[i]
                if wl_device is not None:
                    device_list.append(wl_device)
        device_list.append(device)
    else:
        print(ts_api.getLastError())

## The YEI 3-Space Python API has a global asynchronous broadcaster called
## global_asynch_broadcaster which is an instance of AsynchronuosBroadcaster
## The functions for this class have the same name as the 3-Space Sensor
## classes' calls except they have the word "begin" instead of "get" and
## parameter for the interval.
ts_api.global_asynch_broadcaster.beginFiltTaredOrientQuat(interval=15)
start_time = time.clock()
asynch_data = None
while time.clock() - start_time < 2:
    ## The poll function gathers all the latest data and returns it as a map
    ## with the keys being the devices' serial number
    asynch_data = ts_api.global_asynch_broadcaster.poll()
    for data in asynch_data.values():
        print(data)
        print("=======================================\n")

## Now we must stop the asynchronous communication of getting the
## tared orientation of the devices as a quaternion
ts_api.global_asynch_broadcaster.stop()

## Now close the ports.
for device in device_list:
    device.close()









