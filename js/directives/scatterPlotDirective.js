'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("scatterPlot", function() {
    var funcs = bottle.container.funcs;

    function link(scope) {

        var margin = {top: 20, right: 20, bottom: 30, left: 40};

        var svgG = scope.svg
            .append("g");

        rootG = svgG.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x, y, xAxis, yAxis;
        var rootG, xG, yG;
        var currentCorrCoeff;

        function remove() {
            svgG.transition()
                .duration(1000)
                .attr("transform", "translate(0, 0)")
                .selectAll(".toremove").remove();
        }

        function reset() {
            remove();

            x = d3.scale.linear()
                .range([0, scope.width()]);

            y = d3.scale.linear()
                .range([scope.height(), 0]);

            x.domain(d3.extent(scope.periodValuesWithDates, function(d) {
                return d[0];
            })).nice();
            y.domain(d3.extent(scope.periodValuesWithDates, function(d) {
                return d[1];

            })).nice();

            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            currentCorrCoeff = rootG.append("g")
                .append("text")
                .attr("class", "toremove corrCoeff")
                .attr("x", scope.width()/10)
                .attr("y", scope.height()/2);

            xG = rootG.append("g")
                .attr("class", "toremove x axis")
                .attr("transform", "translate(0," + scope.height() + ")")
                .call(xAxis)
                .append("text")
                .attr("class", "toremove x label")
                .attr("x", scope.width())
                .attr("y", -6)
                .style("text-anchor", "end")
                .text(scope.names[0]);

            yG = rootG.append("g")
                .attr("class", "toremove y axis")
                .call(yAxis)
                .append("text")
                .attr("class", "toremove y label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(scope.names[1])
        }

        function reAxis() {
            var t = svgG.transition();

            x.domain(d3.extent(scope.periodValuesWithDates, function(d) {
                return d[0];
            })).nice();
            y.domain(d3.extent(scope.periodValuesWithDates, function(d) {
                return d[1];

            })).nice();

            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            t.selectAll(".x.axis").call(xAxis);
            t.selectAll(".y.axis").call(yAxis);
            t.select(".x.label").text(scope.names[0]);
            t.select(".y.label").text(scope.names[1]);
        }

        function redraw(corrCoeff) {
            var arrA = funcs.createArrayOfNthElements(scope.periodValuesWithDates, 0);
            var arrB = funcs.createArrayOfNthElements(scope.periodValuesWithDates, 1);
            var meanA = math.mean(arrA);
            var meanB = math.mean(arrB);

            svgG.transition()
                .duration(1000)
                .attr("transform", "translate(" + scope.offsetX() + "," + scope.offsetY() + ")");

            function redOrGreen(valA, valB) {
                if((valA <= meanA && valB <= meanB) || (valA >= meanA && valB >= meanB)) {
                    return "green";
                }

                return "red";
            }

            function position(selection) {
                selection
                    .attr("cx", function(d) {
                        return x(d[0]);
                    })
                    .attr("cy", function(d) {
                        return y(d[1]);
                    });
            }

            var data = rootG.selectAll(".dot")
                .data(scope.periodValuesWithDates, function(d) {
                    return d[2] + "_" + d[3];
                });

            var enter = data.enter()
                .append("circle")
                .attr("_legend", function(d) {
                    var valA = math.round(d[0], 2);
                    var valB = math.round(d[1], 2);
                    return scope.names[0] + "(" + d[2] + "): " + valA + " <-> " + scope.names[1]+ "(" + d[3] + "): " + valB;
                })
                .attr("class", "dot toremove")
                .attr("r", 3)
                .on("mouseover", function() {
                    mouseOverChord(this);
                })
                .on("mouseout", mouseOutChord)
                .call(position);

            var rootGTransition = rootG.transition();

            var all = rootGTransition.selectAll(".dot")
                .call(position);

            all.attr("class", function(d) {
                return "toremove dot " + "dot-" + redOrGreen(d[0], d[1]);
            });

            data.exit().remove();

            rootG.select(".corrCoeff")
                .attr("class", function() {
                    var clazz = "toremove corrCoeff";
                    if(corrCoeff < 0) {
                        clazz += " neg";
                    }
                    else {
                        clazz += " pos";
                    }

                    return clazz;
                })
                .text(corrCoeff);
        }

        function mouseOverChord(element) {
            scope.mouseOverEvent.startWhenFirstListenerReady(element);
        }

        function mouseOutChord() {
            scope.mouseOverEvent.startWhenFirstListenerReady(undefined);
        }

        scope.resetEvent.on(function(corrCoeff) {
            reset();
            redraw(corrCoeff);
        });
        scope.redrawEvent.on(function(corrCoeff) {
            reAxis();
            redraw(corrCoeff);
        });
        scope.removeEvent.on(remove);
    }

    return {
        link: link,
        scope: {
            svg: "=",
            offsetX: "=",
            offsetY: "=",
            width: "=",
            height: "=",
            allValues: "=",
            periodValuesWithDates: "=",
            names: "=",
            mouseOverEvent: "=",
            redrawEvent: "=",
            resetEvent: "=",
            removeEvent: "="
        },
        restrict: "E",
        templateUrl: "js/directives/scatterPlotDirective.html"
    }
});
