'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("scatterPlot", function() {

    function link(scope) {

        function redraw() {

        }
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var x = d3.scale.linear()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var svg = d3.select("#scatter").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(d3.extent(scope.values, function(d) {
            return d[0];
        })).nice();
        y.domain(d3.extent(data, function(d) {
            return d[1];
        })).nice();

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text(scope.names[0]);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(scope.names[1])

        svg.selectAll(".dot")
            .data(scope.values)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", function(d) {
                return x(d[0]);
            })
            .attr("cy", function(d) {
                return y(d[1]);
            })
            .style("fill", "lightgray");
    }

    return {
        link: link,
        scope: {
            values: "=",
            names: "=",
            redrawEvent: "="
        },
        restrict: "E",
        templateUrl: "js/directives/scatterPlotDirective.html"
    }
});