'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("mathUtil", function() {

    function hexToDec(hex) {
        return parseInt(hex, 16).toString(10);
    }

    /**
     *
     * @param n number to rount
     * @param p precision (number of digits right to the point)
     */
    function round(n, p) {
        var factor = Math.pow(10, p);
        return Math.round(n * factor) / factor;
    }

    return {
        hexToDec: hexToDec,
        round: round
    }
});