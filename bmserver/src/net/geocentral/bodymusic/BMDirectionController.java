package net.geocentral.bodymusic;

public class BMDirectionController {

    private static final double rateThreshold = 10 * BMUtils.deg2rad;
    private int direction;
    
    public synchronized int getDirection() {
        return direction;
    }

    public synchronized void sensorUpdated(BMSensor sensor) {
        double elevationRate = sensor.getNavigator().getAngles()[1];
        if (elevationRate > rateThreshold) {
            direction = 1;
        }
        else if (elevationRate < - rateThreshold) {
            direction = -1;
        }
        else {
            direction = 0;
        }
    }
}
