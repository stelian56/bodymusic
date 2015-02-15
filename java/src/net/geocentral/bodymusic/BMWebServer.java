package net.geocentral.bodymusic;

import java.net.InetSocketAddress;
import java.util.Collection;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class BMWebServer {

    private static final int httpPort = 8080;
    private WebSocketServer webSocketServer;
    
    public void start() throws Exception {
        webSocketServer = new WebSocketServer() {
            public void onOpen(WebSocket webSocket, ClientHandshake handshake) {
                String clientAddress = webSocket.getRemoteSocketAddress().getAddress().getHostAddress();
                System.out.println(String.format("Web client %s connected", clientAddress));
            }
            public void onMessage(WebSocket webSocket, String message) {
                System.out.println(String.format("Message received from client: %s", message));
            }
            public void onError(WebSocket arg0, Exception exception) {
                exception.printStackTrace();
            }
            public void onClose(WebSocket webSocket, int code, String reason, boolean remote) {
                System.out.println("Web client disconnected");
            }
        };
        webSocketServer.setAddress(new InetSocketAddress(httpPort));
        webSocketServer.start();
        System.out.println(String.format("Started web socket server on port %s", httpPort));
    }

    public void sensorUpdated(BMSensor sensor) {
        String json = sensor.toJson();
        sendMessage(json);
    }

    public void notePlayed(BMNote note) {
        String json = note.toJson();
        sendMessage(json);
    }
    
    public void sendMessage(String message) {
        Collection<WebSocket> webSockets = webSocketServer.connections();
        synchronized(webSockets) {
            for (WebSocket webSocket : webSockets) {
                webSocket.send(message);
            }
        }
    }
    
    public void stop() throws Exception {
        webSocketServer.stop();
    }
}
