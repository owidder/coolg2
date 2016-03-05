'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("Auftrag", function($q, fileUtil, constants) {

    function Auftrag(suffix) {
        var deferred = $q.defer();

        var auftragMap = {};
        var auftragArray = [];

        function fillAuftraege(csv) {
            csv.forEach(function(row) {
                var auftrag = {
                    auftrId: row[0],
                    auftrName: row[1],
                    mdName: row[2],
                    vpCount: sprintf("%07d", row[3])
                };
                auftragMap[auftrag.auftrId] = auftrag;
                auftragArray.push(auftrag);
            });
        }

        d3.text(constants.RESOURCE_DIR + "/auftrMd" + suffix + ".txt", function (text) {
            var csv = d3.csv.parseRows(text, fileUtil.createRowParser("\t"));
            fillAuftraege(csv);
            deferred.resolve();
        });

        function ready() {
            return deferred.promise;
        }

        this.auftragMap = auftragMap;
        this.auftragArray = auftragArray;
        this.ready = ready;
    }

    return Auftrag;
});