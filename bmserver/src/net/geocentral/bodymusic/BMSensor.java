package net.geocentral.bodymusic;

public class BMSensor {

    private int id;
    private boolean enabled;
    private int updateRate;
    private BMNavigator navigator;
    
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
        double[] angles = navigator.getAngles();
        double[] angleRates = navigator.getAngleRates();
        Double timestamp = navigator.getTimestamp();
        StringBuilder builder = new StringBuilder();
        builder.append("{\r\n")
               .append("\"sensor\": {\r\n")
               .append(String.format("\"id\": %s,\r\n", id))
               .append(String.format("\"enabled\": %s,\r\n", enabled))
               .append(String.format("\"updateRate\": %s,\r\n", updateRate))
               .append(String.format("\"timestamp\": %1.5f,\r\n", timestamp))
               .append(String.format("\"angles\": [%1.5f, %1.5f, %1.5f],\r\n", angles[0], angles[1], angles[2]))
               .append(String.format("\"angleRates\": [%1.5f, %1.5f, %1.5f]\r\n",
                   angleRates[0], angleRates[1], angleRates[2]))
               .append("}\r\n")
               .append("}\r\n");
        return builder.toString();
    }
}
