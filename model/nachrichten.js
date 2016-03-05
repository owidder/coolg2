'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("$nachrichten", function(fileUtil, $q) {

    var nachrichten = {};
    var nachrichtDeferred = $q.defer();

    function fillNachrichten(csv) {
        csv.forEach(function (row) {
            var bezeichnung = row[0];
            var bemerkung = row[1]
            nachrichten[bezeichnung] = bemerkung;
        });
    }

    d3.text("rsrc/nachricht.csv", function (text) {
        var csv = d3.csv.parseRows(text, fileUtil.createRowParser("\t"));
        fillNachrichten(csv);
        nachrichtDeferred.resolve();
    });

    var ready = nachrichtDeferred.promise;

    function getNachrichten() {
        return nachrichten;
    }

    return {
        getNachrichten: getNachrichten,
        ready: ready
    }
});