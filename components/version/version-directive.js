'use strict';

angular.module(com_eosItServices_fx.subModule('version.version-directive'), [])

    .directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }]);
