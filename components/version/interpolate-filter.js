'use strict';

angular.module(com_eosItServices_fx.subModule('version.interpolate-filter'), [])

    .filter('interpolate', ['version', function (version) {
        return function (text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        };
    }]);
