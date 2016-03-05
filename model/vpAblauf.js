'use strict';

angular.module(com_eosItServices_fx.moduleName).factory("$vpAblauf", function(constants, $q, dateUtil, sha256, funcs, $nachrichten) {

    function VpAblauf(vp, suffix) {
        var that = this;

        var ABL_ART_HA = "0";

        var AKT_TYPEN = {
            "1": "Buchung",
            "2": "Nachricht",
            "3": "Wiedervorlage",
            "4": "Individuelle",
            "5": "AD-Auftrag",
            "99": "Sonstige"
        };

        var deferred = $q.defer();
        var ready = deferred.promise;

        var entries;
        function getEntries() {
            return entries;
        }

        var taArray = [];
        function getTaArray() {
            return taArray;
        }

        function getEntryAtDate(yyyy_mm_dd){
            var foundEntry;
            for(var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var date = entry.datum;
                if(date == yyyy_mm_dd) {
                    foundEntry = entry;
                    break;
                }
            }

            return foundEntry;
        }

        function isSomethingAtDate(yyyy_mm_dd) {
            var entry = getEntryAtDate(yyyy_mm_dd);
            return funcs.isDefined(entry);
        }

        function getMzNameAtDate(yyyy_mm_dd) {
            var mzName = "";
            var entry = getEntryAtDate(yyyy_mm_dd);
            if(funcs.isDefined(entry)) {
                mzName = entry.MzName;
            }

            return mzName;
        }

        function getAktTypBezeichnung(aktTyp) {
            var aktTypBez = AKT_TYPEN[aktTyp];
            if(!funcs.isDefined(aktTypBez)) {
                aktTypBez = "???";
            }

            return aktTypBez;
        }

        /**
         * fill 'taArray' and add a start index of the TA (taStartIndex) to 'entries'
         */
        function initTaArrayAndEntries(csv) {
            function fillFullBez(entry) {
                entry.fullBez = "";
                if(!funcs.isEmpty(entry.AktTyp)) {
                    var fullBez = getAktTypBezeichnung(entry.AktTyp);
                    if(!funcs.isEmpty(fullBez)) {
                        fullBez += ": ";
                    }
                    var nachricht = $nachrichten.getNachrichten()[entry.AktBez];
                    if (funcs.isDefined(nachricht)) {
                        entry.fullBez = fullBez + nachricht + " (" + entry.AktBez + ")";
                    }
                    else {
                        entry.fullBez = fullBez + entry.AktBez;
                    }
                }
            }

            var currentTaId;
            var currentTaStartIndex;
            entries = csv;
            entries.forEach(function(entry, index) {
                if(currentTaId != entry.AblID) {
                    currentTaId = entry.AblID;
                    var taEntry = {
                        yyyy_mm_dd: dateUtil.datumFromZeitpunkt(entry.Zeitpunkt),
                        startIndex: index,
                        name: (entry.AblArt == ABL_ART_HA ? "HA" : entry.AblBez),
                        id: entry.AblID
                    };
                    taArray.push(taEntry);
                    currentTaStartIndex = index;
                }
                entry.taStartIndex = currentTaStartIndex;
                entry.datum = dateUtil.datumFromZeitpunkt(entry.Zeitpunkt);
                fillFullBez(entry);
            });
        }

        function getAllTas() {
            var allTas = {};
            taArray.forEach(function(ta) {
                allTas[ta.id] = ta;
            });

            return allTas;
        }

        function getLastYYYY_MM_DDFromEntries() {
            var lastEntry = entries[entries.length-1];
            return lastEntry.datum;
        }

        function getTaEntry(yyyy_mm_dd) {
            var taEntry, lastTaEntry;

            if(!funcs.isEmpty(taArray)) {
                lastTaEntry = taArray[taArray.length - 1];
                if(yyyy_mm_dd > lastTaEntry.yyyy_mm_dd) {
                    if( yyyy_mm_dd <= getLastYYYY_MM_DDFromEntries()) {
                        taEntry = lastTaEntry;
                    }
                }
                else {
                    taEntry = dateUtil.findNearestBelow(taArray, yyyy_mm_dd);
                }
            }

            return taEntry;
        }

        var dsv = d3.dsv("|", "text/plain");
        var subFolder = vp.substr(0, 3);
        dsv(constants.RESOURCE_DIR + "/vpAblaeufe" + suffix + "/" + subFolder + "/abl" + vp + ".txt", function(csv) {
            initTaArrayAndEntries(csv);
            deferred.resolve();
        });

        that.getEntries = getEntries;
        that.ready = ready;
        that.getTaEntry = getTaEntry;
        that.getAllTas = getAllTas;
        that.isSomethingAtDate = isSomethingAtDate;
        that.getMzNameAtDate = getMzNameAtDate;
    }

    function colorForAblaufName(name) {
        if(name.toLowerCase().indexOf("agmv") > -1) {
            return "#FFFF00";
        }
        var sha256Hash = sha256.hash(name);
        var color = "#" + sha256Hash.substr(20, 6);

        return color;
    }

    return {
        VpAblauf: VpAblauf,
        colorForAblaufName: colorForAblaufName
    }
});