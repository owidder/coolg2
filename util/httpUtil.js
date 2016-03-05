'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("httpUtil", function(funcs, $routeParams, $location) {

    function isParamSet(paramName) {
        return funcs.isDefined($routeParams[paramName]);
    }

    function getParam(paramName, defaultValue) {
        var val = isParamSet(paramName) ? $routeParams[paramName] : defaultValue;
        return val;
    }

    function getOriginUrl() {
        return $location.protocol() + "://" + $location.host() + ":" + $location.port();
    }

    return {
        isParamSet: isParamSet,
        getParam: getParam,
        getOriginUrl: getOriginUrl
    }
});