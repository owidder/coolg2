'use strict';

function MatterD3Renderer(_engine, _gStatic, _gDynamic) {
    var gStatic = _gStatic;
    var gDynamic = _gDynamic;
    var engine = _engine;

    function isStatic(body) {
        return body.isStatic;
    }

    function isDynamic(body) {
        return !body.isStatic;
    }

    function hasTitle(body) {
        return body.title != null;
    }

    function createPathFromBody(d) {
        var pathStr = "";
        if(d.vertices.length > 0) {
            pathStr += "M" + d.vertices[0].x + " " + d.vertices[0].y;
            if(d.vertices.length > 1) {
                var i;
                for(i = 1; i < d.vertices.length; i++) {
                    pathStr += " L" + d.vertices[i].x + " " + d.vertices[i].y;
                }
            }
        }
        pathStr += " Z";

        return pathStr;
    }

    function createClassNameFromBody(d, defaultClassName) {
        if(d.className != null) {
            return d.className;
        }
        else {
            return defaultClassName;
        }
    }

    function createClassNameFromBodyForStatic(d) {
        return createClassNameFromBody(d, "static");
    }

    function createClassNameFromBodyForDynamic(d) {
        return createClassNameFromBody(d, "dynamic");
    }

    function renderD3Static() {
        var staticBodies = Matter.Composite.allBodies(engine.world).filter(isStatic);

        var data = gStatic.selectAll("path.static")
            .data(staticBodies);

        data.enter()
            .append("path")
            .attr("class", createClassNameFromBodyForStatic)
            .attr("d", createPathFromBody);

        data.exit().remove();
    }

    function renderD3Dynamic() {
        var dynamicBodies = Matter.Composite.allBodies(engine.world).filter(isDynamic);

        var data = gDynamic.selectAll("path.dynamic")
            .data(dynamicBodies, function(d) {
                return d.id;
            });

        data.enter()
            .append("path")
            .attr("class", createClassNameFromBodyForDynamic);

        gDynamic.selectAll("path.dynamic")
            .attr("d", createPathFromBody);

        data.exit().remove();
    }

    function renderD3DynamicTitles() {
        var bodiesWithTitles = Matter.Composite.allBodies(engine.world).filter(hasTitle);

        if(bodiesWithTitles.length > 0) {
            var data = gDynamic.selectAll("text.dynamic")
                .data(bodiesWithTitles, function(d) {
                    return d.id;
                });

            data.enter()
                .append("text")
                .attr("class", "dynamic")
                .text(function(d) {
                    return d.title;
                });

            gDynamic.selectAll("text.dynamic")
                .attr("x", function(d) {
                    var avx = (d.bounds.max.x + d.bounds.min.x) / 2 - 20;
                    return avx;
                })
                .attr("y", function(d) {
                    var avy = (d.bounds.max.y + d.bounds.min.y) / 2 - 15;
                    return avy;
                });
        }

    }

    this.constructor.prototype.renderD3 = function() {
        if(gStatic != null) {
            renderD3Static();
        }
        if(gDynamic != null) {
            renderD3Dynamic();
            renderD3DynamicTitles();
        }
    }
}
