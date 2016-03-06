'use strict';

bottle.factory("SimpleEvent", function(container) {
    var SimplePromise = bottle.container.SimplePromise;

    function SimpleEvent() {
        var listeners = [];

        var listenersReadyPromise = new SimplePromise();

        this.on = function(listener) {
            listeners.push(listener);
            listenersReadyPromise.resolve();
        };

        this.listenersReady = listenersReadyPromise.promise;

        this.start = function() {
            listeners.forEach(function(listener) {
                listener();
            });
        };
    }

    return SimpleEvent;
});