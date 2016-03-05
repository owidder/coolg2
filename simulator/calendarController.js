'use strict';

com_eosItServices_fx.CALENDAR_CONTROLLER = "calendarController";

/**
 * based on: http://bl.ocks.org/mbostock/4063318
 * thanks to Mike Bostock: http://bl.ocks.org/mbostock
 */
angular.module(com_eosItServices_fx.moduleName).controller(com_eosItServices_fx.CALENDAR_CONTROLLER,
    function ($scope, svgUtil, $q, funcs, dateUtil, eventsUndMassnahmen, ablauf, ruleEngine, $timeout, $vpAblauf, httpUtil, colorUtil) {
        var PARAM_VP = "vp";
        var PARAM_SUFFIX = "suffix";

        var HIGHLIGHTED_ROW_CLASS = "highlighted-row";
        var SELECTED_ROW_CLASS = "selected-row";
        var SELECTED_DAY_CLASS = "selected-day";
        var SELECTED_DAY_TEXT_CLASS = "selected-day-text";
        var MASSNAHME_NOT_ALLOWED_CLASS = "m-not-allowed";
        var MASSNAHME_AUSGEWAEHLT_CLASS = "m-ausgewaehlt";
        var MASSNAHME_FRIST_CLASS = "m-frist";
        var SOMETHING_HAPPENED_CLASS = "something-happened";
        var NOTHING_HAPPENED_CLASS = "nothing-happened";

        var ID_BUTTON_DELETE_DAY = "deleteDay";

        var width = 960,
            height = 136,
            cellSize = 17; // cell size

        var format = d3.time.format("%Y-%m-%d");

        var svg = d3.select("#calendar").selectAll("svg")
            .data(d3.range(2014, 2017))
            .enter().append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "RdYlGn")
            .append("g")
            .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

        svg.append("text")
            .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d;
            });

        var rectG = svg.selectAll(".day")
            .data(function (d) {
                return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
            })
            .enter()
            .append("g")
            .attr("class", "rect-g")
            .attr("transform", function (d) {
                var x = d3.time.weekOfYear(d) * cellSize;
                var y = d.getDay() * cellSize;
                return svgUtil.createTranslateString(x, y)
            })
            .datum(format);

        rectG.filter(function (d) {
                var date = dateUtil.getDateFromYYYY_MM_DD(d);
                return dateUtil.isFirstSundayOfMonth(date);
            })
            .append("text")
            .attr("y", -5)
            .text(function (d) {
                return dateUtil.getMonthNameFromYYYY_MM_DD(d);
            });

        var rect = rectG.append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", 0)
            .attr("y", 0)
            .on("click", clickOnRect);

        rect.append("title");

        var rectGText = rectG.append("g")
            .attr("transform", svgUtil.createTranslateString(cellSize / 2 - 5, cellSize / 2 + 5));

        var rectText = rectGText.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .text(function (d) {
                var parts = d.split("-");
                return Number(parts[2]);
            })
            .on("click", clickOnRect);

        rectGText.append("title");

        svg.selectAll(".month")
            .data(function (d) {
                return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
            })
            .enter().append("path")
            .attr("class", "month")
            .attr("d", monthPath);

        var currentSelectedDate;

        var currentVpAblauf;

        var showVpAblaufColorsFlag = true;

        function selectDate(yyyy_mm_dd) {
            function addRemoveTaStartIndexClass(yyyy_mm_dd, clazz, addFlag) {
                var taStartIndex, taEntry;
                if(funcs.isDefined(currentVpAblauf)) {
                    taEntry = currentVpAblauf.getTaEntry(yyyy_mm_dd);
                    if(funcs.isDefined(taEntry)) {
                        taStartIndex = taEntry.startIndex;
                        if(addFlag) {
                            $(".tastart-" + taStartIndex).addClass(clazz);
                        } else {
                            $(".tastart-" + taStartIndex).removeClass(clazz);
                        }
                    }
                }
            }

            function deselect(yyyy_mm_dd) {
                $("#" + ID_BUTTON_DELETE_DAY).addClass("disabled");
                addRemoveTaStartIndexClass(yyyy_mm_dd, HIGHLIGHTED_ROW_CLASS, false);
                $(".row-" + yyyy_mm_dd).removeClass(SELECTED_ROW_CLASS);
                $(".day-" + yyyy_mm_dd).removeClass(SELECTED_DAY_CLASS);
                $(".day-text-" + yyyy_mm_dd).removeClass(SELECTED_DAY_TEXT_CLASS);
            }

            function select(yyyy_mm_dd) {
                $("#" + ID_BUTTON_DELETE_DAY).removeClass("disabled");
                addRemoveTaStartIndexClass(yyyy_mm_dd, HIGHLIGHTED_ROW_CLASS, true);
                $(".row-" + yyyy_mm_dd).addClass(SELECTED_ROW_CLASS);
                $(".day-" + yyyy_mm_dd).addClass(SELECTED_DAY_CLASS);
                $(".day-text-" + yyyy_mm_dd).addClass(SELECTED_DAY_TEXT_CLASS);
            }

            if (funcs.isDefined(currentSelectedDate)) {
                deselect(currentSelectedDate);
            }
            select(yyyy_mm_dd);
            currentSelectedDate = yyyy_mm_dd;

            $scope.alterForderungInTagen = ablauf.daysSinceKE(yyyy_mm_dd);
            $scope.aktuellesEreignis = (function() {
                var event = ablauf.getEvent(yyyy_mm_dd);
                if(funcs.isDefined(event)) {
                    return event.name;
                }
                return "";
            })();
        }

        function clickOnRect(yyyy_mm_dd) {
            selectDate(yyyy_mm_dd);

            var refreshPhaseChangesPromise = ablauf.refreshPhaseChanges(yyyy_mm_dd);

            $q.all([ruleEngine.ready, ablauf.ready, refreshPhaseChangesPromise]).then(function() {
                var statistic = ablauf.statisticUntil(yyyy_mm_dd);
                $scope.statistic = statistic;
                ruleEngine.getMassnahmen(statistic).then(function(massnahmenFromEngine) {
                    /**
                     *
                     * @param className
                     * @param addRemove true = add
                     */
                    function addRemoveClassToFromMassnahme(massnahmeFromStammdaten, className, addRemove) {
                        if(addRemove) {
                            $(".l-" + massnahmeFromStammdaten.name).addClass(className);
                        }
                        else {
                            $(".l-" + massnahmeFromStammdaten.name).removeClass(className);
                        }
                    }

                    /**
                     *
                     * @param massnahmeFromStammdaten
                     * @param onOff on = true
                     */
                    function massnahmeErlaubt(massnahmeFromStammdaten, onOff) {
                        addRemoveClassToFromMassnahme(massnahmeFromStammdaten, MASSNAHME_NOT_ALLOWED_CLASS, !onOff);
                    }

                    /**
                     *
                     * @param massnahmeFromStammdaten
                     * @param onOff on = true
                     */
                    function massnahmeAusgewaehlt(massnahmeFromStammdaten, onOff) {
                        addRemoveClassToFromMassnahme(massnahmeFromStammdaten, MASSNAHME_AUSGEWAEHLT_CLASS, onOff);
                    }

                    /**
                     *
                     * @param massnahmeFromStammdaten
                     * @param onOff on = true
                     */
                    function massnahmeFrist(massnahmeFromStammdaten, onOff) {
                        addRemoveClassToFromMassnahme(massnahmeFromStammdaten, MASSNAHME_FRIST_CLASS, onOff);
                    }

                    eventsUndMassnahmen.getMassnahmen().forEach(function(massnahmenFromStammdaten) {
                        function findInMassnahmenFromEngine(massnahmeFromStammdaten) {
                            var foundMassnahme = {};
                            var massnahme;
                            for(var i = 0; i < massnahmenFromEngine.length; i++) {
                                massnahme = massnahmenFromEngine[i];
                                 if(massnahmeFromStammdaten.name == massnahme.idMassnahme) {
                                     foundMassnahme = massnahme;
                                 }
                            }

                            return foundMassnahme;
                        }

                        var massnahme = findInMassnahmenFromEngine(massnahmenFromStammdaten);
                        massnahmeErlaubt(massnahmenFromStammdaten, massnahme.erlaubt);
                        massnahmeAusgewaehlt(massnahmenFromStammdaten, massnahme.ausgewaehlt);
                        massnahmeFrist(massnahmenFromStammdaten, massnahme.terminErreicht);
                    });
                });
            });
        }

        function classForTa(ta) {
            return "ta-" + ta.id;
        }

        function classForTaText(ta) {
            return classForTa(ta) + "-text";
        }

        function redrawMassnahmenEvents() {
            var data = ablauf.getDatumToMassnahmeEventMap();

            function tooltipOnRect(d) {
                var text = d;
                var ta;

                if(funcs.isDefined(currentVpAblauf)) {
                    ta = currentVpAblauf.getTaEntry(d);
                    if(funcs.isDefined(ta)) {
                        text += " [" + ta.name + "]";
                    }
                    if(currentVpAblauf.isSomethingAtDate(d)) {
                        text += " (" + currentVpAblauf.getMzNameAtDate(d) + ")";
                    }
                }
                if(d in data) {
                    var mId = data[d].id;
                    text += ": " + eventsUndMassnahmen.getAll()[mId].name;
                    if (funcs.isDefined(data[d].bemerkung)) {
                        text += " (" + data[d].bemerkung + ")";
                    }
                }
                return text;
            }

            function somethingNothingHappendClass(d) {
                if(currentVpAblauf.isSomethingAtDate(d)) {
                    return SOMETHING_HAPPENED_CLASS;
                }
                else {
                    return NOTHING_HAPPENED_CLASS;
                }
            }

            rect
                .attr("class", function (d) {
                    var date = dateUtil.getDateFromYYYY_MM_DD(d);
                    var clazz = dateUtil.isWeekend(date) ? "weekend " : "";
                    var ta;
                    clazz += "day " + "day-" + d;

                    if(d in data) {
                        clazz += " rect m-" + data[d].typ;
                    }

                    if(funcs.isDefined(currentVpAblauf) && showVpAblaufColorsFlag) {
                        ta = currentVpAblauf.getTaEntry(d);
                        if(funcs.isDefined(ta)) {
                            clazz += " " + classForTa(ta);
                        }
                        clazz += " " + somethingNothingHappendClass(d);
                    }

                    return clazz;
                })
                .select("title")
                .text(tooltipOnRect);

            rectText
                .attr("class", function (d) {
                    var clazz = "day-text-" + d;
                    if(d in data) {
                        clazz += " text-" + data[d].id + " m-EM";
                    }
                    var ta;

                    if(funcs.isDefined(currentVpAblauf) && showVpAblaufColorsFlag) {
                        ta = currentVpAblauf.getTaEntry(d);
                        if(funcs.isDefined(ta)) {
                            clazz += " " + classForTaText(ta);
                        }
                        clazz += " " + somethingNothingHappendClass(d);
                    }
                    return clazz;
                })
                .text(function (d) {
                    var text;
                    if(d in data) {
                        text = data[d].id;
                    }
                    else {
                        var parts = d.split("-");
                        text =  Number(parts[2]);
                    }
                    return text;
                });

            rectGText
                .select("title")
                .text(tooltipOnRect);

            reSelectCurrentDate();
            showFilledDays();
        }

        function reSelectCurrentDate() {
            if(funcs.isDefined(currentSelectedDate)) {
                clickOnRect(currentSelectedDate);
            }
        }

        function save() {
            var csv = ablauf.createCsv();
            var blob = new Blob([csv], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "ablauf.csv");
        }

        function removeMassnahmeEventAtCurrentDate() {
            ablauf.removeMassnahmeEvent(currentSelectedDate);
            redrawMassnahmenEvents();
        }

        function addMassnahmeAtCurrentDate(massnahmeId) {
            if(funcs.isDefined(currentSelectedDate)) {
                ablauf.addMassnahmeEvent(currentSelectedDate, massnahmeId);
                redrawMassnahmenEvents();
                $timeout(function() {
                    clickOnRect(currentSelectedDate);
                });
            }
        }

        function showVpAblaufTable(showFlag) {
            $scope.showVpAblauf = showFlag;
        }

        function createTaColorStyles() {
            var allTas = currentVpAblauf.getAllTas();
            var styleString = "<style>\n";
            funcs.forEachKeyAndVal(allTas, function(id, ta) {
                var color = $vpAblauf.colorForAblaufName(ta.name);
                var clazz = classForTa(ta);
                var textClass = classForTaText(ta) + "." + SOMETHING_HAPPENED_CLASS + ":not(.m-EM):not(.selected-day-text)";
                var textColor = colorUtil.getOptimalTextColorFromRgbString(color);
                styleString += sprintf(".%s {" +
                    "fill: %s;" +
                    "}\n",
                clazz,
                color);
                styleString += sprintf(".%s {" +
                    "fill: %s;" +
                    "}\n",
                    textClass,
                    textColor);
            });
            styleString += "</style>\n";
            $("#taStyles").append(styleString);
        }

        function readVp(vp, suffix) {
            currentVpAblauf = new $vpAblauf.VpAblauf(vp, suffix);
            currentVpAblauf.ready.then(function() {
                $scope.vpAblaufEntries = currentVpAblauf.getEntries();
                showVpAblaufTable(true);
                createTaColorStyles();
                redrawMassnahmenEvents();
            });
        }

        function toggleVpAblaufColors() {
            if(showVpAblaufColorsFlag) {
                $scope.buttonColors.ablaufColorButton = "red";
                showVpAblaufColorsFlag = false;
            }
            else {
                $scope.buttonColors.ablaufColorButton = "green";
                showVpAblaufColorsFlag = true;
            }
            redrawMassnahmenEvents();
        }

        function blinkSelectedDay() {
            $("." + SELECTED_DAY_CLASS).fadeOut(1).fadeIn(500);
            $timeout(function() {
                blinkSelectedDay();
            }, 1000);
            showFilledDays();
        }

        function blinkFilledDays() {
            $timeout(function() {
                $(".rect.m-M,.rect.m-E").fadeOut(1000).fadeIn(1000);
                blinkFilledDays();
            }, 5000);
        }

        function showFilledDays() {
            var filledDayClass = ".rect.m-M:not(." + SELECTED_DAY_CLASS + "),.rect.m-E:not(." + SELECTED_DAY_CLASS + ")";
            if(showVpAblaufColorsFlag) {
                $(filledDayClass).hide();
            }
            else {
                $(filledDayClass).show();
            }
        }

        $q.all([ablauf.ready, eventsUndMassnahmen.ready]).then(function() {
            redrawMassnahmenEvents();

            $scope.ablauf = ablauf.getAblauf();
            $scope.massnahmen = eventsUndMassnahmen.getMassnahmen();
            $scope.events = eventsUndMassnahmen.getEvents();
            $scope.addMassnahmeAtCurrentDate = addMassnahmeAtCurrentDate;
            $scope.removeMassnahmeEventAtCurrentDate = removeMassnahmeEventAtCurrentDate;
            $scope.save = save;
            $scope.readVp = readVp;
            $scope.selectDate = selectDate;
            $scope.clickOnRect = clickOnRect;
            $scope.miscValues = ablauf.miscValues;
            $scope.toggleVpAblaufColors = toggleVpAblaufColors;
            $scope.buttonColors = {};
            $scope.massnahmenCategories = eventsUndMassnahmen.getMassnahmenCategories();
            $scope.eventCategories = eventsUndMassnahmen.getEventCategories();

            showVpAblaufTable(false);

            var vp = httpUtil.getParam(PARAM_VP, "");
            var suffix = httpUtil.getParam(PARAM_SUFFIX, "");
            if(vp.length > 0) {
                readVp(vp, suffix);
            }

            blinkSelectedDay();
        });

        function monthPath(t0) {
            var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
                d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0),
                d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1);
            return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
                + "H" + w0 * cellSize + "V" + 7 * cellSize
                + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
                + "H" + (w1 + 1) * cellSize + "V" + 0
                + "H" + (w0 + 1) * cellSize + "Z";
        }
    });