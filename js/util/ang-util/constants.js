'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).factory('constants', function(funcs) {
    var constants =  {};

    if(funcs.isDefined(com_geekAndPoke_coolg.ENV)) {
        funcs.forEachKeyAndVal(com_geekAndPoke_coolg.ENV, function(key, val) {
            constants[key] = val;
        });
    }

    return constants;
});



