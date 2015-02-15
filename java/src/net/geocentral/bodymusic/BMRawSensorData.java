package net.geocentral.bodymusic;

import java.io.BufferedReader;

import javax.vecmath.Vector3d;

public class BMRawSensorData {

    private int sensorId;
    private int updateRate;
    private Vector3d gyroRate;
    private Vector3d accelerometerData;
    private Vector3d compassData;
    private double timestamp; // seconds

    public boolean read(BufferedReader reader) throws Exception {
        String line = reader.readLine();
        if (line == null) {
            return false;
        }
        String[] tokens = line.split(" ");
        sensorId = Integer.valueOf(tokens[0]);
        updateRate = Integer.valueOf(tokens[1]);
        timestamp = Double.valueOf(tokens[2]);
        gyroRate = new Vector3d(Double.valueOf(tokens[3]), Double.valueOf(tokens[4]),
                Double.valueOf(tokens[5]));
        accelerometerData = new Vector3d(Double.valueOf(tokens[6]), Double.valueOf(tokens[7]),
                Double.valueOf(tokens[8]));
        compassData = new Vector3d(Double.valueOf(tokens[9]), Double.valueOf(tokens[10]),
                Double.valueOf(tokens[11]));
        return true;
    }

    public Vector3d getGyroRate() {
        return gyroRate;
    }
    
    public Vector3d getAccelerometerData() {
    	return accelerometerData;
    }

    public Vector3d getCompassData() {
        return compassData;
    }

    public double getTimestamp() {
        return timestamp;
    }

    public int getSensorId() {
        return sensorId;
    }

    public int getUpdateRate() {
        return updateRate;
    }
    
    public void fromString(String line) {
        String[] fields = line.split(" ");
        for (int fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
            String value = fields[fieldIndex].split("=")[1];
            String[] tokens;
            switch (fieldIndex) {
            case 0:
                sensorId = Integer.valueOf(value);
                break;
            case 1:
                updateRate = Integer.valueOf(value);
                break;
            case 2:
                timestamp = Double.valueOf(value);
                break;
            case 3:
                tokens = value.split(",");
                gyroRate = new Vector3d(Double.valueOf(tokens[0].substring(1)), Double.valueOf(tokens[1]), Double.valueOf(tokens[2].substring(0, tokens[2].length() - 1)));
                break;
            case 4:
                tokens = value.split(",");
                accelerometerData = new Vector3d(Double.valueOf(tokens[0].substring(1)), Double.valueOf(tokens[1]), Double.valueOf(tokens[2].substring(0, tokens[2].length() - 1)));
                break;
            case 5:
                tokens = value.split(",");
                compassData = new Vector3d(Double.valueOf(tokens[0].substring(1)), Double.valueOf(tokens[1]), Double.valueOf(tokens[2].substring(0, tokens[2].length() - 1)));
                break;
            }
        }
    }
    
    public String toString() {
        StringBuilder builder = new StringBuilder();
        builder.append(String.format("sensor=%s", sensorId))
               .append(String.format(" rate=%s", updateRate));
        builder.append(String.format(" timestamp=%1.3f", timestamp))
               .append(String.format(" gyro=[%1.3f,%1.3f,%1.3f]", gyroRate.x, gyroRate.y, gyroRate.z))
               .append(String.format(" accelerometer=[%1.3f,%1.3f,%1.3f]", accelerometerData.x, accelerometerData.y, accelerometerData.z))
               .append(String.format(" compass=[%1.3f,%1.3f,%1.3f]", compassData.x, compassData.y, compassData.z));
        return builder.toString();
    }
}
