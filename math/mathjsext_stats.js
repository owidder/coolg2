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
        var stdX = math.std(X);
        var stdY = math.std(Y);
        var cov = covariance(X, Y);
        var corr = cov/(stdX*stdY);

        return corr;
    }

    math.import({
        center: center,
        covariance: covariance,
        correlation: correlation
    });
})();