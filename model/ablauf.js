'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("ablauf", function($q, eventsUndMassnahmen, dateUtil, funcs, ruleEngine) {

    var deferred = $q.defer();

    var ready = deferred.promise;

    var ablauf = [];
    var datumToMassnahmeEventMap;

    var miscValues = {};

    var phaseChanges = [];

    var STATISTIC_MISC_VALUES = {
        ALTER_DER_FORDERUNG: "ALTER_DER_FORDERUNG",
        RESTSALDO: "RESTSALDO",
        AKTUELLES_EREIGNIS: "AKTUELLES_EREIGNIS"
    };

    function createCsv() {
        var csv = "Datum,Massnahme,Bemerkung\n";
        ablauf.forEach(function(ablaufRow) {
            var csvRow = [
                ablaufRow.datum,
                ablaufRow.id,
                ablaufRow.bemerkung
            ].join(",") + "\n";
            csv += csvRow;
        });

        return csv;
    }

    function getAblauf() {
        return ablauf;
    }

    function getDatumToMassnahmeEventMap() {
        return  datumToMassnahmeEventMap;
    }

    function refreshPhaseChanges(yyyy_mm_dd) {
        var finished = $q.defer();

        phaseChanges.length = 0;
        var date = firstYYYY_MM_DD();
        var statistic, promise;
        var allPromises = [];
        while(funcs.isDefined(date) && date <= yyyy_mm_dd) {
            statistic = statisticUntil(date);
            promise = ruleEngine.getPhaseChange(statistic, date);
            allPromises.push(promise);
            promise.then(function(phaseChange) {
                phaseChanges.push(phaseChange);
            });
            date = dateUtil.incByOneDay(date);
        }

        $q.all(allPromises).then(function() {
            phaseChanges.sort(dateUtil.createYYYY_MM_DDcomparator());
            finished.resolve();
        });

        return finished.promise;
    }

    function statisticUntil(yyyy_mm_dd) {
        var statistic = {
            eventsUndMassnahmen: {},
            miscValues: {}
        };
        var untilDate = dateUtil.getDateFromYYYY_MM_DD(yyyy_mm_dd);
        for(var i = 0; i < ablauf.length; i++) {
            var entry = ablauf[i];
            var entryDate = dateUtil.getDateFromYYYY_MM_DD(entry.datum);
            if(entryDate > untilDate) {
                break;
            }

            var massnahmeEventId = entry.id;
            if(funcs.isDefined(statistic.eventsUndMassnahmen[massnahmeEventId])) {
                statistic.eventsUndMassnahmen[massnahmeEventId].count++;
            }
            else {
                statistic.eventsUndMassnahmen[massnahmeEventId] = {
                    count: 1,
                    name: entry.name
                };
            }
            statistic.eventsUndMassnahmen[massnahmeEventId].daysSinceLast = dateUtil.daysBetweenDates(entryDate, untilDate);
        }

        statistic.miscValues[STATISTIC_MISC_VALUES.ALTER_DER_FORDERUNG] = daysSinceKE(yyyy_mm_dd);

        funcs.setPropertyIfValueNotEmpty(statistic.miscValues, STATISTIC_MISC_VALUES.RESTSALDO, miscValues[STATISTIC_MISC_VALUES.RESTSALDO]);
        funcs.setPropertyIfValueNotEmpty(statistic.miscValues, STATISTIC_MISC_VALUES.AKTUELLES_EREIGNIS,
            funcs.get(getEvent(yyyy_mm_dd), "name"));

        return statistic;
    }

    function removeMassnahmeEvent(yyyy_mm_dd) {
        delete datumToMassnahmeEventMap[yyyy_mm_dd];
        fillAblauf();
    }

    function getEvent(yyyy_mm_dd) {
        var event = datumToMassnahmeEventMap[yyyy_mm_dd];
        if(funcs.isDefined(event) && event.typ == eventsUndMassnahmen.types.TYPE_EVENT) {
            return event;
        }

        return undefined;
    }

    function addMassnahmeEvent(yyyy_mm_dd, massnahmeEventId, bemerkung) {
        var all = eventsUndMassnahmen.getAll();
        var type = all[massnahmeEventId].type;
        var name = all[massnahmeEventId].name;
        datumToMassnahmeEventMap[yyyy_mm_dd] = {
            datum: yyyy_mm_dd,
            id: massnahmeEventId,
            name: name,
            typ: type,
            bemerkung: bemerkung
        };
        fillAblauf();
    }

    function fillAblauf() {
        ablauf.length = 0;

        funcs.forEachKeyAndVal(datumToMassnahmeEventMap, function(datum, massnahmeEvent) {
            ablauf.push(massnahmeEvent);
        });

        ablauf.sort(dateUtil.createYYYY_MM_DDcomparator());
    }

    d3.csv("rsrc/ablauf.csv", function (error, csv) {
        if (error) throw error;

        datumToMassnahmeEventMap = {};
        d3.nest()
            .key(function (d) {
                return d.Datum;
            })
            .rollup(function (d) {
                addMassnahmeEvent(d[0].Datum, d[0].Massnahme, d[0].Bemerkung);
                return d;
            })
            .map(csv);

        eventsUndMassnahmen.ready.then(function() {
            fillAblauf();
            deferred.resolve();
        });
    });

    /**
     *
     * @returns datum of first entry (or undefined)
     */
    function firstYYYY_MM_DD() {
        var ret;
        var first = ablauf[0];
        if(funcs.isDefined(first)) {
            ret = first.datum;
        }

        return ret;
    }

    /**
     * days betrween first entry in ablauf and yyyy_mm_dd
     * @param yyyy_mm_dd
     */
    function daysSinceKE(yyyy_mm_dd) {
        return dateUtil.daysBetweenDates(firstYYYY_MM_DD(), yyyy_mm_dd);
    }

    function clear() {
        datumToMassnahmeEventMap = {};
        fillAblauf();
    }

    return {
        getAblauf: getAblauf,
        getDatumToMassnahmeEventMap: getDatumToMassnahmeEventMap,
        ready: ready,
        statisticUntil: statisticUntil,
        addMassnahmeEvent: addMassnahmeEvent,
        removeMassnahmeEvent: removeMassnahmeEvent,
        createCsv: createCsv,
        clear: clear,
        daysSinceKE: daysSinceKE,
        STATISTIC_MISC_VALUES: STATISTIC_MISC_VALUES,
        miscValues: miscValues,
        getEvent: getEvent,
        refreshPhaseChanges: refreshPhaseChanges
    }
});