'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).factory('dimensions', function(funcs) {
    var screenDimensions = {
        width: $(window).width(),
        height: $(window).height()
    };

    function width(w) {
        var _width;

        if(!funcs.isSet(w)) {
            _width = screenDimensions.width;
        }
        else  {
            _width = screenDimensions.width + parseInt(w);
        }

        return _width;
    }

    function height(h) {
        var _height;

        if(!funcs.isSet(h)) {
            _height = screenDimensions.height;
        }
        else {
            _height = screenDimensions.height + parseInt(h);
        }

        return _height;
    }

    return {
        screenDimensions: screenDimensions,
        width: width,
        height: height
    }
});
