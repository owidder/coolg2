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
            return "static";
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

        var data = gStatic.selectAll("path", "static")
            .data(staticBodies);

        data.enter()
            .append("path")
            .attr("class", createClassNameFromBodyForStatic)
            .attr("d", createPathFromBody);

        data.exit().remove();
    }

    function renderD3Dynamic() {
        var dynamicBodies = Matter.Composite.allBodies(engine.world).filter(isDynamic);

        var data = gDynamic.selectAll("path", "dynamic")
            .data(dynamicBodies, function(d) {
                return d.id;
            });

        data.enter()
            .append("path")
            .attr("class", createClassNameFromBodyForDynamic);

        gDynamic.selectAll("path", "dynamic")
            .attr("d", createPathFromBody);

        data.exit().remove();
    }

    this.constructor.prototype.renderD3 = function() {
        if(gStatic != null) {
            renderD3Static();
        }
        if(gDynamic != null) {
            renderD3Dynamic();
        }
    }
}
