'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).factory("dateUtil", function(funcs) {

    /**
     *
     * @param yyyy_mm_dd YYYY-MM-DD, e.g "2016-11-23"
     * @returns {string} Name of month, e.g. "Nobvember"
     */
    function getMonthNameFromYYYY_MM_DD(yyyy_mm_dd) {
        var parts = yyyy_mm_dd.split("-");
        var monthNum = parts[1]-1;
        var monthNames = [
            "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"
        ];
        return monthNames[monthNum];
    }

    /**
     * from: http://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-javascript
     * thanks to Michael Liu: http://stackoverflow.com/users/1127114/michael-liu
     * @param startDate
     * @param endDate
     * @returns {number} or undefined
     */
    function daysBetweenDates(startDate, endDate) {
        function treatAsUTC(date) {
            var result = new Date(date);
            result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
            return result;
        }

        var ret;
        if(!funcs.isEmpty(startDate) && !funcs.isEmpty(endDate)) {
            var millisecondsPerDay = 24 * 60 * 60 * 1000;
            var almostTrue = (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
            var reallyReallyTrueBelieveMe = Math.round(almostTrue);

            ret = reallyReallyTrueBelieveMe;
        }

        return ret;
    }

    /**
     *
     * @param yyyy_mm_dd YYYY-MM-DD, e.g "2016-11-23"
     * @returns {Date}
     */
    function getDateFromYYYY_MM_DD(yyyy_mm_dd) {
        var parts = yyyy_mm_dd.split("-");
        var date = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));

        return date;
    }

    function isFirstSundayOfMonth(date) {
        var dayOfWeek = date.getDay();
        var dayOfMonth = date.getDate();
        return (dayOfWeek == 0 && dayOfMonth < 8);
    }

    function isWeekend(date) {
        var dayOfWeek = date.getDay();
        return (dayOfWeek == 0 || dayOfWeek == 6);
    }

    /**
     * "2016-01-03 10:12:77" -> "2016-01-03"
     * @param yyyy_mm_dd_hh_mm_ss
     */
    function datumFromZeitpunkt(yyyy_mm_dd_hh_mm_ss) {
        return yyyy_mm_dd_hh_mm_ss.split(" ")[0];
    }

    function getYYYY_MM_DDfromDate(date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var yyyy_mm_dd = sprintf("%d-%02d-%02d", year, month, day);

        return yyyy_mm_dd;
    }

    function incByOneDay(yyyy_mm_dd) {
        var date = getDateFromYYYY_MM_DD(yyyy_mm_dd);
        date.setDate(date.getDate() + 1);
        return getYYYY_MM_DDfromDate(date);
    }

    function incByOneMonth(yyyy_mm_dd) {
        var date = getDateFromYYYY_MM_DD(yyyy_mm_dd);
        date.setMonth(date.getMonth() + 1);
        return getYYYY_MM_DDfromDate(date);
    }

    /**
     * Find the last entry in the given array with entry.yyyy_mm_dd <= yyyy_mm_dd
     *
     * @param arrayWithDateProperty each entry must have a date property
     * @param yyyy_mm_dd
     * @param accessor date property name or accessor for the date property (if undefined: 'yyyy:mm_dd')
     */
    function findNearestBelow(arrayWithDateProperty, yyyy_mm_dd, accessor) {
        var nearestBelow;
        var accessorFunction = createDateAccessorFunction(accessor);
        if(funcs.isDefined(arrayWithDateProperty)) {
            arrayWithDateProperty.forEach(function(entry) {
                var entryYYYY_MM_DD = accessorFunction(entry);
                if (entryYYYY_MM_DD <= yyyy_mm_dd) {
                    nearestBelow = entry;
                }
            });
        }

        return nearestBelow;
    }

    /**
     *
     * @param arrayWithDateProperty each entry must have a date property
     * @param yyyy_mm_dd
     * @param accessor date property name or accessor for the date property
     * @return true if yyyy_mm_dd > entry.yyyy_mm_dd for the last entry in the array (or array is nmot defined or empty)
     */
    function isYoungerThanTheLast(arrayWithDateProperty, yyyy_mm_dd, accessor) {
        var itIs = true;
        var accessorFunction = createDateAccessorFunction(accessor);
        if(funcs.isDefined(arrayWithDateProperty) && arrayWithDateProperty.length > 0) {
            var lastEntry = arrayWithDateProperty[arrayWithDateProperty.length - 1];
            var lastYYYY_MM_DD = accessorFunction(lastEntry);
            if(yyyy_mm_dd <= lastYYYY_MM_DD) {
                itIs = false;
            }
        }

        return itIs;
    }

    function createDateAccessorFunction(accessor) {
        if(!funcs.isDefined(accessor)) {
            accessor = "yyyy_mm_dd";
        }

        return funcs.createAccessorFunction(accessor);
    }

    function createYYYY_MM_DDcomparator(accessor) {
        var accessorFunction = createDateAccessorFunction(accessor);
        return function(a,b) {
            var datumA = accessorFunction(a);
            var datumB = accessorFunction(b);
            if(datumA < datumB) {
                return -1;
            }
            else if (datumA == datumB) {
                return 0;
            }
            return 1;
        }
    }

    return {
        getMonthNameFromYYYY_MM_DD: getMonthNameFromYYYY_MM_DD,
        getDateFromYYYY_MM_DD: getDateFromYYYY_MM_DD,
        isFirstSundayOfMonth: isFirstSundayOfMonth,
        isWeekend: isWeekend,
        daysBetweenDates: daysBetweenDates,
        datumFromZeitpunkt: datumFromZeitpunkt,
        incByOneDay: incByOneDay,
        incByOneMonth: incByOneMonth,
        isYoungerThanTheLast: isYoungerThanTheLast,
        findNearestBelow: findNearestBelow,
        createYYYY_MM_DDcomparator: createYYYY_MM_DDcomparator
    }
});