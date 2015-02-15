package net.geocentral.bodymusic;

public class BMNote {

    private int sensorId;
    private int midiInstrumentId;
    private int pitch;
    private int volume;
    
    public BMNote(int sensorId, int midiInstrumentId, int pitch, int volume) {
        this.sensorId = sensorId;
        this.midiInstrumentId = midiInstrumentId;
        this.pitch = pitch;
        this.volume = volume;
    }
    
    public int getMidiInstrumentId() {
        return midiInstrumentId;
    }
    
    public int getPitch() {
        return pitch;
    }
    
    public int getVolume() {
        return volume;
    }
    
    public String toJson() {
        StringBuilder builder = new StringBuilder();
        builder.append("{\r\n")
               .append("\"note\": {\r\n")
               .append(String.format("\"sensorId\": %s,\r\n", sensorId))
               .append(String.format("\"pitch\": %s\r\n", pitch))
               .append("}\r\n")
               .append("}\r\n");
        return builder.toString();
    }
}
