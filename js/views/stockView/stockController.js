'use strict';

com_geekAndPoke_coolg.STOCK_CONTROLLER = "stockController";

angular.module(com_geekAndPoke_coolg.moduleName).controller(com_geekAndPoke_coolg.STOCK_CONTROLLER, function($scope, $timeout, $interval) {

    var Stock = bottle.container.Stock;
    var SimplePromise = bottle.container.SimplePromise;
    var SimpleEvent = bottle.container.SimpleEvent;
    var dateUtil = bottle.container.dateUtil;
    var constants = bottle.container.constants;
    var funcs = bottle.container.funcs;

    var stocks = [];
    var stockPromises = [];
    var stockList;

    var initializedPromise = new SimplePromise();

    function initStocks() {
        stockList.forEach(function(entry) {
            var stock = new Stock(entry.symbol);
            stocks.push(stock);
            stockPromises.push(stock.ready);
        });
    }

    function indexFromStockSymbol(symbol) {
        var i, index, entry;
        for(i = 0; i < stockList.length; i++) {
            entry = stockList[i];
            if(entry.symbol == symbol) {
                index = i;
            }
        }

        return index;
    }

    var correlationsMatrix = [];
    var posNegMatrix = [];
    var ready = new SimplePromise();
    var redrawEvent = new SimpleEvent();
    var periodLengthInDays = 365;

    $scope.pauseFlag = true;

    function pause() {
        $scope.pauseFlag = true;
    }

    function play() {
        $scope.pauseFlag = false;
        step();
    }

    $scope.correlationsMatrix = correlationsMatrix;
    $scope.posNegMatrix = posNegMatrix;

    $scope.redrawEvent = redrawEvent;
    $scope.ready = ready.promise;

    $scope.pause = pause;
    $scope.play = play;

    function computePeriod(fromYYYY_MM_DD, toYYYY_MM_DD) {
        stocks.forEach(function(stockA) {
            var periodA = stockA.period(fromYYYY_MM_DD, toYYYY_MM_DD, "Close");
            stocks.forEach(function(stockB) {
                var correlation = 0;
                var indexA = indexFromStockSymbol(stockA.symbol);
                var indexB = indexFromStockSymbol(stockB.symbol);
                if(stockA.symbol != stockB.symbol) {
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

    var periodLengthSliderChangeEvent = new SimpleEvent();
    periodLengthSliderChangeEvent.on(periodLengthSliderChanged);
    $scope.periodLengthSliderChangeEvent = periodLengthSliderChangeEvent;

    $scope.dateSliderMax = dateUtil.daysBetweenDates(constants.START_DATE, constants.END_DATE);

    function draw() {
        $timeout(function() {
            $scope.current_period_end = dateUtil.addDaysToDate($scope.current_period_start, periodLengthInDays);
            computePeriod($scope.current_period_start, $scope.current_period_end);
            redrawEvent.startWhenListenersReady();
        });
    }

    $scope.current_period_start = constants.START_DATE;
    function step() {
        if(!$scope.pauseFlag) {
            draw();
            $scope.current_period_start = dateUtil.incByOneDay($scope.current_period_start);
            var numberOfDaysSinceStart = dateUtil.daysBetweenDates(constants.START_DATE, $scope.current_period_start);
            dateChangedEvent.startWhenListenersReady(numberOfDaysSinceStart);
            if($scope.current_period_start > constants.END_DATE) {
                $scope.current_period_start = constants.START_DATE;
            }
            $timeout(step, 50);
        }
    }

    function drawWhenInitialized() {
        initializedPromise.promise.then(function() {
            draw();
        });
    }

    function dateSliderChanged(value) {
        $scope.current_period_start = dateUtil.addDaysToDate(constants.START_DATE, value);
        drawWhenInitialized();
    }

    function periodLengthSliderChanged(value) {
        periodLengthInDays = value;
        drawWhenInitialized();
    }

    function switchStockOnOff(symbol) {
        $("div.stock-onoff-" + symbol).toggleClass("stock-on");
        $("div.stock-onoff-" + symbol).toggleClass("stock-off");
    }
    $scope.switchStockOnOff = switchStockOnOff;

    function init() {
        $.get("rsrc/stocks.csv", function(data) {
            stockList = d3.csv.parse(data);
            stockList.sort(funcs.createComparator("symbol"));
            $scope.stockList = stockList;

            math.zero2DimArray(stockList.length, stockList.length, correlationsMatrix);
            math.zero2DimArray(stockList.length, stockList.length, posNegMatrix);

            $scope.current_period_start = constants.START_DATE;
            initStocks();
            Promise.all(stockPromises).then(function() {
                initializedPromise.resolve();
            });
            drawWhenInitialized();
        });
    }

    init();

});