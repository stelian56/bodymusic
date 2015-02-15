package net.geocentral.bodymusic;

public class BMDurationController {

    public static final int minDuration = BMMusicController.minDuration; // update ticks
    private static final int durationSlots = 2;
    private static final double maxAngleRate = 100 * BMUtils.deg2rad;
    private static final double minAngleRate = 20 * BMUtils.deg2rad;
    private double durationRatio = -1;
    private int timeSinceLastPlayed;

    public double getDurationRatio() {
        return durationRatio;
    }
    
    public void sensorUpdated(BMSensor sensor) {
        double[] angleRates = sensor.getNavigator().getAngleRates();
        double combinedRate = 0;
        for (double angleRate : angleRates) {
            combinedRate += Math.abs(angleRate);
        }
        if (combinedRate < minAngleRate) {
            durationRatio = -1;
        }
        else if (combinedRate > maxAngleRate) {
            durationRatio = 1;
        }
        else {
            durationRatio = (combinedRate - minAngleRate)/(maxAngleRate - minAngleRate);
        }
        timeSinceLastPlayed++;
    }

    public boolean isTimeToPlay() {
        if (timeSinceLastPlayed % minDuration != 0) {
            return false;
        }
        if (durationRatio < 0) {
            return false;
        }
        int durationSlot = durationSlots - (int)Math.pow(durationSlots, durationRatio);
        int duration = minDuration * (int)Math.pow(2, durationSlot);
        if (timeSinceLastPlayed < duration) {
            return false;
        }
        return true;
    }
    
    public void notePlayed() {
        timeSinceLastPlayed = 0;
    }
}
