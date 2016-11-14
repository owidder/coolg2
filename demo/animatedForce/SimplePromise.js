'use strict';

function SimplePromise() {
    var that = this;
    var _resolve;
    var _reject;

    that.promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });

    that.resolve = function (data) {
        _resolve(data);
    };

    that.reject = function(data) {
        _reject(data);
    };
}

