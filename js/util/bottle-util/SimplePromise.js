'use strict';

bottle.factory("SimplePromise", function(container) {

    function SimplePromise() {
        var self = this;
        var _resolve;
        var _reject;

        self.promise = new Promise(function(resolve, reject) {
            _resolve = resolve;
            _reject = reject;
        });

        self.resolve = function (data) {
            _resolve(data);
        };

        self.reject = function(data) {
            _reject(data);
        };
    }

    return SimplePromise;
});