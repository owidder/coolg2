'use strict';

angular.module(com_eosItServices_fx.moduleName + '.version', [
        com_eosItServices_fx.subModule('version.interpolate-filter'),
        com_eosItServices_fx.subModule('version.version-directive')
    ])

    .value('version', '0.1');
