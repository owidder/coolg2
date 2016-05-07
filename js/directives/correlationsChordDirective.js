'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("correlationsChord", function() {
    var funcs = bottle.container.funcs;

    function link(scope) {

        function posNeg(d) {
            return scope.posNegMatrix[d.source.index][d.target.index];
        }

        var width = scope.width,
            height = scope.height,
            innerRadius = Math.min(width, height) * .41,
            outerRadius = innerRadius * 1.1;

        var svg = d3.select("#chord").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var rootG = svg.append("g");
        var groupG;
        var tickG;
        var chordG;

        var selectedSymbolA;
        var selectedSymbolB;

        function reset() {
            rootG.selectAll("g").remove();
            groupG = rootG.append("g");
            tickG = rootG.append("g");
            chordG = rootG.append("g")
                .attr("class", "chord");
        }


        function redrawChord(correlationsMatrix) {

            var chord = d3.layout.chord()
                .padding(.05)
                .sortSubgroups(d3.descending)
                .matrix(correlationsMatrix);

            /**
             * group
             */
            var groupPathData = groupG.selectAll("path")
                .data(chord.groups);

            var groupPathEnter = groupPathData.enter()
                .append("path")
                .attr("class", function(d) {
                    return "group + object-" + scope.objects[d.index].symbol;
                })
                .on("mouseover", fade(.1))
                .on("mouseout", fade(1));

            var groupPathAll = groupG.selectAll("path")
                .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius));

            groupPathData.exit().remove();

            /**
             * ticks
             */

            var tickGroupsData = tickG.selectAll("g.tickGroup")
                .data(chord.groups);

            var tickGroupsEnter = tickGroupsData.enter()
                .append("g")
                .attr("class", "tickGroup");

            var tickGroupsAll = tickG.selectAll("g.tickGroup");

            tickGroupsData.exit().remove();

            var ticksData = tickGroupsAll.selectAll("g.tick")
                .data(groupTicks);

            var ticksEnter = ticksData.enter()
                .append("g")
                .attr("class", "tick");

            var ticksAll = tickGroupsAll.selectAll("g.tick")
                .attr("transform", function(d) {
                    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + outerRadius + ",0)";
                });

            ticksEnter.append("line")
                .attr("x1", 1)
                .attr("y1", 0)
                .attr("x2", 5)
                .attr("y2", 0)
                .style("stroke", "#000");

            ticksEnter.append("text")
                .attr("x", 8)
                .attr("dy", ".35em")
                .attr("transform", function(d) {
                    return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
                })
                .style("text-anchor", function(d) {
                    return d.angle > Math.PI ? "end" : null;
                })
                .text(function(d) {
                    return d.label;
                });

            ticksData.exit().remove();

            /**
             * chords
             */

            var chordData = chordG.selectAll("path")
                .data(chord.chords);

            var chordPathEnter = chordData.enter()
                .append("path");

            chordPathEnter.append("title");

            function getSelectedClass(d) {
                var selectedClass = "none";
                if(funcs.isDefined(selectedSymbolA) && funcs.isDefined(selectedSymbolB)) {
                    if((selectedSymbolA == scope.objects[d.source.index].symbol && selectedSymbolB == scope.objects[d.target.index].symbol) ||
                        (selectedSymbolB == scope.objects[d.source.index].symbol && selectedSymbolA == scope.objects[d.target.index].symbol)) {
                        selectedClass = "selected";
                    }
                    else {
                        selectedClass = "unselected";
                    }
                }

                return selectedClass;
            }

            var chordPathAll = chordG.selectAll("path")
                .attr("d", d3.svg.chord().radius(innerRadius))
                .attr("class", function(d) {
                    var clazz = getSelectedClass(d);
                    if(posNeg(d) < 0) {
                        clazz += " chord-neg";
                    }
                    else {
                        clazz += " chord-pos";
                    }

                    return clazz;
                })
                .on("click", function(d) {
                    selectedSymbolA = scope.objects[d.source.index].symbol;
                    selectedSymbolB = scope.objects[d.target.index].symbol;
                    scope.symbolsSelectedEvent.startWhenFirstListenerReady(selectedSymbolA, selectedSymbolB);
                });

            chordPathAll.select("title")
                .text(function(d) {
                    var nameA = scope.objects[d.source.index].name;
                    var nameB = scope.objects[d.target.index].name;
                    var value = math.round(d.source.value/1000, 2) * posNeg(d);
                    return nameA + " <-> " + nameB + ": " +  value;
                });

            chordData.exit().remove();

        }

        scope.redrawEvent.on(function() {
            redrawChord(scope.correlationsMatrix);
        });

        scope.newObjectsEvent.on(function() {
            reset();
            redrawChord(scope.correlationsMatrix);
        });

// Returns an array of tick angles and labels, given a group.
        function groupTicks(d) {
            var k = (d.endAngle - d.startAngle) / d.value;
            var range = d3.range(0, d.value, 1000);
            var gt;
            if(range.length > 0) {
                gt = d3.range(0, d.value, 1000).map(function(v, i) {
                    var label = i == 0 ? scope.objects[d.index].symbol : v / 1000 + "";
                    return {
                        angle: v * k + d.startAngle,
                        label: label
                    };
                });
            }
            else {
                gt = [{
                    angle: d.startAngle,
                    label: scope.objects[d.index].symbol
                }]
            }
            return gt;
        }

// Returns an event handler for fading a given chord group.
        function fade(opacity) {
            return function(g, i) {
                svg.selectAll(".chord path")
                    .filter(function(d) { return d.source.index != i && d.target.index != i; })
                    .transition()
                    .style("opacity", opacity);
            };
        }
    }

    return {
        link: link,
        scope: {
            width: "@",
            height: "@",
            objects: "=",
            correlationsMatrix: "=",
            posNegMatrix: "=",
            ready: "=",
            redrawEvent: "=",
            newObjectsEvent: "=",
            symbolsSelectedEvent: "="
        },
        restrict: "E",
        templateUrl: "js/directives/correlationsChordDirective.html"
    }
});