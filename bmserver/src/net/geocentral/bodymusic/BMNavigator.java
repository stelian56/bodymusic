package net.geocentral.bodymusic;

public class BMNavigator {

    private BMAttitudeFilter attitudeFilter;
    private Object lock;
    
    public BMNavigator() {
        attitudeFilter = new BMAttitudeFilter();
        lock = new Object();
        reset();
    }
    
    public void update(BMSensorData sensorData) {
        synchronized(lock) {
            attitudeFilter.update(sensorData);
        }
    }
    
    public void reset() {
        synchronized(lock) {
            attitudeFilter.reset();
        }
    }
    
    public double[] getAngles() {
        synchronized(lock) {
            return attitudeFilter.getAngles();
        }
    }
    
    public double[] getAngleRates() {
        synchronized(lock) {
            return attitudeFilter.getAngleRates();
        }
    }
    
    public Double getTimestamp() {
        synchronized(lock) {
            return attitudeFilter.getTimestamp();
        }
    }
}
