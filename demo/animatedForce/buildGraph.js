'use strict';

function BuildGraph(width, height, svgId, containerId, radius) {

    var vis = d3.select('#' + containerId)
        .append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", svgId)
        .attr("pointer-events", "all")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .append('svg:g');

    var gLinks = vis.append("g")
        .attr("class", "links");

    var gNodes = vis.append("g")
        .attr("class", "nodes");

    var nodes = [];
    var links = [];

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) {
            return d.id;
        }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width/2, height/2));

    var update = function () {

        simulation.nodes(nodes);
        simulation.force("link").links(links);

        var link = gLinks.selectAll("line")
            .data(links, function (d) {
                return d.source.id + "-" + d.target.id;
            });

        link.enter().append("line")
            .attr("id", function (d) {
                return d.source.id + "-" + d.target.id;
            })
            .attr("stroke-width", function (d) {
                return d.value / 10;
            })
            .attr("class", "link");
        link.append("title")
            .text(function (d) {
                return d.value;
            });
        link.exit().remove();

        var node = gNodes.selectAll("circle.node")
            .data(nodes, function (d) {
                return d.id;
            });

        var nodeEnter = node.enter()
            .append("circle")
            .attr("r", radius)
            .attr("id", function (d) {
                return d.id;
            })
            .attr("class", "node")
            .attr("fill", function(d) {
                return d.color;
            })
            .attr("cx", width/2)
            .attr("cy", height/2)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.exit().remove();

        simulation.on("tick", function () {

            vis.selectAll("circle.node")
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

            vis.selectAll("line")
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });
        });

        function dragstarted(d) {
            if (!d3.event.active) {
                simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) {
                simulation.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
        }

    };

    this.addNewRun = function(id, color) {
        nodes.splice(0, 0, {id: id, color: color});
        if(nodes.length > 1) {
            links.push({"source": nodes[0], "target": nodes[1], "value": 20});
        }
        update();
    };

    this.simulation = simulation;
}