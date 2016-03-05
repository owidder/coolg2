'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("eventsUndMassnahmen", function($q, funcs) {

    var eventIds = {
        KE: "KE"
    };

    var types = {
        TYPE_MASSNAHME: "M",
        TYPE_EVENT: "E"
    };

    var all;

    var massnahmenArray = [];
    var eventArray = [];

    var massnahmenCategories = {};
    var eventCategories = {};

    function fillCategories(source, categories) {
        source.forEach(function(entry) {
            funcs.putInArrayMap(categories, entry.category, entry);
        });
    }

    function createMassnahmenAndEventArrays() {
        funcs.forEachKeyAndVal(all, function(id, obj) {
            if(obj.type == types.TYPE_MASSNAHME) {
                massnahmenArray.push(obj);
            } else {
                eventArray.push(obj);
            }
        });

        fillCategories(massnahmenArray, massnahmenCategories);
        fillCategories(eventArray, eventCategories);
    }

    var deferred = $q.defer();

    var ready = deferred.promise;

    d3.csv("rsrc/massnahmen.csv", function(error, csv) {
        if (error) {
            deferred.reject(error);
        }

        all = d3.nest()
            .key(function(d) {
                return d.ID;
            })
            .rollup(function(d) {
                return {
                    id: d[0].ID,
                    name: d[0].Name,
                    type: d[0].Typ,
                    category: d[0].Bereich,
                    active: (d[0].Aktiv == "1" ? "1" : "0")
                };
            })
            .map(csv);

        createMassnahmenAndEventArrays();
        deferred.resolve();
    });

    function getAll() {
        return all;
    }

    function getMassnahmen() {
        return massnahmenArray;
    }

    function getEvents() {
        return eventArray;
    }

    function getMassnahmenCategories() {
        return massnahmenCategories;
    }

    function getEventCategories() {
        return eventCategories;
    }

    return {
        getAll: getAll,
        getMassnahmen: getMassnahmen,
        getEvents: getEvents,
        ready: ready,
        eventIds: eventIds,
        getMassnahmenCategories: getMassnahmenCategories,
        getEventCategories: getEventCategories,
        types: types
    }
});