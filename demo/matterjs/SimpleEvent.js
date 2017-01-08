'use strict';

function SimpleEvent() {
    var that = this;
    var listeners = [];

    var firstListenerReadyPromise = new SimplePromise();
    var allListenersReadyPromise = new SimplePromise();

    that.on = function(listener) {
        listeners.push(listener);
        firstListenerReadyPromise.resolve();
    };

    that.allListenersReady = function() {
        allListenersReadyPromise.resolve();
    };

    that.start = function() {
        var args = arguments;
        listeners.forEach(function(listener) {
            listener.apply(undefined, args);
        });
    };

    that.startWhenFirstListenerReady = function() {
        var args = arguments;
        firstListenerReadyPromise.promise.then(function() {
            that.start.apply(that, args);
        });
    };

    that.startWhenAllListenersReady = function() {
        var args = arguments;
        allListenersReadyPromise.promise.then(function() {
            that.start.apply(that, args);
        });
    };
}
