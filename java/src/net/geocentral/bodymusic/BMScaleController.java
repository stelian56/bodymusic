package net.geocentral.bodymusic;

public class BMScaleController {

    private static final int[] major = {0, 2, 4, 5, 7, 9, 11};
    private static final int[] majorTriad = {0, 4, 7};
    private static final int[] majorSubdominantTriad = {0, 5, 9 };
    private static final int[] majorDominantSeventh = { 0, 4, 7, 10 };
    private static final int[] minorHarmonic = {0, 2, 3, 5, 7, 8, 11};
    private static final int[] minorMelodic = {0, 2, 3, 5, 7, 9, 11};
    private static final int[] minorNatural = {0, 2, 3, 5, 7, 8, 10};
    private static final int[] minorTriad = {0, 3, 7};
    private static final int[] minorSubdominantTriad = {0, 5, 8 };
    private static final int[] minorHarmonic2ndLow = {0, 1, 4, 5, 7, 8, 11};
    private static final int[] minorHarmonic2ndLowAlt = {1, 0, 4, 1, 5, 4, 7, 5, 8, 7, 11, 8, 12, 11};
    private static final int[] diminishedSeventh = {0, 3, 6, 9};
    private int[] upwardScale = major;
    private int[] downwardScale = major;
    
    public int[] getScale(int direction) {
        return direction < 0 ? downwardScale : upwardScale;
    }

    public void sensorUpdated(BMSensor sensor) {
        BMNavigator navigator = sensor.getNavigator();
        double roll = navigator.getAngles()[2];
//        double yawRate = navigator.getAngleRates()[0];
//        if (yawRate < -BMUtils.angleRateThreshold) {
            // leftward spin
            if (roll >= -45 * BMUtils.deg2rad && roll < 45 * BMUtils.deg2rad) {
                upwardScale = minorHarmonic2ndLow;
                downwardScale = minorHarmonic2ndLow;
            }
            else if (roll >= 45 * BMUtils.deg2rad && roll < 135 * BMUtils.deg2rad) {
                upwardScale = majorTriad;
                downwardScale = majorTriad;
            }
            else if (roll >= 135 * BMUtils.deg2rad || roll < -135 * BMUtils.deg2rad) {
                upwardScale = minorSubdominantTriad;
                downwardScale = minorSubdominantTriad;
            }
            else if (roll >= -135 * BMUtils.deg2rad && roll < -45 * BMUtils.deg2rad) {
                upwardScale = minorHarmonic2ndLowAlt;
                downwardScale = minorHarmonic2ndLowAlt;
            }
            else {
                throw new UnsupportedOperationException(
                        String.format("Invalid roll %s", roll * BMUtils.rad2deg));
            }
//        }
//        else if (yawRate > BMUtils.angleRateThreshold) {
//            // rightward spin
//            if (roll >= -45 * BMUtils.deg2rad && roll < 45 * BMUtils.deg2rad) {
//                upwardScale = minorMelodic;
//                downwardScale = minorNatural;
//            }
//            else if (roll >= 45 * BMUtils.deg2rad && roll < 135 * BMUtils.deg2rad) {
//                upwardScale = minorTriad;
//                downwardScale = minorTriad;
//            }
//            else if (roll >= 135 * BMUtils.deg2rad || roll < -135 * BMUtils.deg2rad) {
//                upwardScale = minorSubdominantTriad;
//                downwardScale = minorSubdominantTriad;
//            }
//            else if (roll >= -135 * BMUtils.deg2rad && roll < -45 * BMUtils.deg2rad) {
//                upwardScale = diminishedSeventh;
//                downwardScale = diminishedSeventh;
//            }
//            else {
//                throw new UnsupportedOperationException(
//                        String.format("Invalid roll %s", roll * BMUtils.rad2deg));
//            }
//        }
            
          upwardScale = minorHarmonic2ndLow;
          downwardScale = minorHarmonic2ndLow;
          
    }
}
