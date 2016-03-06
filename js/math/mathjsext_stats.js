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

    function correlation(X, Y) {
        var lx = X.length;
        var ly = Y.length;
        if(lx == 0 || ly == 0) {
            return 0;
        }
        var n = lx;
        if(lx != ly) {
            n = math.min(lx, ly);
            X.length = n;
            Y.length = n;
        }

        var sx = math.std(X);
        var sy = math.std(Y);
        var mx = math.mean(X);
        var my = math.mean(Y);
        var xy = math.dot(X, Y);

        var corr = (xy - (n * mx * my)) / ((n - 1) * sx * sy);

        return corr;
    }

    math.import({
        center: center,
        correlation: correlation
    });
})();