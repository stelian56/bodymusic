var bmprocessor = (function() {

    var angleAssignment = { yaw: "group", roll: "row", pitch: "column" };
    var angleRanges = { yaw: [-Math.PI, Math.PI], roll: [-Math.PI, Math.PI],
                        pitch: [-0.4*Math.PI, 0.4*Math.PI] };
    var nodeCounts = { group: 8, row: 8, column: 8 };
    var overlap = 0.1;
    var currentNode;
    
    var grid = [
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
        "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY"
    ];

    var update = function(data) {
        var node = {};
        var groupIndex, rowIndex, columnIndex;
        var nodeChanged = !currentNode && true;
        $.each(data.angles, function(key, value) {
            var assignment = angleAssignment[key];
            var nodeCount = nodeCounts[assignment];
            if (nodeCount > 1) {
                var angleRange = angleRanges[key];
                var angleMin = angleRange[0];
                var angleMax = angleRange[1];
                if (value < angleMin || value > angleMax) {
                    nodeChanged = false;
                    return false;
                }
                var gap = (angleMax - angleMin)/(nodeCount - 1);
                var nodeIndex = Math.round((value - angleMin)/gap);
                node[assignment] = nodeIndex;
                if (!nodeChanged) {
                    var currentNodeIndex = currentNode[assignment];
                    if (Math.abs(value - (angleMin + currentNodeIndex*gap)) > 0.5*gap*(1 + 2*overlap)) {
                        nodeChanged = true;
                    }
                }
            }
        });
        if (nodeChanged) {
            var pitch = grid[node.row*nodeCounts.row + node.group][node.column];
            bmplayer.update(pitch);
            currentNode = node;
//            console.log(JSON.stringify(node, null) + " " + pitch);
        }
    };

    var stop = function() {
        currentNode = null;
    }
    
    return {
        update: update,
        stop: stop
    };
})();

var bmplayer = (function() {

    var pitches = {
        "A": {name: "C3"},
        "B": {name: "C#3"},
        "C": {name: "D3"},
        "D": {name: "D#3"},
        "E": {name: "E3"},
        "F": {name: "F3"},
        "G": {name: "F#3"},
        "H": {name: "G3"},
        "I": {name: "G#3"},
        "J": {name: "A3"},
        "K": {name: "A#3"},
        "L": {name: "B3"},
        "M": {name: "C4"},
        "N": {name: "C#4"},
        "O": {name: "D4"},
        "P": {name: "D#4"},
        "Q": {name: "E4"},
        "R": {name: "F4"},
        "S": {name: "F#4"},
        "T": {name: "G4"},
        "U": {name: "G#4"},
        "V": {name: "A4", frequency: 440},
        "W": {name: "A#4"},
        "X": {name: "B4"},
        "Y": {name: "C5"}
    };
    var refPitch = "V";
    $.each(pitches, function(key) {
        var offset = key.charCodeAt(0) - refPitch.charCodeAt(0);
        if (offset != 0) {
            this.frequency = pitches[refPitch].frequency*Math.pow(2, offset/12);
        }
    });
    
    var contextClass = window.AudioContext || window.webkitAudioContext;
    var context = new contextClass();
    var attack = 0.001
    var release = 0.5;
    var spacing = 0.25;
    var checkInterval = 0.025;
    var lookahead = 0.05;
    var lastNote;
    var nextPitch;
    var timer;
    
    var update = function(pitch) {
        nextPitch = pitch;
    }

    var scheduleNote = function(pitch, time) {
        if (lastNote) {
            lastNote.stop(time);
        }
        var note = context.createOscillator();
        var frequency = pitches[pitch].frequency;
        note.frequency.setValueAtTime(frequency, time);
        var envelope = context.createGain();
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.setTargetAtTime(1, time, attack);
        envelope.gain.setTargetAtTime(0, time + attack, release);
        note.connect(envelope);
        envelope.connect(context.destination);
        note.start(time);
        lastNote = note;
//        console.log(nextPitch);
    };

    var start = function() {
        timer = setInterval(function() {
            if (nextPitch) {
                var currentTime = context.currentTime;
                var tick = Math.floor((currentTime + lookahead)/spacing);
                var time = tick*spacing;
                if (Math.floor(currentTime < time)) {
                    scheduleNote(nextPitch, time);
                    nextPitch = null;
                }
            }
        }, checkInterval*1000);
    };
    
    var stop = function() {
        if (timer) {
            clearInterval(timer);
        }
    };
    
    return {
        start: start,
        update: update,
        stop: stop
    };
})();

var defaultUpdateRate = 20;

var bmplotter = (function() {

    var plotProps = [
        {
            title: "Pitch",
            sensorId: 0,
            maxValue: 0.5*Math.PI,
            key: "angles",
            series: [
                {key: "pitch", name: "pitch", color: "magenta"}
            ],
            scale: 1,
            unit: ""
        },
        {
            title: "Yaw",
            sensorId: 0,
            maxValue: Math.PI,
            key: "angles",
            series: [
                {key: "yaw", name: "yaw", color: "green"}
            ],
            scale: 1,
            unit: ""
        },
        {
            title: "Roll",
            sensorId: 0,
            maxValue: Math.PI,
            key: "angles",
            series: [
                {key: "roll", name: "roll", color: "blue"}
            ],
            scale: 1,
            unit: ""
        }
    ];
    var plotUpdateInterval = 1;
    var plotStep = 2;

    var plotHeight = 300 / plotProps.length;
    var plotMargin = 10;
    var lineWidth = 2;
    var markerRadius = 4;
    var bodyRect;
    var plots = [];
    var clock = new (function() {
        this.tick = 0;
    })();

    var createRibbon = function() {
        bodyRect = document.body.getBoundingClientRect();
        var ribbon = $("<div/>", {
            class: "bodymusic_ribbon"
        }).appendTo("body");
        $.each(plotProps, function() {
            $.each(this.series, function() {
                var iconDiv = $("<div/>", {
                    class: "bodymusic_legendicon"
                }).appendTo(ribbon);
                iconSvg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
                    .appendTo(iconDiv);
                $(document.createElementNS("http://www.w3.org/2000/svg", "line")).attr({
                    x1: 0,
                    x2: 20,
                    y1: 10,
                    y2: 10,
                    stroke: this.color,
                    "stroke-width": lineWidth*2
                }).css("display", "inline").appendTo(iconSvg);
                $("<span/>", {
                    class: "bodymusic_legendlabel"
                }).appendTo(ribbon).html(this.name);
            });
        });
    };

    var createPlots = function() {
        var strokeIndex;
        $.each(plotProps, function() {
            var thisPlotProps = this;
            var $plotElement;
            var plot;
            var $svg;
            var veil;
            var series = [];
            var plotWidth;
            
            var createCanvas = function() {
                $plotElement = $("<div/>", {
                    class: "bodymusic_plot"
                }).appendTo("body");
                plotWidth = $plotElement.width();
                $plotElement.height(plotHeight);
                $svg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
                    .appendTo($plotElement);
            };
            
            var createVeil = function() {
                veil = document.createElement("div");
                $(veil).attr({
                    class: "bodymusic_veil"
                }).appendTo($plotElement);
            };
            
            var createAxis = function() {
                var axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
                $(axis).attr({
                    x1: 0,
                    x2: plotWidth,
                    y1: plotHeight/2,
                    y2: plotHeight/2,
                    stroke: "gray",
                    "stroke-dasharray": "5,3"
                }).appendTo($svg);
                axis.style.display = "inline";
            };
            
            var createLabels = function() {
                var zeroLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                $(maxLabel).attr({
                    x: 5,
                    y: plotHeight/2 - 5
                }).appendTo($svg);
                var maxLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                $(maxLabel).attr({
                    x: 5,
                    y: 15
                }).appendTo($svg);
                maxLabel.textContent = (thisPlotProps.maxValue * thisPlotProps.scale).toFixed(0) +
                    " " + thisPlotProps.unit;
                var minLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                $(minLabel).attr({
                    x: 5,
                    y: plotHeight - 5
                }).appendTo($svg);
                minLabel.textContent = (-thisPlotProps.maxValue * thisPlotProps.scale).toFixed(0) +
                    " " + thisPlotProps.unit;
                var plotLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                $(plotLabel).attr({
                    x: 50,
                    y: 15
                }).appendTo($svg);
                plotLabel.textContent = thisPlotProps.title;
            };
        
            var createPlot = function() {
                var yBase = plotHeight/2;
                plot = {
                    key: thisPlotProps.key,
                    id: thisPlotProps.sensorId,
                    yBase: yBase,
                    yScale: yBase/thisPlotProps.maxValue,
                    veil: veil,
                    series: series,
                    currentStrokeIndex: -1,
                    history: []
                };
                plot.strokeCount = Math.floor((plotWidth - 2*plotMargin)/plotStep);
                plots.push(plot);
            };

            var createSlider = function() {
                var slider = document.createElementNS("http://www.w3.org/2000/svg", "line");
                $(slider).attr({
                    x1: 0,
                    x2: 0,
                    y1: 0,
                    y2: plotHeight,
                    stroke: "gray"
                }).appendTo($svg);
                var tooltip = document.createElement("div");
                $(tooltip).attr({
                    class: "bodymusic_tooltip"
                }).appendTo("body");
                slider.tooltip = tooltip;
                plot.slider = slider;
                $plotElement.mouseover(function() {
                    slider.style.display = "inline";
                    $plotElement.css("cursor", "none");
                });
                $plotElement.mouseout(function() {
                    slider.style.display = "none";
                    slider.tooltip.style.display = "none";
                });
                $plotElement.mousemove(function(event) {
                    var eventX = event.clientX - bodyRect.left;
                    var strokeIndex = Math.floor((eventX - plotMargin) / plotStep);
                    var history = plot.history;
                    if (strokeIndex > -1 && strokeIndex < history.length) {
                        $(slider).attr({
                            x1: eventX,
                            x2: eventX
                        });
                        var tooltipText = "";
                        var data = history[strokeIndex];
                        var plotKey = plot.key;
                        tooltipText = "Time: " + data.time.toFixed(2) + " sec";
                        $.each(plot.series, function() {
                            var value = data[plotKey][this.key] * thisPlotProps.scale;
                            tooltipText += "<br>" + this.name + ": " +
                                value.toFixed(5) + " " + thisPlotProps.unit;
                        });
                        tooltip.style.display = "inline-block";
                        tooltip.style.left = eventX - 30 + "px";
                        tooltip.style.top = event.clientY + 10 + "px";
                    }
                    else {
                        tooltip.style.display = "none";
                    }
                    tooltip.innerHTML = tooltipText;
                });
            };
        

            var createSeries = function() {
                $.each(thisPlotProps.series, function() {
                    var color = this.color;
                    var strokes = [];
                    var marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    var thisSeries = {
                        key: this.key,
                        name: this.name,
                        strokes: strokes,
                        marker: marker
                    };
                    series.push(thisSeries);
                    for (strokeIndex = 0; strokeIndex < plot.strokeCount; strokeIndex++) {
                        var stroke = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        $(stroke).attr({
                            x1: plotMargin + strokeIndex*plotStep,
                            x2: plotMargin + (strokeIndex + 1)*plotStep,
                            y1: plotHeight/2,
                            y2: plotHeight/2,
                            stroke: color,
                            "stroke-width": lineWidth,
                            "stroke-linecap": "round"
                        }).appendTo($svg);
                        strokes.push(stroke);
                    }
                    $(marker).attr({
                        cx: 0,
                        cy: 0,
                        r: markerRadius,
                        stroke: color,
                        fill: color
                    }).appendTo($svg);
                });
            };
            
            createCanvas();
            createVeil();
            createAxis();
            createLabels();
            createPlot();
            createSlider();
            createSeries();
        });
    };

    var updatePlots = function(data) {
        $.each(plots, function() {
            var plot = this;
            if (plot.sensorId = data.id) {
                if (plot.currentStrokeIndex < plot.strokeCount - 1) {
                    plot.currentStrokeIndex++;
                }
                else {
                    plot.currentStrokeIndex = 0;
                }
                var x = plotMargin + (plot.currentStrokeIndex + 1)*plotStep;
                var thisPlotProps = plotProps[plot.key];
                var ys = data[plot.key];
                if (ys) {
                    $.each(plot.series, function() {
                        var series = this;
                        var y = ys[series.key];
                        var strokes = series.strokes;
                        var marker = series.marker;
                        var yScaled = plot.yBase - y*plot.yScale;
                        var stroke = strokes[plot.currentStrokeIndex];
                        stroke.setAttribute("y2", yScaled);
                        marker.setAttribute("cx", x);
                        marker.setAttribute("cy", yScaled);
                        if (plot.currentStrokeIndex > 0) {
                            var prevY = strokes[plot.currentStrokeIndex - 1].getAttribute("y2");
                            stroke.setAttribute("y1", prevY);
                            stroke.style.display = "inline";
                            marker.style.display = "inline";
                        }
                    });
                }
                var history = plot.history;
                if (plot.currentStrokeIndex < history.length) {
                    history[plot.currentStrokeIndex] = data;
                }
                else {
                    history.push(data);
                }
                plot.veil.style.left = x + "px";
            }
        });
    };

    var update = function(data) {
        if (clock.tick++ % plotUpdateInterval == 0) {
            updatePlots(data);
        }
    };
    
    var init = function() {
        createRibbon();
        createPlots();
    };
    
    return {
        init: init,
        update: update
    };
})();

var bmconsole = (function() {

    var updateRateInput;
    var logFileInput;
    var websocketPort = 8081;
    var websocket;

    var startWebSocket = function() {
        if (!websocket || websocket.readyState != WebSocket.OPEN) {
            websocket = new WebSocket("ws://localhost:" + websocketPort);
            websocket.onmessage = function(event) {
                var data = JSON.parse(event.data);
                bmprocessor.update(data);
                bmplotter.update(data);
            };
        }
    };

    var stop = function() {
        var request = new XMLHttpRequest();
        request.open("GET", "/?command=stop", true);
        request.send();
        bmplayer.stop();
        bmprocessor.stop();
    };

    var start = function() {
        bmplayer.start();
        startWebSocket();
        var updateRateString = updateRateInput.val();
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
        var logFile = logFileInput.val();
        if (logFile) {
            var query = "/?command=playback";
            query += "&logFile=" + logFile;
        }
        var request = new XMLHttpRequest();
        request.open("GET", query, true);
        request.send();
    };
    
    var getLogFiles = function() {
        var request = new XMLHttpRequest();
        request.onload = function() {
            $.each(request.responseText.split(","), function() {
                logFileInput.append($("<option></option>").text(this));
            });
        };
        request.open("GET", "/?command=getLogFiles", true);
        request.send();
    };

    var init = function() {
        var stopButton = $("<input/> ").attr({
            type: "button",
            class: "bodymusic_button",
            value: "Stop"
        }).appendTo($("body"));
        stopButton.click(function() {
            stop();
        });
        $("<span>Update rate (Hz):</span>").appendTo($("body"));
        updateRateInput = $("<input/>").attr({
            type: "text",
            class: "bodymusic_updaterate",
            value: defaultUpdateRate,
            list: "updateRates"
        }).appendTo($("body"));
        var dataList = $("<datalist/>").attr({
            id:"updateRates"
        }).appendTo($("body"));
        $.each([1, 2, 4, 10, 20, 50, 100], function() {
            $('<option value="' + this + '">').appendTo(dataList);
        });
        var startButton = $("<input/>").attr({
            type: "button",
            class: "bodymusic_button",
            value: "Start"
        }).appendTo($("body"));
        startButton.click(function() {
            start();
        });
        logFileInput = $("<select>").attr({
            class: "bodymusic_logfile"
        }).appendTo($("body"));
        getLogFiles();
        var playbackButton = $("<input/>").attr({
            type: "button",
            class: "bodymusic_button",
            value: "Playback"
        }).appendTo($("body"));
        playbackButton.click(function() {
            playback();
        });
    };

    return {
        init: init
    };
})();

$(document).ready(function() {
    bmconsole.init();
    bmplotter.init();
});
