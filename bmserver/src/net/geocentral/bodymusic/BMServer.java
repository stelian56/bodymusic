package net.geocentral.bodymusic;

public class BMServer {

    private BMWebServer webServer;
    private BMSensorTracker sensorTracker;
    private BMMusicController musicController;
    
    public BMServer(String playbackFileName) {
        webServer = new BMWebServer();
        musicController = new BMMusicController(this);
        sensorTracker = new BMSensorTracker(this, musicController, playbackFileName);
    }
    
    public BMServer() {
        this(null);
    }

    public void start() throws Exception {
        webServer.start();
        sensorTracker.start();
        musicController.start();
    }

    public void sensorUpdated(BMSensor sensor) {
        webServer.sensorUpdated(sensor);
    }

    public void notePlayed(BMNote note) {
        webServer.notePlayed(note);
    }
    
    public void stopRequested() throws Exception {
        webServer.stop();
    }

    public static void main(String[] args) throws Exception {
        BMServer server = new BMServer();
        server.start();
    }
}
