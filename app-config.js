'use strict';

// Declare app level module which depends on views, and components
angular.module(com_geekAndPoke_coolg.moduleName)
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/stock', {
                templateUrl: 'stockView/stockView.html',
                controller: com_geekAndPoke_coolg.STOCK_CONTROLLER
            })
            .otherwise({redirectTo: '/stock'});
    }]);
