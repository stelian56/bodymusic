package net.geocentral.bodymusic;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BMSensorTracker {

    private static final int sensorDataPort = 12345;
    private static final DateFormat dateFormat = new SimpleDateFormat("ddMMyyyy");
    private BMServer server;
    private Map<Integer, BMSensor> sensors;
    private BMMusicController musicController;
    private PrintWriter logWriter;
    private String playbackFileName;
    private ExecutorService executor;
    
    public BMSensorTracker(BMServer server, BMMusicController musicController, String playbackFileName) {
        this.server = server;
        this.musicController = musicController;
        this.playbackFileName = playbackFileName;
        sensors = new HashMap<Integer, BMSensor>();
        ThreadFactory threadFactory = new BMThreadFactory("Body Music Sensor Tracker");
        if (playbackFileName == null) {
            executor = Executors.newCachedThreadPool(threadFactory);
        }
        else {
            executor = Executors.newScheduledThreadPool(1, threadFactory);
        }
    }

    private void sensorDataReceived(BMSensorData sensorData) {
        int sensorId = sensorData.getSensorId();
        BMSensor sensor = sensors.get(sensorId);
        if (sensor == null) {
            sensor = new BMSensor(sensorId);
            sensors.put(sensorId, sensor);
        }
        sensor.update(sensorData);
        musicController.sensorUpdated(sensor);
        server.sensorUpdated(sensor);
    }

    public void start() throws Exception {
        if (playbackFileName == null) {
            startSensorDataListener();
        }
        else {
            System.out.println("Press Enter to start playback");
            System.in.read();
            startPlayBack();
        }
    }

    private void startPlayBack() throws Exception {
        BufferedReader firstLinesReader =
                new BufferedReader(new FileReader(new File(BMPlayBack.logDirName, playbackFileName)));
        String line;
        final BMSensorData sensorData = new BMSensorData();
        Set<Integer> sensorIds = new HashSet<Integer>();
        for (int lineIndex = 0; lineIndex < 10; lineIndex++) {
            line = firstLinesReader.readLine();
            sensorData.fromString(line);
            sensorIds.add(sensorData.getSensorId());
        }
        firstLinesReader.close();
        int sensorCount = sensorIds.size();
        final BufferedReader reader =
                new BufferedReader(new FileReader(new File(BMPlayBack.logDirName, playbackFileName)));
        int period = (int)(1e3/sensorData.getUpdateRate()/sensorCount);
        final Runnable worker = new Runnable() {
            public void run() {
                try {
                    String line = reader.readLine();
                    if (line == null) {
                        System.out.println("Playback finished");
                        System.exit(0);
                    }
                    else {
                        sensorData.fromString(line);
                        sensorDataReceived(sensorData);
                    }
                }
                catch (Throwable throwable) {
                    throwable.printStackTrace();
                }
            }
        };
        ((ScheduledExecutorService)executor).scheduleAtFixedRate(worker, 0, period, TimeUnit.MILLISECONDS);
    }
    
    private void startSensorDataListener() throws Exception {
        executor.execute(new Runnable() {
            public void run() {
                try {
                    openLogWriter();
                    ServerSocket serverSocket = new ServerSocket(sensorDataPort);
                    System.out.println(String.format("Started listening for sensor data on port %d", sensorDataPort));
                    Socket socket = serverSocket.accept();
                    InputStream stream = socket.getInputStream();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
                    System.out.println(String.format("Sensor client %s connected", socket.getInetAddress()));
                    while (true) {
                        BMSensorData sensorData = new BMSensorData();
                        if (!sensorData.read(reader)) {
                            shutdown();
                            return;
                        }
                        sensorDataReceived(sensorData);
                        logWriter.println(sensorData);
                        logWriter.flush();
                    }
                }
                catch (Exception exception) {
                    shutdown();
                    return;
                }
            }
        });
    }
    
    private void openLogWriter() throws Exception {
        File logDir = new File(BMPlayBack.logDirName);
        if (!logDir.exists()) {
            logDir.mkdir();
        }
        String dateLabel = dateFormat.format(new Date());
        int fileNumber = 1;
        Pattern fileNamePattern = Pattern.compile(dateLabel + "\\.(\\d+)\\.log"); 
        for (String fileName : logDir.list()) {
            Matcher matcher = fileNamePattern.matcher(fileName);
            if (matcher.matches()) {
                int thisFileNumber = Integer.valueOf(matcher.group(1));
                fileNumber = Math.max(fileNumber, thisFileNumber + 1);
            }
        }
        File file = new File(logDir, String.format("%s.%s.log", dateLabel, fileNumber));
        file.createNewFile();
        logWriter = new PrintWriter(file);
        
    }
    
    private void shutdown() {
        System.out.println("Server stopped");
        logWriter.close();
        executor.shutdownNow();
    }
}
