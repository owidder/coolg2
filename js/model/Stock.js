'use strict';

bottle.factory("Stock", function(container) {
    var SimplePromise = container.SimplePromise;
    var dateUtil = container.dateUtil;

    function Stock(symbol, name) {
        var that = this;
        var simplePromise = new SimplePromise();

        var history;

        var lastStart_yyyy_mm_dd, lastEnd_yyyy_mm_dd, lastPropertyName;
        var lastPeriod = [];
        lastPeriod.dates = [];

        /**
         *
         * @param start_yyyy_mm_dd start date (incl.)
         * @param end_yyyy_mm_dd end date (excl.)
         * @returns {*}
         */
        function period(start_yyyy_mm_dd, end_yyyy_mm_dd, propertyName) {
            var period = [];
            period.dates = [];
            var timeslice = history.filter(function(element) {
                return (element.Date >= start_yyyy_mm_dd && element.Date < end_yyyy_mm_dd);
            });
            if(history[0].Date <= start_yyyy_mm_dd && history[history.length-1].Date >= end_yyyy_mm_dd) {
                timeslice.forEach(function(day) {
                    period.push(Number(day[propertyName]));
                    period.dates.push(day.Date);
                });
            }

            return period;
        }

        $.get("rsrc/" + symbol + ".csv", function(data) {
            history = d3.csv.parse(data);
            history.sort(dateUtil.createYYYY_MM_DDcomparator("Date"));
            simplePromise.resolve();
        });

        that.symbol = symbol;
        that.name = name;
        that.ready = simplePromise.promise;
        that.period = period;
    }

    return Stock;
});