'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("scatterPlot", function() {

    function link(scope) {

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select("#scatter").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        rootG = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x, y, xAxis, yAxis;
        var rootG, xG, yG;

        function reset() {
            rootG.selectAll("g").remove();

            x = d3.scale.linear()
                .range([0, width]);

            y = d3.scale.linear()
                .range([height, 0]);

            x.domain(d3.extent(scope.allValues, function(d) {
                return d[0];
            })).nice();
            y.domain(d3.extent(scope.allValues, function(d) {
                return d[1];

            })).nice();

            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            xG = rootG.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                .attr("class", "label")
                .attr("x", width)
                .attr("y", -6)
                .style("text-anchor", "end")
                .text(scope.names[0]);

            yG = rootG.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(scope.names[1])
        }

        function redraw() {
            var data = rootG.selectAll(".dot")
                .data(scope.periodValues);

            data.enter()
                .append("circle")
                .attr("class", "dot")
                .attr("r", 3);

            rootG.selectAll(".dot")
                .attr("cx", function(d) {
                    return x(d[0]);
                })
                .attr("cy", function(d) {
                    return y(d[1]);
                });

            data.exit().remove();
        }

        scope.redrawEvent.on(redraw);
        scope.resetEvent.on(function() {
            reset();
            redraw();
        });
    }

    return {
        link: link,
        scope: {
            allValues: "=",
            periodValues: "=",
            names: "=",
            redrawEvent: "=",
            resetEvent: "="
        },
        restrict: "E",
        templateUrl: "js/directives/scatterPlotDirective.html"
    }
});
