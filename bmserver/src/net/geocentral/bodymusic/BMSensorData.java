package net.geocentral.bodymusic;

import java.io.BufferedReader;

import javax.vecmath.Vector3d;

public class BMSensorData {

    private int sensorId;
    private boolean enabled;
    private int updateRate;
    private Vector3d fwd;
    private Vector3d dwn;
    private Vector3d acc;
    private double timestamp; // seconds

    public boolean read(BufferedReader reader) throws Exception {
        String line = reader.readLine();
        if (line == null) {
            return false;
        }
        String[] tokens = line.split(" ");
        if (tokens.length == 13) {
            sensorId = Integer.valueOf(tokens[0]);
            enabled = Integer.valueOf(tokens[1]) > 0;
            updateRate = Integer.valueOf(tokens[2]);
            timestamp = Double.valueOf(tokens[3]);
            acc = new Vector3d(Double.valueOf(tokens[4]), Double.valueOf(tokens[5]),
                    Double.valueOf(tokens[6]));
            fwd = new Vector3d(Double.valueOf(tokens[7]), Double.valueOf(tokens[8]),
                    Double.valueOf(tokens[9]));
            dwn = new Vector3d(Double.valueOf(tokens[10]), Double.valueOf(tokens[11]),
                    Double.valueOf(tokens[12]));
        }
        else {
            String message = String.format("Cannot interpret sensor data '%s'", line);
            throw new Exception(message);
        }
        return true;
    }

    public Vector3d getFwd() {
        return fwd;
    }
    
    public Vector3d getDwn() {
    	return dwn;
    }

    public Vector3d getAcc() {
        return acc;
    }

    public double getTimestamp() {
        return timestamp;
    }

    public int getSensorId() {
        return sensorId;
    }
    
    public boolean isEnabled() {
        return enabled;
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
                enabled = "enabled".equals(value);
                break;
            case 2:
                updateRate = Integer.valueOf(value);
                break;
            case 3:
                timestamp = Double.valueOf(value);
                break;
            case 4:
                tokens = value.split(",");
                fwd = new Vector3d(Double.valueOf(tokens[0].substring(1)), Double.valueOf(tokens[1]), Double.valueOf(tokens[2].substring(0, tokens[2].length() - 1)));
                break;
            case 5:
                tokens = value.split(",");
                dwn = new Vector3d(Double.valueOf(tokens[0].substring(1)), Double.valueOf(tokens[1]), Double.valueOf(tokens[2].substring(0, tokens[2].length() - 1)));
                break;
            case 6:
                tokens = value.split(",");
                acc = new Vector3d(Double.valueOf(tokens[0].substring(1)), Double.valueOf(tokens[1]), Double.valueOf(tokens[2].substring(0, tokens[2].length() - 1)));
                break;
            }
        }
    }
    
    public String toString() {
        StringBuilder builder = new StringBuilder();
        builder.append(String.format("sensor=%s", sensorId))
               .append(String.format(" status=%s", enabled ? "enabled" : "disabled"))
               .append(String.format(" rate=%s", updateRate));
        builder.append(String.format(" timestamp=%1.3f", timestamp))
               .append(String.format(" fwd=[%1.3f,%1.3f,%1.3f]", fwd.x, fwd.y, fwd.z))
               .append(String.format(" dwn=[%1.3f,%1.3f,%1.3f]", dwn.x, dwn.y, dwn.z))
               .append(String.format(" acc=[%1.3f,%1.3f,%1.3f]", acc.x, acc.y, acc.z));
        return builder.toString();
    }
}
