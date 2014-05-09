package net.geocentral.bodymusic;

import javax.vecmath.Matrix3d;
import javax.vecmath.Vector3d;

public class BMUtils {

    public static final double deg2rad = Math.PI / 180;
    public static final double rad2deg = 180 / Math.PI;
    public static final double angleRateThreshold = 5 * deg2rad;
    
    public static void sensorData2Angles(BMSensorData sensorData, double[] angles) {
        Vector3d fwdSensor = sensorData.getFwd();
        Vector3d dwnSensor = sensorData.getDwn();
        Vector3d fwd = new Vector3d(fwdSensor.z, fwdSensor.x, -fwdSensor.y);
        Vector3d dwn = new Vector3d(dwnSensor.z, dwnSensor.x, -dwnSensor.y);
        Vector3d rgt = new Vector3d();
        rgt.cross(dwn, fwd);
        Matrix3d m = new Matrix3d(
                fwd.x, rgt.x, dwn.x,
                fwd.y, rgt.y, dwn.y,
                fwd.z, rgt.z, dwn.z);
        angles[0] = Math.atan2(m.m10, m.m00);
        angles[1] = Math.atan2(-m.m20, Math.sqrt(m.m21 * m.m21 + m.m22 * m.m22));
        angles[2] = Math.atan2(m.m21, m.m22);
    }

    public static void sensorData2AccNED(BMSensorData sensorData, Vector3d accNED) {
        Vector3d fwdSensor = sensorData.getFwd();
        Vector3d dwnSensor = sensorData.getDwn();
        Vector3d accSensor = sensorData.getAcc();
        Vector3d fwd = new Vector3d(fwdSensor.z, fwdSensor.x, -fwdSensor.y); 
        Vector3d dwn = new Vector3d(dwnSensor.z, dwnSensor.x, -dwnSensor.y);
        Vector3d acc = new Vector3d(accSensor.z, accSensor.x, -accSensor.y);
        Vector3d rgt = new Vector3d();
        rgt.cross(dwn, fwd);
        Matrix3d m = new Matrix3d(
                fwd.x, rgt.x, dwn.x,
                fwd.y, rgt.y, dwn.y,
                fwd.z, rgt.z, dwn.z);
        accNED.x = m.m00*acc.x + m.m01*acc.y + m.m02*acc.z;
        accNED.y = m.m10*acc.x + m.m11*acc.y + m.m12*acc.z;
        accNED.z = m.m20*acc.x + m.m21*acc.y + m.m22*acc.z;
    }
    
    public static void accEUN2accNED(Vector3d accEUN, Vector3d accNED) {
        accNED.set(accEUN.z, accEUN.x, -accEUN.y);
    }
}
