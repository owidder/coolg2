'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("svgUtil", function() {

    function createTranslateString(x, y) {
        return "translate(" + x + "," + y + ")";
    }

    return {
        createTranslateString: createTranslateString
    }
});