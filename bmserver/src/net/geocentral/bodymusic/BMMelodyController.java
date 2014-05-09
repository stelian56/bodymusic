package net.geocentral.bodymusic;

public class BMMelodyController implements BMVoiceController {

    private static final int midiInstrumentId = 0;
    private static final int volume = 60;
    private int instrumentId;
    private BMServer server;
    private BMDurationController durationController;
    private BMDirectionController directionController;
    private BMScaleController scaleController;
    private BMScaleBaseController scaleBaseController;
    private BMPitchController pitchController;
    private BMPlayer player;

    public BMMelodyController(int instrumentId, BMServer server, BMPlayer player) {
        this.instrumentId = instrumentId;
        this.server = server;
        this.player = player;
        durationController = new BMDurationController();
        directionController = new BMDirectionController();
        scaleController = new BMScaleController();
        scaleBaseController = new BMScaleBaseController();
        pitchController = new BMPitchController();
    }

    public void sensorUpdated(BMSensor sensor) {
        if (sensor.isEnabled()) {
            durationController.sensorUpdated(sensor);
            directionController.sensorUpdated(sensor);
            scaleController.sensorUpdated(sensor);
            scaleBaseController.sensorUpdated(sensor);
            if (durationController.isTimeToPlay()) {
                int direction = directionController.getDirection();
                int[] scale = scaleController.getScale(direction);
                int scaleBase = scaleBaseController.getScaleBase();
                int pitch = pitchController.getPitch(scale, scaleBase, direction);
                BMNote note = new BMNote(instrumentId, midiInstrumentId, pitch, volume);
                player.play(note);
                server.notePlayed(note);
                durationController.notePlayed();
            }
        }
    }
}
