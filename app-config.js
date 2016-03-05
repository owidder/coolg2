'use strict';

// Declare app level module which depends on views, and components
angular.module(com_eosItServices_fx.moduleName)
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/visionAblauf', {
                templateUrl: 'visionAblaufView/visionAblaufView.html',
                controller: com_eosItServices_fx.VISION_ABLAUF_CONTROLLER,
                reloadOnSearch: false
            })
            .when('/auftrag', {
                templateUrl: 'auftragView/auftragView.html',
                controller: com_eosItServices_fx.ABLAUF_CONTROLLER,
                reloadOnSearch: false
            })
            .when('/calendar', {
                templateUrl: 'simulator/calendarView.html',
                controller: com_eosItServices_fx.CALENDAR_CONTROLLER,
                reloadOnSearch: false
            })
            .otherwise({redirectTo: '/calendar'});
    }]);
