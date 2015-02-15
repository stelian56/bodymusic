var bm = (function() {

    var websocketPort = 8081;
    var websocket;
    
    var startWebSocket = function() {
        if (!websocket || websocket.readyState != WebSocket.OPEN) {
            websocket = new WebSocket("ws://localhost:" + websocketPort);
            websocket.onmessage = function(event) {
                var sensorData = JSON.parse(event.data);
                console.log(JSON.stringify(sensorData, null, 0));
            };
        }
    };

    var stop = function() {
        var request = new XMLHttpRequest();
        request.open("GET", "/?command=stop", true);
        request.send();
    };

    var start = function() {
        startWebSocket();
        var updateRateString = $("#updateRate").val();
        var updateRate = parseInt(updateRateString);
        var query = "/?command=start";
        if (updateRate) {
            query += "&updateRate=" + updateRate;
        }
        var request = new XMLHttpRequest();
        request.open("GET", query, true);
        request.send();
    };

    var playback = function() {
        startWebSocket();
        var logFile = $("#logFiles").val();
        if (logFile) {
            var query = "/?command=playback";
            query += "&logFile=" + logFile;
        }
        var request = new XMLHttpRequest();
        request.open("GET", query, true);
        request.send();
    };
    
    var parseInputs = function() {
        $("#stop").click(stop);
        $("#start").click(start);
        $("#playback").click(playback);
    };

    var getLogFiles = function() {
        var request = new XMLHttpRequest();
        request.onload = function() {
            $.each(request.responseText.split(","), function() {
                $("#logFiles").append($("<option></option>").text(this));
            });
        };
        request.open("GET", "/?command=getLogFiles", true);
        request.send();
    }
    
    var init = function() {
        getLogFiles();
        parseInputs();
        startWebSocket();
    };
    
    return {
        init: init
    };
})();

$(document).ready(function() {
    bm.init();
});
