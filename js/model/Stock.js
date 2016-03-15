'use strict';

bottle.factory("Stock", function(container) {
    var SimplePromise = container.SimplePromise;
    var dateUtil = container.dateUtil;

    function Stock(symbol) {
        var that = this;
        var simplePromise = new SimplePromise();

        var history;

        var lastStart_yyyy_mm_dd, lastEnd_yyyy_mm_dd, lastPropertyName, lastPeriod = [];

        /**
         *
         * @param start_yyyy_mm_dd start date (incl.)
         * @param end_yyyy_mm_dd end date (excl.)
         * @returns {*}
         */
        function period(start_yyyy_mm_dd, end_yyyy_mm_dd, propertyName) {
            if(lastStart_yyyy_mm_dd == start_yyyy_mm_dd && lastEnd_yyyy_mm_dd == end_yyyy_mm_dd && propertyName == lastPropertyName) {
                return lastPeriod;
            }
            else {
                lastStart_yyyy_mm_dd = start_yyyy_mm_dd;
                lastEnd_yyyy_mm_dd = end_yyyy_mm_dd;
                var timeslice = history.filter(function(element) {
                    return (element.Date >= start_yyyy_mm_dd && element.Date < end_yyyy_mm_dd);
                });
                lastPeriod.length = 0;
                if(history[0].Date <= start_yyyy_mm_dd && history[history.length-1].Date >= end_yyyy_mm_dd) {
                    timeslice.forEach(function(day) {
                        lastPeriod.push(Number(day[propertyName]));
                    });
                }

                return lastPeriod;
            }
        }

        $.get("rsrc/" + symbol + ".csv", function(data) {
            history = d3.csv.parse(data);
            history.sort(dateUtil.createYYYY_MM_DDcomparator("Date"));
            simplePromise.resolve();
        });

        that.symbol = symbol;
        that.ready = simplePromise.promise;
        that.period = period;
    }

    return Stock;
});