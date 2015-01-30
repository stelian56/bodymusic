$(function() {

    var host = "ws://localhost:8080";
    
    // var instruments = {0: [0], 1: [1]}; // key = sensor ID, value = IDs of associated instruments
    // var plotHeight = 160;
    // var staffHeight = 120;
    // var plotUpdateFrequency = 1;
    var instruments = {0: [0]}; // key = sensor ID, value = IDs of associated instruments
    var plotHeight = 420;
    var staffHeight = 0;
    var plotUpdateFrequency = 2;
    
    var staffStep = 1.5;
    var c4Pitch = 48;
    var stemHeight = 12;
    var noteHeadRx = 4;
    var noteHeadRy = 2.5;
    var plotMargin = 10;
    var plotStep = 1;
    var lineWidth = 2;
    var markerRadius = 4;
    var bodyRect = document.body.getBoundingClientRect();
    var webSocket = null;
    var $statusElement;
    var $updateRateElement;
    var staffs = {};
    var sensors = {};
    var pitches = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    var clock = new (function() {
        this.tick = 0;
    })();
        
    
    var plotProps = {
        angles: {
            title: "Angles",
            maxValue: Math.PI,
            series: [
                {name: "Yaw", color: "green"},
                {name: "Pitch", color: "blue"},
                {name: "Roll", color: "red"}
            ],
            scale: 180/Math.PI,
            unit: "deg"
        },
        angleRates: {
            title: "Angle Rates",
            maxValue: 2*Math.PI,
            series: [
                {name: "Yaw Rate", color: "green"},
                {name: "Pitch Rate", color: "blue"},
                {name: "Roll Rate", color: "red"}
            ],
            scale: 180/Math.PI,
            unit: "deg/sec"
        }
    }
    
    var createNoteStub = function($svg, strokeIndex) {
        var head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        $(head).attr({
            rx: noteHeadRx,
            ry: noteHeadRy,
            stroke: "black",
            fill: "black"
        }).appendTo($svg);
        var stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
        $(stem).attr({
            stroke: "black",
            "stroke-width": 1
        }).appendTo($svg);
        var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        $(label).appendTo($svg);
        label.style.display = "none";
        var noteStub = {
            head: head,
            stem: stem,
            label: label
        };
        return noteStub;
    };
    
    var createStaff = function(instrumentId, sensorId) {
        var staffElementId = "Instrument" + instrumentId;
        $staffElement = $("<div/>", {
            id: staffElementId,
            class: "bodymusic_staff"
        }).appendTo("body");
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        $(svg).appendTo($staffElement);
        var veil = document.createElement("div");
        $(veil).attr({
            class: "bodymusic_veil"
        }).appendTo($staffElement);
        var staffWidth = $staffElement.width();
        $staffElement.height(staffHeight);
        var noteStubs = {};
        var staff = {
            sensorId: sensorId,
            noteStubs: noteStubs,
            svg: svg,
            veil: veil
        };
        staffs[instrumentId] = staff;
    };

    var updateStaff = function(note) {
        var staff = staffs[note.instrumentId];
        var strokeIndex = sensors[staff.sensorId].currentStrokeIndex;
        var pitch = note.pitch;
        var noteStubs = staff.noteStubs;
        var noteStub = noteStubs[strokeIndex];
        if (!noteStub) {
            noteStub = createNoteStub($(staff.svg), strokeIndex);
            noteStubs[strokeIndex] = noteStub;
        }
        var head = noteStub.head;
        var stem = noteStub.stem;
        var label = noteStub.label;
        var headX = plotMargin + strokeIndex*plotStep;
        var headY = staffHeight*0.5 + (c4Pitch - pitch)*staffStep;
        $(head).attr({
            cx: headX,
            cy: headY
        });
        var stemX, stemY2, labelX, labelY;
        if (pitch > c4Pitch) {
            stemX = headX - noteHeadRx;
            stemY2 = headY + stemHeight;
            labelX = headX - 14;
            labelY = stemY2 + 12;
        }
        else {
            stemX = headX + noteHeadRx;
            stemY2 = headY - stemHeight;
            labelX = headX - 6;
            labelY = stemY2 - 2;
        }
        $(stem).attr({
            x1: stemX,
            x2: stemX,
            y1: headY,
            y2: stemY2
        });
        var offset = (pitch - c4Pitch) % 12;
        if (offset < 0) {
            offset += 12;
        }
        var octave = Math.floor((pitch - c4Pitch) / 12 + 4)
        $(label).attr({
            x: labelX,
            y: labelY
        });
        label.textContent = pitches[offset];
        setNoteStubVisible(noteStub, true);
    };
    
    var setNoteStubVisible = function(noteStub, visible) {
        var display = visible ? "inline" : "none";
        noteStub.head.style.display = display;
        noteStub.stem.style.display = display;
        noteStub.label.style.display = display;
    };
    
    var createSensorPlots = function(sensorId) {
        var strokeIndex;
        var sensor = {
            id: sensorId,
            currentStrokeIndex: -1,
            history: []
        };
        sensors[sensorId] = sensor;
        var plots = {};
        $.each(plotProps, function(plotKey, thisPlotProps) {
            var thisPlotProps = plotProps[plotKey];
            var $plotElement;
            var $svg;
            var veil;
            var plot;
            var series = [];
            var plotWidth;
            
            var createCanvas = function() {
                var plotElementId = "Sensor" + sensorId + plotKey;
                $plotElement = $("<div/>", {
                    id: plotElementId,
                    class: "bodymusic_plot"
                }).appendTo("body");
                plotWidth = $plotElement.width();
                $plotElement.height(plotHeight);
                $svg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
                    .appendTo($plotElement);
                if (!sensor.strokeCount) {
                    sensor.strokeCount = Math.floor((plotWidth - 2*plotMargin)/plotStep);
                }
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
                    x: 100,
                    y: 15
                }).appendTo($svg);
                plotLabel.textContent = "Sensor " + sensorId + " " + thisPlotProps.title;
            };
        
            var createPlot = function() {
                var yBase = plotHeight/2;
                plot = {
                    key: plotKey,
                    yBase: yBase,
                    yScale: yBase/thisPlotProps.maxValue,
                    veil: veil,
                    series: series
                };
                plots[plotKey] = plot;
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
                    var history = sensor.history;
                    if (strokeIndex > -1 && strokeIndex < history.length) {
                        $(slider).attr({
                            x1: eventX,
                            x2: eventX
                        });
                        var tooltipText = "";
                        var sensorData = history[strokeIndex];
                        var plotKey = plot.key;
                        tooltipText = "Time: " + sensorData.timestamp.toFixed(2) + " sec";
                        $.each(plot.series, function(seriesIndex) {
                            var value = sensorData[plotKey][seriesIndex] * thisPlotProps.scale;
                            var precision = Math.abs(value) > 1 ? 0 : 1;
                            tooltipText += "<br>" + thisPlotProps.series[seriesIndex].name + ": " +
                                value.toFixed(precision) + " " + thisPlotProps.unit;
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
                $.each(thisPlotProps.series, function(seriesIndex) {
                    var color = this.color;
                    var strokes = [];
                    var marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    var thisSeries = {
                        strokes: strokes,
                        marker: marker
                    };
                    series.push(thisSeries);
                    for (strokeIndex = 0; strokeIndex < sensor.strokeCount; strokeIndex++) {
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
        sensor.plots = plots;
        return sensor;
    };

    var createRibbon = function() {
        var $ribbon = $("<div/>", {
            class: "bodymusic_ribbon"
        }).appendTo("body");
        $statusElement = $("<div/>", {
            class: "bodymusic_statusicon bodymusic_disconnected"
        }).appendTo($ribbon);
        $updateRateElement = $("<span/>", {
            class: "bodymusic_statuslabel"
        }).appendTo($ribbon);
        $statusElement.click(function() {
            if (webSocket) {
                webSocket.close();
                webSocket = null;
            }
            else {
                connect();
            }
        });
        $.each(plotProps, function(plotKey, thisPlotProps) {
            $.each(this.series, function() {
                var $iconDiv = $("<div/>", {
                    class: "bodymusic_legendicon"
                }).appendTo($ribbon);
                $iconSvg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
                    .appendTo($iconDiv);
                $(document.createElementNS("http://www.w3.org/2000/svg", "line")).attr({
                    x1: 0,
                    x2: 20,
                    y1: 10,
                    y2: 10,
                    stroke: this.color,
                    "stroke-width": lineWidth*2
                }).css("display", "inline").appendTo($iconSvg);
                $("<span/>", {
                    class: "bodymusic_legendlabel"
                }).appendTo($ribbon).html(this.name);
            });
        });
    };

    var updateSensorPlots = function(sensor, sensorData) {
        if (sensor.currentStrokeIndex < sensor.strokeCount - 1) {
            sensor.currentStrokeIndex++;
        }
        else {
            sensor.currentStrokeIndex = 0;
        }
        var sensorId = sensor.id;
        var x = plotMargin + (sensor.currentStrokeIndex + 1)*plotStep;
        $.each(instruments[sensorId], function() {
            var instrumentId = this;
            var staff = staffs[instrumentId];
            var noteStub = staff.noteStubs[sensor.currentStrokeIndex];
            if (noteStub) {
                setNoteStubVisible(noteStub, false);
            }
            staff.veil.style.left = x + "px";
        });
        $.each(sensor.plots, function(plotKey, plot) {
            var thisPlotProps = plotProps[plotKey];
            var ys = sensorData[plotKey];
            var seriesIndex;
            var y;
            for (seriesIndex = 0; seriesIndex < plot.series.length; seriesIndex++) {
                var series = plot.series[seriesIndex];
                var strokes = series.strokes;
                var marker = series.marker;
                var ySensor = ys[seriesIndex];
                var stroke = strokes[sensor.currentStrokeIndex];
                y = plot.yBase - ySensor*plot.yScale;
                stroke.setAttribute("y2", y);
                marker.setAttribute("cx", x);
                marker.setAttribute("cy", y);
                if (sensor.currentStrokeIndex > 0) {
                    var prevY = strokes[sensor.currentStrokeIndex - 1].getAttribute("y2");
                    stroke.setAttribute("y1", prevY);
                    if (sensorData.enabled) {
                        stroke.style.display = "inline";
                        marker.style.display = "inline";
                    }
                    else {
                        stroke.style.display = "none";
                        marker.style.display = "none";
                    }
                }
                var history = sensor.history;
                if (sensor.currentStrokeIndex < history.length) {
                    history[sensor.currentStrokeIndex] = sensorData;
                }
                else {
                    history.push(sensorData);
                }
            }
            plot.veil.style.left = x + "px";
        });
    };

    var sensorUpdated = function(sensorData) {
        $updateRateElement.html("Update rate: " + sensorData.updateRate + " Hz");
        var sensorId = sensorData.id;
        var sensor = sensors[sensorId];
        if (sensor) {
            if (clock.tick++ % plotUpdateFrequency == 0) {
                updateSensorPlots(sensor, sensorData);
            }
        }
    };
    
    var notePlayed = function(note) {
        updateStaff(note);
    };

    var createPlots = function() {
        $.each(instruments, function(sensorId, instrumentIds) {
            $.each(instrumentIds, function() {
                var instrumentId = this;
                createStaff(instrumentId, sensorId);
            });
            createSensorPlots(sensorId);
        });
    };
    
    var connectionOpened = function() {
        $statusElement.removeClass("bodymusic_disconnected");
        $statusElement.addClass("bodymusic_connected");
    };
    
    var connectionClosed = function() {
        webSocket = null;
        $statusElement.removeClass("bodymusic_connected");
        $statusElement.addClass("bodymusic_disconnected");
        $updateRateElement.html("Disconnected");
    };

    var connect = function() {
        if (!window.WebSocket) {
            alert("WebSocket not supported");
            return;
        }
        webSocket = new WebSocket(host);
        webSocket.onopen = function() {
            connectionOpened();
        }
        webSocket.onmessage = function(event) {
            var data = $.parseJSON(event.data);
            if (data.sensor) {
                sensorUpdated(data.sensor);
            }
            else if (data.note) {
                notePlayed(data.note);
            }
        }
        webSocket.onclose = function() {
            connectionClosed();
        }
    };
    
    var init = function() {
        createRibbon();
        createPlots();
        connect();
    };

    init();
});
