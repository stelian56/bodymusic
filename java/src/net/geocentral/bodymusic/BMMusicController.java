package net.geocentral.bodymusic;

import java.util.HashMap;
import java.util.Map;

public class BMMusicController {

    public static final int minDuration = 25; // update ticks
    private static final int melodySensorId = 0;
    private static final int percussionSensorId = 1;
    private Map<Integer, BMVoiceController[]> voiceControllers;
    private BMPlayer player;

    public BMMusicController(BMServer server) {
        player = new BMPlayer();
        voiceControllers = new HashMap<Integer, BMVoiceController[]>();
        BMVoiceController[] melodyControllers = { new BMMelodyController(0, server, player) };
        BMVoiceController[] percussionControllers = { new BMTomTamController(1, server, player) };
        voiceControllers.put(melodySensorId, melodyControllers);
        voiceControllers.put(percussionSensorId, percussionControllers);
    }

    public void start() throws Exception {
        player.init();
    }

    public void sensorUpdated(BMSensor sensor) {
        int sensorId = sensor.getId();
        for (BMVoiceController voiceController : voiceControllers.get(sensorId)) {
            voiceController.sensorUpdated(sensor);
        }
    }
}
