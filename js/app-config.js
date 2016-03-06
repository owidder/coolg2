'use strict';

angular.module(com_geekAndPoke_coolg.moduleName)
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/stock', {
                templateUrl: 'js/views/stockView/stockView.html',
                controller: com_geekAndPoke_coolg.STOCK_CONTROLLER
            })
            .otherwise({redirectTo: '/stock'});
    }])
    .run(function(dateUtil, funcs) {
        bottle.factory('dateUtil', function(container) {
            return dateUtil;
        });
        bottle.factory('funcs', function(container) {
            return funcs;
        });
    });
