## Pairing the YEI 3-Space Sensor Wireless devices with the YEI 3-Space Sensor
## Dongle devices for a wireless connection with Python 2.7, PySerial 2.6, and
## YEI 3-Space Python API

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
## and just searches for Wireless devices and Dongle devices.
aval_dev_list, unknown_ports = ts_api.getAvailableComPorts(filter_list=["DNG", "WL"])


## Now go through our known list of 3-Space Sensor devices and create the
## appropriate instance by using the devices' type and COM port
dng_device = None
wl_device = None
for device_port in aval_dev_list:
    com_port, friendly_name, device_type = device_port
    if device_type == "DNG":
        dng_device = ts_api.TSDongle(com_port=com_port)
    elif device_type == "WL":
        wl_device = ts_api.TSWLSensor(com_port=com_port)

## If a connection to the COM port fails, None is returned.
if dng_device is None or wl_device is None:
    ## The YEI 3-Space Python API keeps track of its last error as does each
    ## instance of the 3-Space Sensor classes.
    print(ts_api.getLastError())
else:
    ## Now we can start pairing the Dongle device and Wireless device.
    ## The TSDongle class has a convenience function for pairing with Wireless
    ## devices.
    
    ## This function is addSensor. It has 3 parameters:
    ## idx - the index into the Dongle device's wireless table
    ## hw_id - the serial number of the Wireless device
    ## axis_dir - an axis direction you want the Wireless device to have
    
    dng_device.addSensor(0, wl_device.serial_number)
    
    ## There are certain attributes that the 3-Space Sensor classes have that
    ## hold information of the 3-Space Sensor devices that would be redundant to
    ## always request from the device and would cost a lot of time.
    
    ## Now we can check if the Wireless device was paired by indexing into the
    ## TSDongle instance like it was a list.
    print(dng_device[0])
    
    ## Now commit our wireless settings
    dng_device.commitWirelessSettings()
    wl_device.commitWirelessSettings()
    
    ## Now close the ports.
    dng_device.close()
    wl_device.close()



