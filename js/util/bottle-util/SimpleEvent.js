'use strict';

bottle.factory("SimpleEvent", function(container) {
    var SimplePromise = bottle.container.SimplePromise;

    function SimpleEvent() {
        var self = this;
        var listeners = [];

        var firstListenerReadyPromise = new SimplePromise();

        self.on = function(listener) {
            listeners.push(listener);
            firstListenerReadyPromise.resolve();
        };

        self.firstListenerReady = firstListenerReadyPromise.promise;

        self.start = function(data) {
            listeners.forEach(function(listener) {
                listener(data);
            });
        };

        self.startWhenFirstListenerReady = function(data) {
            self.firstListenerReady.then(function() {
                self.start(data);
            });
        }
    }

    return SimpleEvent;
});