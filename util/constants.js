'use strict';

angular.module(com_eosItServices_fx.moduleName).factory('constants', function(funcs) {
    var constants =  {};

    if(funcs.isDefined(com_eosItServices_fx.ENV)) {
        funcs.forEachKeyAndVal(com_eosItServices_fx.ENV, function(key, val) {
            constants[key] = val;
        });
    }

    return constants;
});



