'use strict';

com_geekAndPoke_coolg.STOCK_CONTROLLER = "stockController";

angular.module(com_geekAndPoke_coolg.moduleName).controller(com_geekAndPoke_coolg.STOCK_CONTROLLER, function($scope, $timeout) {

    var Stock = bottle.container.Stock;
    var SimplePromise = bottle.container.SimplePromise;
    var SimpleEvent = bottle.container.SimpleEvent;
    var dateUtil = bottle.container.dateUtil;
    var constants = bottle.container.constants;

    var stockNames = ["aapl", "dai-de", "ge", "nyt", "fb", "goog", "xom"];
    var fullStockNames = ["Apple", "Daimler (DE)", "General Electric", "New York Times", "Facebook", "Google", "Exxon Mobile"];

    var stocks = [];
    var stockPromises = [];

    function initStocks() {
        stockNames.forEach(function(stockName) {
            var stock = new Stock(stockName);
            stocks.push(stock);
            stockPromises.push(stock.ready);
        });
    }

    function indexFromStockName(name) {
        return stockNames.indexOf(name);
    }

    var correlationsMatrix = math.zero2DimArray(stockNames.length);
    var posNegMatrix = math.zero2DimArray(stockNames.length);
    var ready = new SimplePromise();
    var redrawEvent = new SimpleEvent();

    initStocks();

    $scope.pauseFlag = false;

    function pause() {
        $scope.pauseFlag = true;
    }

    function play() {
        $scope.pauseFlag = false;
    }

    $scope.correlationsMatrix = correlationsMatrix;
    $scope.posNegMatrix = posNegMatrix;
    $scope.stockNames = stockNames;
    $scope.fullStockNames = fullStockNames;

    $scope.redrawEvent = redrawEvent;
    $scope.ready = ready.promise;

    $scope.pause = pause;
    $scope.play = play;

    function computePeriod(fromYYYY_MM_DD, toYYYY_MM_DD) {
        stocks.forEach(function(stockA) {
            var periodA = stockA.period(fromYYYY_MM_DD, toYYYY_MM_DD, "Close");
            stocks.forEach(function(stockB) {
                var correlation = 0;
                var indexA = indexFromStockName(stockA.name);
                var indexB = indexFromStockName(stockB.name);
                if(stockA.name != stockB.name) {
                    var periodB = stockB.period(fromYYYY_MM_DD, toYYYY_MM_DD, "Close");
                    correlation = math.correlation(periodA, periodB);
                }
                correlationsMatrix[indexA][indexB] = Math.abs(correlation * 1000);
                posNegMatrix[indexA][indexB] = Math.sign(correlation);
            });
        });
    }

    var dateSliderChangedEvent = new SimpleEvent();
    dateSliderChangedEvent.on(dateSliderChanged);
    $scope.dateSliderChangedEvent = dateSliderChangedEvent;

    var dateChangedEvent = new SimpleEvent();
    $scope.dateChangedEvent = dateChangedEvent;

    $scope.dateSliderMax = dateUtil.daysBetweenDates(constants.START_DATE, constants.END_DATE);

    function drawMonth(yyyy_mm_dd) {
        var yyyy_mm_dd_plus1m = dateUtil.incByOneYear(yyyy_mm_dd);
        computePeriod(yyyy_mm_dd, yyyy_mm_dd_plus1m);
        redrawEvent.startWhenListenersReady();

        return dateUtil.incByOneDay(yyyy_mm_dd);
    }

    $scope.currentYYYY_MM_DD = constants.START_DATE;
    function step() {
        if(!$scope.pauseFlag) {
            var oldCurrentYYYY_MM_DD = $scope.currentYYYY_MM_DD;
            $scope.currentYYYY_MM_DD = drawMonth($scope.currentYYYY_MM_DD);
            var days = dateUtil.daysBetweenDates(oldCurrentYYYY_MM_DD, $scope.currentYYYY_MM_DD);
            dateChangedEvent.startWhenListenersReady(days);
        }
        if($scope.currentYYYY_MM_DD > constants.END_DATE) {
            $scope.currentYYYY_MM_DD = constants.START_DATE;
        }
        $timeout(step, 50);
    }

    Promise.all(stockPromises).then(function() {
        step();
    });

    function dateSliderChanged(value) {
        console.log(value);
    }

});