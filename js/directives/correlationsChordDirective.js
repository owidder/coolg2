'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("correlationsChord", function() {
    var funcs = bottle.container.funcs;
    var SvgLegend = bottle.container.SvgLegend;

    function link(scope) {

        function posNeg(d) {
            return scope.posNegMatrix[d.source.index][d.target.index];
        }

        function createLegend(svgElement) {
            return svgElement.getAttribute("_legend");
        }

        var svgLegend = new SvgLegend(createLegend);

        var svgG = scope.svg
            .append("g");

        svgLegend.init();

        var rootG = svgG.append("g");
        var groupG;
        var tickG;
        var chordG;

        var selectedSymbolA;
        var selectedSymbolB;

        function areAnySymbolsSelected() {
            return (funcs.isDefined(selectedSymbolA) && funcs.isDefined(selectedSymbolB));
        }

        function areTheseSymbolsSelected(sym1, sym2) {
            return (selectedSymbolA == sym1 && selectedSymbolB == sym2) ||
                (selectedSymbolB == sym1 && selectedSymbolA == sym2);
        }

        function selectSymbols(sym1, sym2) {
            selectedSymbolA = sym1;
            selectedSymbolB = sym2;
            scope.symbolsSelectedEvent.startWhenFirstListenerReady(selectedSymbolA, selectedSymbolB);
        }

        function deselectSymbols() {
            selectedSymbolA = undefined;
            selectedSymbolB = undefined;
            scope.symbolsDeselectedEvent.startWhenFirstListenerReady();
        }

        function reset() {
            rootG.selectAll("g").remove();
            groupG = rootG.append("g");
            tickG = rootG.append("g");
            chordG = rootG.append("g")
                .attr("class", "chord");
        }


        function redrawChord(correlationsMatrix, duration) {

            if(math.matrixSum(correlationsMatrix) == 0) {
                return;
            }

            var width = scope.width();
            var height = scope.height();

            svgG.transition()
                .duration(duration)
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            var innerRadius = Math.min(width, height) * .41,
                outerRadius = innerRadius * 1.1;


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
                .transition()
                .duration(duration)
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
                .transition()
                .duration(duration)
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
                .on("click", clickOnChord);

            function getSelectedClass(d) {
                var selectedClass = "none";
                if(areAnySymbolsSelected()) {
                    if(areTheseSymbolsSelected(scope.objects[d.source.index].symbol, scope.objects[d.target.index].symbol)) {
                        selectedClass = "selected";
                    }
                    else {
                        selectedClass = "unselected";
                    }
                }

                return selectedClass;
            }

            function clickOnChord(d) {
                var sym1 = scope.objects[d.source.index].symbol;
                var sym2 = scope.objects[d.target.index].symbol;
                if(areTheseSymbolsSelected(sym1, sym2)) {
                    deselectSymbols();
                }
                else {
                    selectSymbols(sym1, sym2);
                }
            }

            var chordPathAll = chordG.selectAll("path")
                .attr("class", function(d) {
                    var clazz = "forlegend " + getSelectedClass(d);
                    if(posNeg(d) < 0) {
                        clazz += " chord-neg";
                    }
                    else {
                        clazz += " chord-pos";
                    }

                    return clazz;
                })
                .attr("_legend", function (d) {
                    var nameA = scope.objects[d.source.index].name;
                    var nameB = scope.objects[d.target.index].name;
                    var value = math.round(d.source.value/1000, 2) * posNeg(d);
                    return nameA + " <-> " + nameB + ": " +  value;
                })
                .transition()
                .duration(duration)
                .attr("d", d3.svg.chord().radius(innerRadius));

            chordData.exit().remove();

        }

        scope.redrawEvent.on(function(duration) {
            redrawChord(scope.correlationsMatrix, duration);
        });

        scope.newObjectsEvent.on(function() {
            reset();
            redrawChord(scope.correlationsMatrix, 0);
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
                svgG.selectAll(".chord path")
                    .filter(function(d) {
                        return d.source.index != i && d.target.index != i;
                    })
                    .transition()
                    .style("opacity", opacity);
            };
        }

        if(!funcs.isEmpty(scope.startSymbolA) && !funcs.isEmpty(scope.startSymbolB)) {
            selectSymbols(scope.startSymbolA, scope.startSymbolB);
        }
    }

    return {
        link: link,
        scope: {
            svg: "=",
            width: "=",
            height: "=",
            objects: "=",
            correlationsMatrix: "=",
            posNegMatrix: "=",
            ready: "=",
            startSymbolA: "=",
            startSymbolB: "=",
            redrawEvent: "=",
            newObjectsEvent: "=",
            symbolsSelectedEvent: "=",
            symbolsDeselectedEvent: "="
        },
        restrict: "E",
        templateUrl: "js/directives/correlationsChordDirective.html"
    }
});