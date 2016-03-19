'use strict';

bottle.factory("SimpleEvent", function(container) {
    var SimplePromise = bottle.container.SimplePromise;

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

        that.start = function(data) {
            listeners.forEach(function(listener) {
                listener(arguments);
            });
        };

        that.startWhenFirstListenerReady = function() {
            firstListenerReadyPromise.promise.then(function() {
                that.start(arguments);
            });
        };

        that.startWhenAllListenersReady = function() {
            allListenersReadyPromise.promise.then(function() {
                that.start(arguments);
            });
        };
    }

    return SimpleEvent;
});