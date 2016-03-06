'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).factory("svgUtil", function() {

    function createTranslateString(x, y) {
        return "translate(" + x + "," + y + ")";
    }

    return {
        createTranslateString: createTranslateString
    }
});