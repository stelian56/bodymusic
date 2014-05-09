## Getting data from the YEI 3-Space Sensor devices with Python 2.7,
## PySerial 2.6, and YEI 3-Space Python API

import threespace_api as ts_api

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
## and just searches for 3-Space Sensor USB devices.
aval_sens_list, unknown_ports = ts_api.getAvailableComPorts(filter_list=["USB"])


## Only one 3-Space Sensor device is needed so we are just going to take the
## first one from the list.
com_port = aval_sens_list[0]
device = ts_api.TSSensor(com_port=com_port)
## If a connection to the COM port fails, None is returned.
if device is None:
    ## The YEI 3-Space Python API keeps track of its last error as does each
    ## instance of the 3-Space Sensor classes.
    print(ts_api.getLastError())
else:
    ## Now we can start getting information from the device.
    ## The class instances have all of the functionality that corresponds to the
    ## 3-Space Sensor device type it is representing.
    print("==================================================")
    print("Getting the filtered tared quaternion orientation.")
    quat = device.getFiltTaredOrientQuat()
    if quat is None:
        print(device.getLastError())
    else:
        print(quat)
    print("==================================================")
    print("Getting the raw sensor data.")
    data = device.getAllSensorsRaw()
    if data is None:
        print(device.getLastError())
    else:
        print("[%f, %f, %f] --Gyro\n[%f, %f, %f] --Accel\n[%f, %f, %f] --Comp"
                                                                        % data)
    print("==================================================")
    print("Getting the LED color of the device.")
    led = device.getLEDColor()
    if led is None:
        print(device.getLastError())
    else:
        print(led)
    print("==================================================")
    
    ## Now close the port.
    device.close()



