'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).directive("rangeSlider", function() {
    var dateUtil = bottle.container.dateUtil;
    var funcs = bottle.container.funcs;

    function link(scope) {
        scope.rangeValue = scope.start;

        function valueChanged(newValue) {
            scope.rangeValue = newValue;
        }

        scope.onChange = function() {
            if(funcs.isDefined(scope.sliderChangedEventOut)) {
                scope.sliderChangedEventOut.startWhenFirstListenerReady(scope.rangeValue);
            }
        };

        if(funcs.isDefined(scope.valueChangedEventIn)) {
            scope.valueChangedEventIn.on(valueChanged);
        }

        scope.onChange();
    }

    return {
        link: link,
        scope: {
            start: "@",
            rangeMin: "@",
            rangeMax: "@",
            leftLabel: "@",
            rightLabel: "@",
            sliderChangedEventOut: "=",
            valueChangedEventIn: "="
        },
        restrict: "E",
        templateUrl: "js/directives/rangeSliderDirective.html"
    }

});