var defaultUpdateRate = 50;

var instruments = {
    "0": {
        grid: "blues"
    },
    "1": {
        grid: "marchCan"
    }
};

var channels = {
    0: {
        name: "piano",
        voice: 0x0
    },
    1: {
        name: "tom",
        voice: 0x76
    },
    2: {
        name: "tam",
        voice: 0x73
    },
    3: {
        name: "march",
        voice: 0x74
    },
    4: {
        name: "can",
        voice: 0x71
    },
};

var grids = {
    "blues": {
        angleAssignment: { yaw: "group", roll: "row", pitch: "column" },
        angleRanges: {
            yaw: [-Math.PI, Math.PI],
            roll: [-Math.PI, Math.PI],
            pitch: [-0.4*Math.PI, 0.4*Math.PI]
        },
        counts: { group: 2, row: 4, column: 13 },
        overlap: 0.1,
        nodes: [
            "ADFGHKMPRSTWY","ADFGHKMPRSTWY",
            "ADFGHKMPRSTWY","ADFGHKMPRSTWY",
            "ADFGHKMPRSTWY","ADFGHKMPRSTWY",
            "ADFGHKMPRSTWY","ADFGHKMPRSTWY"
        ]
    },
    "marchCan": {
        angleAssignment: { yaw: "row", roll: "column", pitch: "group" },
        angleRanges: {
            yaw: [-Math.PI, Math.PI],
            roll: [-Math.PI/2, Math.PI/2],
            pitch: [-0.4*Math.PI, 0.4*Math.PI]
        },
        counts: { group: 2, row: 1, column: 4 },
        overlap: 0.1,
        nodes: [
            "3KKKK","4TTTT"
        ]
    },
    "desertWind": {
        angleAssignment: { yaw: "group", roll: "row", pitch: "column" },
        angleRanges: {
            yaw: [-Math.PI, Math.PI],
            roll: [-Math.PI, Math.PI],
            pitch: [-0.4*Math.PI, 0.4*Math.PI]
        },
        counts: { group: 8, row: 6, column: 8 },
        overlap: 0.1,
        nodes: [
            "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
            "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
            "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
            "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
            "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY",
            "MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY","MNQRTUXY"
        ]
    },
    "tomTam": {
        angleAssignment: { yaw: "row", roll: "column", pitch: "group" },
        angleRanges: {
            yaw: [-Math.PI, Math.PI],
            roll: [-Math.PI/2, Math.PI/2],
            pitch: [-0.4*Math.PI, 0.4*Math.PI]
        },
        counts: { group: 2, row: 1, column: 4 },
        overlap: 0.1,
        nodes: [
            "1MMMM","2TTTT"
        ]
    }
};

var plotProps = [
    {
        title: "Sensor 0 Pitch",
        sensorId: "0",
        maxValue: 0.5*Math.PI,
        key: "angles",
        series: [
            {key: "pitch", name: "Sensor 0 pitch:", color: "magenta"}
        ],
        scale: 180/Math.PI,
        decimals: 0,
        unit: "°"
    },
    {
        title: "Sensor 0 Yaw",
        sensorId: "0",
        maxValue: Math.PI,
        key: "angles",
        series: [
            {key: "yaw", name: "Sensor 0 yaw:", color: "green"}
        ],
        scale: 180/Math.PI,
        decimals: 0,
        unit: "°"
    },
    {
        title: "Sensor 0 Roll",
        sensorId: "0",
        maxValue: Math.PI,
        key: "angles",
        series: [
            {key: "roll", name: "Sensor 0 roll:", color: "blue"}
        ],
        scale: 180/Math.PI,
        decimals: 0,
        unit: "°"
    },
    {
        title: "Sensor 1 left",
        sensorId: "1",
        maxValue: 3,
        key: "acceleration",
        series: [
            {key: "left", name: "Sensor 1 left:", color: "magenta"}
        ],
        scale: 1,
        decimals: 1,
        unit: "g"
    },
    {
        title: "Sensor 1 up",
        sensorId: "1",
        maxValue: 3,
        key: "acceleration",
        series: [
            {key: "up", name: "Sensor 1 up", color: "green"}
        ],
        scale: 1,
        decimals: 1,
        unit: "g"
    },
    {
        title: "Sensor 1 fwd",
        sensorId: "1",
        maxValue: 3,
        key: "acceleration",
        series: [
            {key: "fwd", name: "Sensor 1 fwd", color: "blue"}
        ],
        scale: 1,
        decimals: 1,
        unit: "g"
    }
];

var bmJoltProcessor = (function() {

    var constructor = function(sensorId, jolts) {
        this.sensorId = sensorId;
        this.left = jolts.left;
        this.up = jolts.up;
        this.fwd = jolts.fwd;
        this.currentDir = null;
    };
    
    constructor.prototype.update = function(data) {
        var acc = data["acceleration"];
        var ax = acc.ax;
        var ay = acc.ay;
        var az = acc.az;
        var a = [ax, ay, az];
        var m = data["matrix"];
        var max = m.m00*ax + m.m10*ay + m.m20*az;
        var may = m.m01*ax + m.m11*ay + m.m21*az;
        var maz = -(m.m02*ax + m.m12*ay + m.m22*az);
        
        if (Math.abs(may) > 1) {
            var pitch = "K";
            var channel = 3;
            var voice = channels[channel].voice;
            var note = { pitch: pitch, voice: voice, channel: channel };
            bmplayer.update(note);
        }
        if (Math.abs(max) > 1) {
            var pitch = "T";
            var channel = 4;
            var voice = channels[channel].voice;
            var note = { pitch: pitch, voice: voice, channel: channel };
            bmplayer.update(note);
        }
        
        data.acceleration.left = max;
        data.acceleration.up = may;
        data.acceleration.fwd = maz;
    };
    
    return constructor;
})();

var bmGridProcessor = (function() {

    var constructor = function(sensorId, grid) {
        this.sensorId = sensorId;
        this.grid = grid;
        this.currentNode = null;
    };
    
    constructor.prototype.update = function(data) {
        if (data.id == this.sensorId) {
            var currentNode = this.currentNode;
            var grid = this.grid;
            var nodeChanged = !currentNode && true;
            var node = {};
            var groupIndex, rowIndex, columnIndex;
            $.each(data.angles, function(key, value) {
                var assignment = grid.angleAssignment[key];
                var nodeCount = grid.counts[assignment];
                if (nodeCount > 1) {
                    var angleRange = grid.angleRanges[key];
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
                        if (Math.abs(value - (angleMin + currentNodeIndex*gap)) >
                                0.5*gap*(1 + 2*grid.overlap)) {
                            nodeChanged = true;
                        }
                    }
                }
                else {
                    node[assignment] = 0;
                }
            });
            if (nodeChanged) {
                var pitches = grid.nodes[node.row*grid.counts.group + node.group];
                var channel = parseInt(pitches[0]);
                var pitch;
                if (channel) {
                    pitch = pitches[node.column + 1];
                }
                else {
                    channel = 0;
                    pitch = pitches[node.column];
                }
                var voice = channels[channel].voice;
                var note = { pitch: pitch, voice: voice, channel: channel };
                if (currentNode) {
                    bmplayer.update(note);
                }
                this.currentNode = node;
            }
        }
    };

    constructor.prototype.stop = function() {
        currentNode = null;
    }

    return constructor;
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
    
    var spacing = 0.25;
    var checkInterval = 0.025;
    var lookahead = 0.05;
    var scheduledNotes = [];
    var currentNotes = [];
    var timer;
    var startTime = 1e-3*performance.now();
    
    var midi;
    navigator.requestMIDIAccess().then(function(midiAccess) {
        midi = midiAccess.outputs.get(0);
    });

    var noteOn = function(note, tick) {
        var noteCode = note.pitch.charCodeAt(0) - "M".charCodeAt(0) + 60;
        var status = 0x90 | note.channel;
        var message = [status, noteCode, 0x7f];
        var time = startTime + tick*spacing;
        midi.send(message, time*1000);
    };
    
    var noteOff = function(note, tick) {
        var noteCode = note.pitch.charCodeAt(0) - "M".charCodeAt(0) + 60
        var status = 0x80 | note.channel;
        var message = [status, noteCode, 0x40];
        var time = startTime + tick*spacing - 0.001;
        midi.send(message, time*1000);
    };
    
    var update = function(note) {
        var channel = note.channel;
        currentNotes[channel] = note;
    };

    var scheduleNote = function(tick, channel) {
        var scheduledNote = scheduledNotes[channel];
        if (scheduledNote) {
            noteOff(scheduledNote.note, tick);
        }
        var currentNote = currentNotes[channel];
        noteOn(currentNote, tick);
        scheduledNotes[channel] = {note: currentNote, tick: tick};
    };

    var start = function() {
        $.each(channels, function(channel) {
            var status = 0xc0 | channel;
            var message = [status, this.voice];
            midi.send(message);
        });
        timer = setInterval(function() {
            $.each(currentNotes, function(channel, currentNote) {
                if (currentNote) {
                    var time = 1e-3*performance.now() - startTime;
                    var tick = Math.floor((time + lookahead)/spacing);
                    var scheduledNote = scheduledNotes[channel];
                    if (!scheduledNote || scheduledNote.tick != tick) {
                        if (tick*spacing > time) {
                            scheduleNote(tick, channel);
                            currentNotes[channel] = null;
                        }
                    }
                }
            });
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

var bmplotter = (function() {

    var plotUpdateInterval = 1;
    var plotStep = 2;

    var plotHeight = 800 / plotProps.length;
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
                    thisPlotProps.unit;
                var minLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                $(minLabel).attr({
                    x: 5,
                    y: plotHeight - 5
                }).appendTo($svg);
                minLabel.textContent = (-thisPlotProps.maxValue * thisPlotProps.scale).toFixed(0) +
                    thisPlotProps.unit;
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
                    sensorId: thisPlotProps.sensorId,
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
                                value.toFixed(thisPlotProps.decimals) + " " + thisPlotProps.unit;
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
            if (plot.sensorId == data.id) {
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
    var processors = [];

    var startWebSocket = function() {
        if (!websocket || websocket.readyState != WebSocket.OPEN) {
            websocket = new WebSocket("ws://localhost:" + websocketPort);
            websocket.onmessage = function(event) {
                var data = JSON.parse(event.data);
                $.each(processors, function() {
                    this.update(data);
                });
                bmplotter.update(data);
            };
        }
    };

    var stop = function() {
        var request = new XMLHttpRequest();
        request.open("GET", "/?command=stop", true);
        request.send();
        bmplayer.stop();
        $.each(processors, function() {
            this.stop();
        });
    };

    var startProcessors = function() {
        processors = [];
        $.each(instruments, function(sensorId, processorProps) {
            var processor;
            var gridName = processorProps.grid;
            if (gridName) {
                var grid = grids[gridName];
                processor = new bmGridProcessor(sensorId, grid);
            }
            else {
                var jolts = processorProps.jolts;
                processor = new bmJoltProcessor(sensorId, jolts);
            }
            processors.push(processor);
        });
    };
    
    var startPlayer = function() {
        bmplayer.start();
    };
    
    var start = function() {
        startProcessors();
        startPlayer();
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
        startProcessors();
        startPlayer();
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
        if (websocket) {
            websocket.close();
        }
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
