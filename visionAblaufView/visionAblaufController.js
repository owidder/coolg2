'use strict';

com_eosItServices_fx.VISION_ABLAUF_CONTROLLER = "VisionAblaufController";

/**
 * based on: http://bl.ocks.org/kerryrodden/7090426
 * thanks to: http://bl.ocks.org/kerryrodden
 */
angular.module(com_eosItServices_fx.moduleName).controller(com_eosItServices_fx.VISION_ABLAUF_CONTROLLER,
    function ($scope, $routeParams, $location, $timeout, $q, sha256, funcs,
              svgUtil, dimensions, colorUtil, mathUtil, httpUtil, fileUtil, Auftrag, $vpAblauf, $nachrichten) {
        var ROUTE_PARAM_AUFTRAG = "auftr"; // show only this Auftrag
        var ROUTE_PARAM_ID = "id"; // node id to be selected (i.e. clicked on)
        var ROUTE_PARAM_TRANSLATE_X = "tx";
        var ROUTE_PARAM_TRANSLATE_Y = "ty";
        var ROUTE_PARAM_SCALE = "s";
        var ROUTE_PARAM_NO_AKT = "noakt"; // Aktivitaeten nicht anzeigen
        var ROUTE_PARAM_VIEW = "view";

        var VIEW_MZ_AKT = "mzAkt";
        var VIEW_TA_AKT = "taAkt";
        var VIEW_TA = "ta";

        var SEP1 = "-----";
        var SEP2 = "=====";

        var ROUTE_PARAM_SUFFIX = "suffix";
        var suffix = httpUtil.getParam(ROUTE_PARAM_SUFFIX, "");
        $scope.suffix = suffix;

        var view = httpUtil.getParam(ROUTE_PARAM_VIEW, VIEW_MZ_AKT);
        $scope.view = view;

        var auftrId = httpUtil.getParam(ROUTE_PARAM_AUFTRAG, "22411");

        var teilablaeufe = [];
        var teilablaeufeMap = {};

        function initScopeWithRouteParams() {
            if(httpUtil.isParamSet(ROUTE_PARAM_AUFTRAG)) {
                $scope.auftrag = $routeParams[ROUTE_PARAM_AUFTRAG];
            }
            else {
                $scope.auftrag = "???";
            }
        }

        initScopeWithRouteParams();

        function addTeilablauf(teilablauf, numberOfVerpflichtungen) {
            if(!funcs.isDefined(teilablaeufeMap[teilablauf])) {
                teilablaeufeMap[teilablauf] = numberOfVerpflichtungen;
            }
            else {
                teilablaeufeMap[teilablauf] += numberOfVerpflichtungen;
            }

            if(teilablaeufe.indexOf(teilablauf) < 0) {
                teilablaeufe.push(teilablauf);
            }
        }

        var FIELD_WIDTH = 10000;
        var FIELD_HEIGHT = 10000;

        var width = FIELD_WIDTH;
        var height = FIELD_HEIGHT;
        var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
        var b = {
            w: 500, h: 30, s: 3, t: 10
        };

        function extractSquareBrackets(name) {
            var result = name;
            if (name.endsWith("]")) {
                var regex = /^.*\[(.*)\]$/;
                var match = regex.exec(name);
                if (match.length > 0) {
                    result = match[1];
                }
            }

            return result;
        }

        function isMahnzelle(name) {
            return name.startsWith("M:");
        }

        function isVirtuelleMahnzelle(name) {
            return name.startsWith("V:");
        }

        function isAktivitaet(name) {
            return name.startsWith("A:");
        }

        function isAblauf(name) {
            return name.startsWith("TA:");
        }

        function ablaufFromNodeName(name) {
            var ablauf = name;

            if(isMahnzelle(name)) {
                ablauf = extractSquareBrackets(name);
            }
            else if(isAblauf(name)) {
                ablauf = name.substring(4);
            }
            else if(isVirtuelleMahnzelle(name)) {
                ablauf = name.substring(3);
            }
            else if(isAktivitaet(name)) {
                ablauf = undefined;
            }

            if(funcs.isDefined(ablauf)) {
                ablauf = ablauf.trim();
            }

            return ablauf;
        }

// Mapping of step names to colors.
        function colorForNodeName(name) {
            if (isAktivitaet(name)) {
                return "gray";
            }
            var ablaufName = ablaufFromNodeName(name);
            var color = $vpAblauf.colorForAblaufName(ablaufName);

            return color;
        }

// Total size of all segments; we set this later, after loading the data.
        var totalSize = 0;

        var defaultX = dimensions.screenDimensions.width/2;
        var defaultY = dimensions.screenDimensions.height/2;
        var textDivWidth = 200;
        var textDivHeight = 200;
        var EXPLANATION_X = -300;
        var EXPLANATION_Y = -200;
        var EXPLANATION_WIDTH = 600;
        var EXPLANATION_HEIGHT = 400;
        var textMiddleX = defaultX - (textDivWidth / 2);
        var textMiddleY = defaultY - (textDivHeight / 2);

        function putTranslateAndScaleIntoUrl(t, s) {
            $timeout(function () {
                $location.search(ROUTE_PARAM_TRANSLATE_X, t[0]);
                $location.search(ROUTE_PARAM_TRANSLATE_Y, t[1]);
                $location.search(ROUTE_PARAM_SCALE, s);
            });
        }

        function getTranslationAndScaleFromUrl() {
            var t = [defaultX, defaultY];
            var tx = $routeParams[ROUTE_PARAM_TRANSLATE_X];
            var ty = $routeParams[ROUTE_PARAM_TRANSLATE_Y];
            var s = $routeParams[ROUTE_PARAM_SCALE];
            if (funcs.isDefined(tx) && funcs.isDefined(ty)) {
                t = [tx, ty];
            }
            if (!funcs.isDefined(s)) {
                s = .1;
            }

            return {
                t: t,
                s: s
            }
        }

        $scope.loading = true;

        var zoom = d3.behavior.zoom()
            .scaleExtent([0.1, 1])
            .on("zoom", zoomed);

        var slider = d3.select("#slider").append("p").append("input")
            .datum({})
            .attr("type", "range")
            .attr("value", zoom.scaleExtent()[0])
            .attr("min", zoom.scaleExtent()[0])
            .attr("max", zoom.scaleExtent()[1])
            .attr("step", (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
            .on("input", slided);

        var currentTranslate;
        var currentScale;

        var STEP = 10;

        function doTranslate(t) {
            zoom.translate(t).event(root);
        }

        function doScale(s) {
            zoom.scale(s).event(root);
        }

        function translateUp() {
            var newTranslate = [currentTranslate[0], currentTranslate[1] - STEP];
            doTranslate(newTranslate);
        }

        function translateDown() {
            var newTranslate = [currentTranslate[0], currentTranslate[1] + STEP];
            doTranslate(newTranslate);
        }

        function translateLeft() {
            var newTranslate = [currentTranslate[0] - STEP, currentTranslate[1]];
            doTranslate(newTranslate);
        }

        function translateRight() {
            var newTranslate = [currentTranslate[0] + STEP, currentTranslate[1]];
            doTranslate(newTranslate);
        }

        function translateToDefault() {
            doTranslate([defaultX, defaultY]);
        }

        $scope.translateUp = translateUp;
        $scope.translateDown = translateDown;
        $scope.translateLeft = translateLeft;
        $scope.translateRight = translateRight;
        $scope.translateToDefault = translateToDefault;

        function zoomed() {
            currentTranslate = d3.event.translate;
            currentScale = d3.event.scale;
            updateNavigator();
            putTranslateAndScaleIntoUrl(currentTranslate, currentScale);
            vis.attr("transform", "translate(" + currentTranslate + ")" + " scale(" + currentScale + ")");
            slider.property("value",  d3.event.scale);
        }

        function slided(d) {
            doScale(d3.select(this).property("value"));
        }

        function clickOnDesktop() {
            var c = d3.mouse(root.node());
            stopEventPropagation();
            doTranslate(c);
        }

        var ID_ROOT = "root";
        var ID_VIS = "vis";
        var ID_EXPLANATION = "explanation";
        var ID_TRAIL = "trail";
        var ID_LEGENDE = "legende";
        var ID_NAVIGATOR = "navigator";

        var root = d3.select("#chart").append("svg:svg")
            .attr("width", width)
            .attr("height", height)
            .call(zoom)
            .on("mousedown.zoom", null)
            .on("mousemove.zoom", null)
            .on("dblclick.zoom", null)
            .on("touchstart.zoom", null)
            .on("wheel.zoom", null)
            .on("mousewheel.zoom", null)
            .on("MozMousePixelScroll.zoom", null)
            .append("svg:g")
            .attr("id", ID_ROOT)
            .style("visibility", "hidden");

        var vis = root
            .append("svg:g")
            .attr("id", ID_VIS);

        var explanation = vis
            .append("g")
            .attr("id", ID_EXPLANATION)
            .attr("transform", svgUtil.createTranslateString(EXPLANATION_X, EXPLANATION_Y));

        var trail = root
            .append("g")
            .attr("id", ID_TRAIL);

        var legende = root
            .append("g")
            .attr("id", ID_LEGENDE);

        var NAVIGATOR_WIDTH = 200;
        var NAVIGATOR_HEIGHT = 200;
        var NAVIGATOR_RANGE_X_START = -5000;
        var NAVIGATOR_RANGE_X_END = 5000;
        var NAVIGATOR_RANGE_Y_START = -5000;
        var NAVIGATOR_RANGE_Y_END = 5000;
        var NAVIGATOR_CIRCLE_RADIUS = 5;

        var navigator = root
            .append("g")
            .attr("id", ID_NAVIGATOR)
            .attr("transform", svgUtil.createTranslateString(dimensions.width() - NAVIGATOR_WIDTH - 20, 0));

        var navigatorRect = navigator
            .append("rect")
            .attr("width", NAVIGATOR_WIDTH)
            .attr("height", NAVIGATOR_HEIGHT)
            .attr("fill", "grey")
            .attr("opacity", 0.6)
            .on("click", navigatorClicked);

        var navigatorCircle = navigator
            .append("circle")
            .attr("r", NAVIGATOR_CIRCLE_RADIUS)
            .attr("cx", NAVIGATOR_WIDTH/2)
            .attr("cy", NAVIGATOR_HEIGHT/2)
            .attr("fill", "black");

        elementOff(ID_NAVIGATOR);

        var navigatorScaleX = d3.scale.linear().domain([0, NAVIGATOR_WIDTH]).range([NAVIGATOR_RANGE_X_START, NAVIGATOR_RANGE_X_END]);
        var navigatorScaleY = d3.scale.linear().domain([0, NAVIGATOR_HEIGHT]).range([NAVIGATOR_RANGE_Y_START, NAVIGATOR_RANGE_Y_END]);

        function updateNavigator() {
            var navX = navigatorScaleX.invert(currentTranslate[0]);
            var navY = navigatorScaleY.invert(currentTranslate[1]);
            navigatorCircle
                .attr("cx", navX)
                .attr("cy", navY);
        }

        function navigatorClicked() {
            stopEventPropagation();

            var pos = d3.mouse(navigatorRect.node());
            var desktopX = navigatorScaleX(pos[0]);
            var desktopY = navigatorScaleY(pos[1]);
            doTranslate([desktopX, desktopY]);
        }

        var explanationText = explanation
            .append("text")
            .attr("y", EXPLANATION_HEIGHT / 2)
            .attr("text-anchor", "middle");

        var style = "width: " + textDivWidth + "px; left:" + textMiddleX + "px; top:" + textMiddleY + "px;";
        d3.select("#explanation")
            .attr("style", style);

        var partition = d3.layout.partition()
            .size([2 * Math.PI, radius * radius])
            .value(function (d) {
                return d.size;
            });

        var arc = d3.svg.arc()
            .startAngle(function (d) {
                return d.x;
            })
            .endAngle(function (d) {
                return d.x + d.dx;
            })
            .innerRadius(function (d) {
                return Math.sqrt(d.y);
            })
            .outerRadius(function (d) {
                return Math.sqrt(d.y + d.dy);
            });

        var translationAndScale = getTranslationAndScaleFromUrl();
        doTranslate(translationAndScale.t);
        doScale(translationAndScale.s);

        function dataFilename() {
            var basename = "ablaeufe" + suffix + "/" + view + "/ablaeufe" + funcs.upperFirst(view);
            var filename = basename + auftrId + ".csv";

            return filename;
        }

        function startRender() {
            d3.text("rsrc/" + dataFilename(), function (text) {
                console.log("csv read");

                var csv = d3.csv.parseRows(text, fileUtil.createRowParser(SEP2));
                console.log("csv parsed");
                $scope.anzahlAblaeufe = csv.length;
                var json = buildHierarchy(csv);
                console.log("hierarchy built");
                var nodes;
                $nachrichten.ready.then(function() {
                    nodes = createVisualization(json);
                });

                drawLegend();

                var paramId = $routeParams[ROUTE_PARAM_ID];
                $nachrichten.ready.then(function () {
                    if (funcs.isDefined(paramId)) {
                        var node = searchNodeById(nodes, paramId);
                        if (funcs.isDefined(node)) {
                            click(node);
                        }
                        else {
                            putPathIntoUrl("NOT_FOUND");
                        }
                    }
                    $timeout(function() {
                        $scope.loading = false;
                    }, 500);
                    elementOn(ID_VIS);
                    elementOn(ID_ROOT);
                });
            });
        }

// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
        var auftrag = new Auftrag(suffix);
        auftrag.ready().then(function() {
            var auftrObj = auftrag.auftragMap[auftrId];
            var jahr = (funcs.isSet(suffix) ? suffix : "2014");
            if(funcs.isDefined(auftrObj)) {
                $scope.title = sprintf("%s (%s), %s [KE in Januar %s]", auftrObj.auftrName, auftrId, auftrObj.mdName, jahr);
                startRender();
            }
            else {
                $timeout(function() {
                    $scope.title = "Auftrag " + auftrId + " im Januar Jahr " + jahr + " nicht vorhanden";
                    $scope.loading = false;
                }, 500);
            }
        });

        function searchNodeById(nodes, idToSearchFor) {
            var i, id;
            var foundNode;
            for (i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                id = funcs.hashCode(node.path);
                if (id == idToSearchFor) {
                    foundNode = node;
                    break;
                }
            }

            return foundNode;
        }


// Main function to draw and set up the visualization, once we have the data.
        function createVisualization(json) {

            // Bounding circle underneath the sunburst, to make it easier to detect
            // when the mouse leaves the parent g.
            vis.append("svg:circle")
                .attr("r", radius)
                .style("opacity", 0);

            // For efficiency, filter nodes to keep only those large enough to see.
            var nodes = partition.nodes(json)
                .filter(function (d) {
                    return (d.dx > 0.001);
                });

            var path = vis.data([json]).selectAll("path")
                .data(nodes)
                .enter().append("svg:path")
                .attr("display", function (d) {
                    return d.depth ? null : "none";
                })
                .attr("d", arc)
                .attr("fill-rule", "evenodd")
                .style("fill", function (d) {
                    return colorForNodeName(d.name);
                })
                .style("opacity", 1)
                .on("click", click);

            // Get total size of the tree = value of root node from partition.
            totalSize = path.node().__data__.value;

            vis.selectAll("path")
                .append("title")
                .text(function (d) {
                    return createNameAndPercentageString(d);
                });

            elementOn(ID_TRAIL);

            return nodes;
        }

        function createNameStr(d) {
            var name = d.name;
            var nachrichtRegex = /^A: (.*?) \(Nachricht\)$/;
            var groups = nachrichtRegex.exec(name);
            var bez, bem;
            if (funcs.isSet(groups) && groups.length > 1) {
                bez = groups[1];
                bem = $nachrichten.getNachrichten()[bez];
                if (funcs.isDefined(bem)) {
                    name = "Nachricht: " + bem + "(" + bez + ")";
                }
            }
            return name;
        }

        function createPercentageStr(d) {
            var percentage = Number(100 * d.value / totalSize).toFixed(2);
            var percentageString;
            percentageString = percentage + "% (" + d.value + ")";

            return percentageString;
        }

        function createNameAndPercentageString(d) {
            return createPercentageStr(d) + " - " + createNameStr(d);
        }

        function replaceExplanation(lines) {
            explanationText.selectAll(".explanation-text-line")
                .remove();
            lines.forEach(function (line) {
                explanationText
                    .append("tspan")
                    .attr("x", EXPLANATION_WIDTH / 2)
                    .attr("dy", "1.2em")
                    .attr("class", "explanation-text-line")
                    .text(line);
            });
        }

        function clearExlplanation() {
            replaceExplanation(["", "", ""])
        }

        function createExplanation(d) {
            var line1 = createPercentageStr(d);
            var line2, line3;
            var extractMzAndTaRegex = /^(.*)(\[.*\])$/;
            var groups = extractMzAndTaRegex.exec(d.name);
            if (funcs.isSet(groups) && groups.length > 2) {
                line2 = groups[1];
                line3 = groups[2];
            }
            else {
                line2 = d.name;
                line3 = "";
            }
            replaceExplanation([line1, line2, line3]);
        }

        function putPathIntoUrl(path) {
            var id;
            if(funcs.isSet(path)) {
                id = funcs.hashCode(path);
            }
            else {
                id = null;
            }
            $timeout(function () {
                $location.search(ROUTE_PARAM_ID, id);
            })
        }

        function stopEventPropagation() {
            if(funcs.isSet(d3.event)) {
                d3.event.stopPropagation();
            }
        }

        function showSimulatorWithVpLink() {
            return !funcs.isEmpty($scope.vp);
        }
        $scope.showSimulatorWithVpLink = showSimulatorWithVpLink;

// Fade all but the current sequence, and show it in the breadcrumb trail.
        function click(d) {

            stopEventPropagation();

            putPathIntoUrl(d.path);

            createExplanation(d);

            var sequenceArray = getAncestors(d);
            updateBreadcrumbs(sequenceArray);
            if(funcs.isArray(sequenceArray) && sequenceArray.length > 0) {
                $scope.vp = sequenceArray[sequenceArray.length-1].vp;
            }
            else {
                $scope.vp = "";
            }

            // Fade all the segments.
            d3.selectAll("path")
                .style("opacity", 0.3);

            // Then highlight only those that are an ancestor of the current segment.
            vis.selectAll("path")
                .filter(function (node) {
                    return (sequenceArray.indexOf(node) >= 0);
                })
                .style("opacity", 1);
        }

        function unclick() {
            putPathIntoUrl(null);
            updateBreadcrumbs([]);
            clearExlplanation();
            d3.selectAll("path")
                .style("opacity", 1);
        }

        $scope.unclick = unclick;

// Restore everything to full opacity when moving off the visualization.
        function mouseleave(d) {

            // Hide the breadcrumb trail
            d3.select("#trail")
                .style("visibility", "hidden");

            // Deactivate all segments during transition.
            d3.selectAll("path").on("click", null);

            // Transition each segment to full opacity and then reactivate it.
            d3.selectAll("path")
                .transition()
                .duration(1000)
                .style("opacity", 1)
                .each("end", function () {
                    d3.select(this).on("click", click);
                });

            d3.select("#explanation")
                .style("visibility", "hidden");
        }

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
        function getAncestors(node) {
            var path = [];
            var current = node;
            while (current.parent) {
                path.unshift(current);
                current = current.parent;
            }
            return path;
        }

// Generate a string that describes the points of a breadcrumb polygon.
        function breadcrumbPoints(d, i) {
            var points = [];
            points.push("0,0");
            points.push(b.w + ",0");
            if (isMahnzelle(d.name)) {
                points.push(b.w + b.t + "," + (b.h / 2));
            }
            points.push(b.w + "," + b.h);
            points.push("0," + b.h);
            /*
             if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
             points.push(b.t + "," + (b.h / 2));
             }
             */
            return points.join(" ");
        }

// Update the breadcrumb trail to show the current sequence and percentage.
        function updateBreadcrumbs(nodeArray) {

            // Data join; key function combines name and depth (= position in sequence).
            var g = trail
                .selectAll("g")
                .data(nodeArray, function (d) {
                    return d.name + d.depth;
                });

            // Add breadcrumb and label for entering nodes.
            var entering = g.enter().append("svg:g");

            entering.append("svg:polygon")
                .attr("class", "breadcrumb-step")
                .attr("points", breadcrumbPoints)
                .style("fill", function (d) {
                    return colorForNodeName(d.name);
                });

            entering.append("svg:text")
                .attr("x", 5)
                .attr("y", b.h / 2)
                .attr("dy", "0.1em")
                .attr("text-anchor", "left")
                .text(function (d) {
                    return createNameAndPercentageString(d);
                });

            // Set position for entering and updating nodes.
            g.attr("transform", function (d, i) {
                return "translate(0, " + i * (b.h + b.s) + ")";
            });

            // Remove exiting nodes.
            g.exit().remove();
        }

        function drawLegend() {

            // Dimensions of legend item: width, height, spacing, radius of rounded rect.
            var li = {
                w: 400, h: 30, s: 3, r: 3
            };

            var g = legende.selectAll("g")
                .data(Object.keys(teilablaeufeMap).sort())
                .enter()
                .append("svg:g")
                .attr("transform", function (d, i) {
                    return "translate(0," + i * (li.h + li.s) + ")";
                });

            g.append("svg:rect")
                .attr("rx", li.r)
                .attr("ry", li.r)
                .attr("width", li.w)
                .attr("height", li.h)
                .style("fill", function (d) {
                    var color = $vpAblauf.colorForAblaufName(d);
                    return color;
                })
                .append("title")
                .text(function(d) {
                    return d;
                });

            g.append("svg:text")
                .attr("fill", function(d) {
                    var color = $vpAblauf.colorForAblaufName(d);
                    var textColor = colorUtil.getOptimalTextColorFromRgbString(color);
                    return textColor;
                })
                .attr("x", 5)
                .attr("y", li.h / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "left")
                .text(function(d) {
                    var proz = teilablaeufeMap[d] / $scope.anzahlVerpflichtungen;
                    return d + " < " + mathUtil.round(proz * 100, 2) + "% >";
                });

            elementOff(ID_LEGENDE);

        }

        var BUTTON_COLOR_ON = "green";
        var BUTTON_COLOR_OFF = "red";
        $scope.buttonColors = {};

        function elementOn(elId) {
            $timeout(function() {
                d3.select("#" + elId).style("visibility", "");
                $scope.buttonColors[elId] = BUTTON_COLOR_ON;
            });
        }

        function elementOff(elId) {
            $timeout(function() {
                d3.select("#" + elId).style("visibility", "hidden");
                $scope.buttonColors[elId] = BUTTON_COLOR_OFF;
            });
        }

        function isElementOff(elId) {
            return (d3.select("#" + elId).style("visibility") == "hidden");
        }

        function toggleElement(elId) {
            if(isElementOff(elId)) {
                elementOn(elId);
            }
            else {
                elementOff(elId);
            }
        }

        $scope.toggleElement = toggleElement;

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how
// often that sequence occurred.
        function buildHierarchy(csv) {
            function addNameToPath(path, name) {
                if (funcs.isEmpty(path)) {
                    return name;
                }
                else {
                    return path + SEP1 + name;
                }
            }

            var root = {"name": "root", "children": [], "path": ""};
            $scope.anzahlVerpflichtungen = 0;
            for (var i = 0; i < csv.length; i++) {
                var sequence = csv[i][0];
                var sizeAndVp = csv[i][1].split(SEP1);
                var vp = "";
                if(sizeAndVp.length > 1) {
                    vp = sizeAndVp[1];
                }
                var size = +sizeAndVp[0];
                if (isNaN(size)) { // e.g. if this is a header row
                    continue;
                }
                $scope.anzahlVerpflichtungen += size;
                var parts = sequence.split(SEP1);
                var currentNode = root;
                var teilablaeufeInRow = [];
                for (var j = 0; j < parts.length; j++) {
                    var children = currentNode["children"];
                    var nodeName = parts[j];
                    var teilablauf = ablaufFromNodeName(nodeName);

                    if(isAktivitaet(nodeName)) {
                        if(httpUtil.isParamSet(ROUTE_PARAM_NO_AKT)) {
                            continue;
                        }
                    }

                    if(funcs.isDefined(teilablauf) && teilablaeufeInRow.indexOf(teilablauf) < 0) {
                        addTeilablauf(teilablauf, size);
                        teilablaeufeInRow.push(teilablauf);
                    }

                    var path = addNameToPath(currentNode.path, nodeName);
                    var childNode;

                    if (j + 1 < parts.length) {
                        // Not yet at the end of the sequence; move down the tree.
                        var foundChild = false;
                        for (var k = 0; k < children.length; k++) {
                            if (children[k]["name"] == nodeName) {
                                childNode = children[k];
                                foundChild = true;
                                break;
                            }
                        }
                        // If we don't already have a child node for this branch, create it.
                        if (!foundChild) {
                            childNode = {
                                name: nodeName,
                                children: [],
                                path: path,
                                vp: vp
                            };
                            children.push(childNode);
                        }
                        currentNode = childNode;
                    } else {
                        // Reached the end of the sequence; create a leaf node.
                        childNode = {
                            name: nodeName,
                            size: size,
                            path: path,
                            vp: vp
                        };
                        children.push(childNode);
                    }
                }
            }
            return root;
        }
    }
);