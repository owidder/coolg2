'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("ruleEngine", function($http, eventsUndMassnahmen, funcs, $q, ablauf, $location, httpUtil) {

    var deferred = $q.defer();
    var ready = deferred.promise;

    var URL = funcs.isDefined(com_eosItServices_fx.ENV.mockMode) ?
        "rsrc/answer.json" : (funcs.isDefined(com_eosItServices_fx.ENV.RULES_ENGINE_HOST) ? com_eosItServices_fx.ENV.RULES_ENGINE_HOST + com_eosItServices_fx.ENV.RULES_ENGINE_PATH : "");
    if(funcs.isEmpty(URL)) {
        URL =  httpUtil.getOriginUrl() + com_eosItServices_fx.ENV.RULES_ENGINE_PATH;
    }

    function transformStatisticToHistory(statistic) {
        var history = {
            id: 1,
            massnahmenHistory: [],
            alterForderungInTagen: statistic.miscValues[ablauf.STATISTIC_MISC_VALUES.ALTER_DER_FORDERUNG],
            restsaldo: statistic.miscValues[ablauf.STATISTIC_MISC_VALUES.RESTSALDO],
            aktuellesEreignis: statistic.miscValues[ablauf.STATISTIC_MISC_VALUES.AKTUELLES_EREIGNIS]
        };

        funcs.forEachKeyAndVal(statistic.eventsUndMassnahmen, function(mId, stat) {
            var allEventsUndMassnahmen = eventsUndMassnahmen.getAll();
            var name = allEventsUndMassnahmen[mId].name;
            var historyEntry = {
                idMassnahme: name,
                anzahlAufrufe: stat.count,
                tageSeitLetztemAufruf: stat.daysSinceLast
            };
            history.massnahmenHistory.push(historyEntry);
        });

        return history;
    }

    function getPhaseChange(statistic, yyyy_mm_dd) {
        var waitForAnswer = $q.defer();

        getMassnahmen(statistic).then(function(data) {
            var newPhase;
            data.forEach(function(massnahme) {
                if(massnahme.ausgewaehlt && massnahme.idMassnahme.indexOf("Phase") == 0) {
                    newPhase = massnahme.idMassnahme.substr(5);
                }
            });
            if(funcs.isDefined(newPhase)) {
                waitForAnswer.resolve({
                    yyyy_mm_dd: yyyy_mm_dd,
                    newPhase: newPhase
                });
            }
            else {
                waitForAnswer.resolve();
            }
        });

        return waitForAnswer.promise;
    }

    function getMassnahmen(statistic) {
        var waitForAnswer = $q.defer();
        var history = transformStatisticToHistory(statistic);

        if(funcs.isDefined(com_eosItServices_fx.ENV.mockMode)) {
            $http.get(URL).success(function(data) {
                data.forEach(function(massnahme) {
                    massnahme.erlaubt = (Math.random() < 0.5);
                    if(massnahme.erlaubt) {
                        massnahme.ausgewaehlt = (Math.random() < 0.2);
                        massnahme.terminErreicht = (Math.random() < 0.2);
                    }
                    else {
                        massnahme.ausgewaehlt = false;
                        massnahme.terminErreicht = false;
                    }
                });
                waitForAnswer.resolve(data);
            });
        }
        else {
            $http.post(URL, history).success(function(data) {
                waitForAnswer.resolve(data);
            });
        }

        return waitForAnswer.promise;
    }

    eventsUndMassnahmen.ready.then(function() {
        deferred.resolve();
    });

    return {
        getMassnahmen: getMassnahmen,
        getPhaseChange: getPhaseChange,
        ready: ready
    }
});