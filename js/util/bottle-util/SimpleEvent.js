'use strict';

bottle.factory("SimpleEvent", function(container) {
    var SimplePromise = bottle.container.SimplePromise;

    function SimpleEvent() {
        var self = this;
        var listeners = [];

        var listenersReadyPromise = new SimplePromise();

        self.on = function(listener) {
            listeners.push(listener);
            listenersReadyPromise.resolve();
        };

        self.listenersReady = listenersReadyPromise.promise;

        self.start = function(data) {
            listeners.forEach(function(listener) {
                listener(data);
            });
        };

        self.startWhenListenersReady = function(data) {
            self.listenersReady.then(function() {
                self.start(data);
            });
        }
    }

    return SimpleEvent;
});