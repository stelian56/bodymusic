## Setting data for the YEI 3-Space Sensor devices with Python 2.7,
## PySerial 2.6, and YEI 3-Space Python API

import threespace_api as ts_api
import time

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
    print("Setting the tared data of the device to an arbitrary quaternion.")
    if device.setTareQuaternion([0, 0, 0, 1]):
        quat = device.getTareOrientQuat()
        if quat is None:
            print(device.getLastError())
        else:
            print("The arbitrary quaternion read from the device:")
            print(quat)
    else:
        print(device.getLastError())
    print("==================================================")
    print("Setting the LED color of the device to RED.")
    if device.setLEDColor((1, 0, 0)):
        time.sleep(2)
        print("Setting the LED color of the device to default BLUE.")
        if not device.setLEDColor((0, 0, 1)):
            print(device.getLastError())
    else:
        print(device.getLastError())
    print("==================================================")
    
    ## Now close the port.
    device.close()



