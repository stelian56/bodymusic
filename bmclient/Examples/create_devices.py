## Creating a serial port for the YEI 3-Space Sensor devices with Python 2.7,
## PySerial 2.6, and YEI 3-Space Python API

import threespace_api as ts_api

## If the COM port is already known and the device type is known for the 3-Space
## Sensor device, we can just create the appropriate instance without doing a
## search.
com_port = "COM12"
device = ts_api.TSSensor(com_port=com_port)
## If a connection to the COM port fails, None is returned.
print(device)


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
device_list, unknown_list = ts_api.getAvailableComPorts()


## Now go through our known list of 3-Space Sensor devices and create the
## appropriate instance by using the devices' type and COM port
for device_port in device_list:
    com_port, friendly_name, device_type = device_port
    if device_type == "BTL":
        device = ts_api.TSBootloader(com_port=com_port)
    elif device_type == "USB":
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
    
    ## If a connection to the COM port fails, None is returned.
    print(device)
    
    ## Now close the port.
    device.close()


## The unknown list could contain 3-Space Sensor devices that were connected via
## a serial connection. We can find out if there is any 3-Space Sensor devices
## by using the getComPortInfo function. However, we must send commands over the
## port which could make other devices other than 3-Space Sensor devices act
## blah. So be sure to know what port your 3-Space Sensor device(s) are on when
## calling this function.
## getComPortInfo returns a list of information that it found from the COM port
## (Friendly name, 3-Space Type, 3-Space ID, 3-Space Firmware Version String,
##  3-Space Hardware Version String, is in bootloader mode)
for unknown_port in unknown_list:
    com_port, friendly_name, device_type = unknown_port
    port_info = ts_api.getComPortInfo(com_port, poll_device=True)
    device_type = port_info[1]
    is_bootloader = port_info[5]
    if is_bootloader:
        device = ts_api.TSBootloader(com_port=com_port)
    elif device_type == "USB":
        device = ts_api.TSSensor(com_port=com_port)
    elif device_type == "EM":
        device = ts_api.TSEMSensor(com_port=com_port)
    ## None of the COM ports in the list were 3-Space Sensor devices
    else:
        device = com_port + " is not a 3-Space Sensor device."
    ## If a connection to the COM port fails, None is returned.
    print(device)
    
    ## Now close the port.
#    device.close()



