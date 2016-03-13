'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("rangeSlider", function() {
    var dateUtil = bottle.container.dateUtil;

    function link(scope) {
        scope.rangeValue = scope.rangeMin;

        function valueChanged(newValue) {
            scope.rangeValue = newValue;
        }

        scope.onChange = function() {
            scope.sliderChangedEventOut.startWhenListenersReady(scope.rangeValue);
        };

        scope.valueChangedEventIn.on(valueChanged);
    }

    return {
        link: link,
        scope: {
            rangeMin: "@",
            rangeMax: "@",
            sliderChangedEventOut: "=",
            valueChangedEventIn: "="
        },
        restrict: "E",
        templateUrl: "js/directives/rangeSliderDirective.html"
    }

});