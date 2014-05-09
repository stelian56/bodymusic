package net.geocentral.bodymusic;

public class BMTomTamController implements BMVoiceController {

    public static final int minDuration = BMMusicController.minDuration; // update ticks
    private static final int tomMidiInstrumentId = 118;
    private static final int tamMidiInstrumentId = 115;
    private static final int tomPitch = 60;
    private static final int tamPitch = 67;
    private static final int volume = 120;
    public static final double tomAngleRate = 180 * BMUtils.deg2rad;
    public static final double tamAngleRate = 180 * BMUtils.deg2rad;
    private int instrumentId;
    private BMServer server;
    private BMPlayer player;
    private BMNote noteToPlay;
    private int timeSinceLastPlayed;
    
    public BMTomTamController(int instrumentId, BMServer server, BMPlayer player) {
        this.instrumentId = instrumentId;
        this.server = server;
        this.player = player;
    }

    public void sensorUpdated(BMSensor sensor) {
        if (sensor.isEnabled()) {
            timeSinceLastPlayed++;
            if (noteToPlay == null) {
                double[] angleRates = sensor.getNavigator().getAngleRates();
                double angleRate = angleRates[2];
                if (angleRate < -tomAngleRate) {
                    noteToPlay = new BMNote(instrumentId, tomMidiInstrumentId, tomPitch, volume);
                }
                else if (angleRate > tamAngleRate) {
                    noteToPlay = new BMNote(instrumentId, tamMidiInstrumentId, tamPitch, volume);
                }
            }
            else if (timeSinceLastPlayed % minDuration == 0) {
                player.play(noteToPlay);
                server.notePlayed(noteToPlay);
                noteToPlay = null;
                timeSinceLastPlayed = 0;
            }
        }
    }
}
