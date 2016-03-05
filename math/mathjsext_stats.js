'use strict';

(function () {

    /**
     *
     * @param X
     * @returns {*} X - mean(X)
     */
    function center(X) {
        var mean = math.mean(X);
        var centeredX = math.subtract(X, mean);

        return centeredX;
    }

    function covariance(X, Y) {
        var CX = center(X);
        var CY = center(Y);
        var cov = math.dot(CX, CY);

        return cov;
    }

    function correlation(X, Y) {
        var lx = X.length;
        var ly = Y.length;
        if(lx != ly) {
            console.log("X and Y do not have the same length (" + lx + " <-> " + ly + ")");
            X.length = math.min(lx, ly);
            Y.length = math.min(lx, ly);
        }

        var sx = math.std(X);
        var sy = math.std(Y);
        var mx = math.mean(X);
        var my = math.mean(Y);
        var xy = math.dot(X, Y);

        var corr = (xy - (lx * mx * my)) / ((lx - 1) * sx * sy);

        return corr;
    }

    math.import({
        center: center,
        covariance: covariance,
        correlation: correlation
    });
})();