package net.geocentral.bodymusic;

import javax.vecmath.Vector3d;

public class BMSensor {

    private int id;
    private boolean enabled;
    private int updateRate;
    private BMNavigator navigator;
    private BMRawSensorData sensorData;
    
    public BMSensor(int id) {
        this.id = id;
        navigator = new BMNavigator();
    }

    public void update(BMSensorData sensorData) {
        boolean enabledNow = sensorData.isEnabled();
        if (enabled || !enabledNow) {
            navigator.update(sensorData);
        }
        else {
            navigator.reset();
        }
        enabled = enabledNow;
        updateRate = sensorData.getUpdateRate();
    }
    
    public void update(BMRawSensorData sensorData) {
        this.sensorData = sensorData;
    }

    public int getId() {
        return id;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public int getUpdateRate() {
        return updateRate;
    }
    
    public BMNavigator getNavigator() {
        return navigator;
    }

    public String toJson() {
        Vector3d gyro = sensorData.getGyroRate();
        Vector3d accelerometer = sensorData.getAccelerometerData();
        Vector3d compass = sensorData.getCompassData();
        StringBuilder builder = new StringBuilder();
        builder.append("{\r\n")
               .append("\"sensor\": {\r\n")
               .append(String.format("\"id\": %s,\r\n", id))
               .append(String.format("\"enabled\": %s,\r\n", true))
               .append(String.format("\"updateRate\": %s,\r\n", sensorData.getUpdateRate()))
               .append(String.format("\"timestamp\": %1.5f,\r\n", 1e-6*sensorData.getTimestamp()))
               .append(String.format("\"gyro\": {\"x\": %f, \"y\": %f, \"z\": %f},\r\n", gyro.x, gyro.y, gyro.z))
               .append(String.format("\"accelerometer\": {\"x\": %f, \"y\": %f, \"z\": %f},\r\n", accelerometer.x, accelerometer.y, accelerometer.z))
               .append(String.format("\"compass\": {\"x\": %f, \"y\": %f, \"z\": %f}\r\n", compass.x, compass.y, compass.z))
               .append("}\r\n")
               .append("}\r\n");
        return builder.toString();
    }
}
