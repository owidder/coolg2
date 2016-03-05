'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).factory("fileUtil", function() {

    function createRowParser(delim) {
        return (function parseRow(line) {
            var lineStr = "";
            if (line.length == 1) {
                lineStr = line[0];
            }
            else if (line.length > 1) {
                lineStr = line.join("");
            }
            return lineStr.split(delim);
        })
    }

    return {
        createRowParser: createRowParser
    }
});