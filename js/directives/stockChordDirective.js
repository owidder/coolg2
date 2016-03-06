'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("stockChord", function(funcs) {

    function link(scope) {

        function posNeg(d) {
            return scope.posNegMatrix[d.source.index][d.target.index];
        }

        var width = 960,
            height = 500,
            innerRadius = Math.min(width, height) * .41,
            outerRadius = innerRadius * 1.1;

        var svg = d3.select("#chord").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var rootG = svg.append("g");
        var tickG = svg.append("g");
        var chordG = svg.append("g")
            .attr("class", "chord");


        function redrawChord() {

            var chord = d3.layout.chord()
                .padding(.05)
                .sortSubgroups(d3.descending)
                .matrix(scope.correlationsMatrix);

            /**
             * group
             */
            var groupPathData = rootG.selectAll("path")
                .data(chord.groups);

            var groupPathEnter = groupPathData.enter()
                .append("path")
                .attr("class", function(d) {
                    return "group + stock-" + scope.stockNames[d.index];
                })
                .on("mouseover", fade(.1))
                .on("mouseout", fade(1));

            var groupPathAll = rootG.selectAll("path")
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
                .append("path")
                .style("opacity", 1);

            chordPathEnter.append("title");

            var chordPathAll = chordG.selectAll("path")
                .attr("d", d3.svg.chord().radius(innerRadius))
                .attr("class", function(d) {
                    if(posNeg(d) < 0) {
                        return "chord-neg";
                    }
                    return "chord-pos";
                });

            chordPathAll.select("title")
                .text(function(d) {
                    var nameA = scope.stockNames[d.source.index];
                    var nameB = scope.stockNames[d.target.index];
                    var value = math.round(d.source.value/1000, 2) * posNeg(d);
                    return nameA + " <-> " + nameB + ": " +  value;
                });

            chordData.exit().remove();

        }

        scope.redrawEvent.on(redrawChord);

// Returns an array of tick angles and labels, given a group.
        function groupTicks(d) {
            var k = (d.endAngle - d.startAngle) / d.value;
            var range = d3.range(0, d.value, 1000);
            var gt;
            if(range.length > 0) {
                gt = d3.range(0, d.value, 1000).map(function(v, i) {
                    var label = i == 0 ? scope.stockNames[d.index] : v / 1000 + "";
                    return {
                        angle: v * k + d.startAngle,
                        label: label
                    };
                });
            }
            else {
                gt = [{
                    angle: d.startAngle,
                    label: scope.stockNames[d.index]
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
            stockNames: "=",
            correlationsMatrix: "=",
            posNegMatrix: "=",
            ready: "=",
            redrawEvent: "="
        },
        restrict: "E",
        templateUrl: "js/directives/stockChordDirective.html"
    }
});