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
    var stockNames = [];
    var fullStockNames = [];

    var initializedPromise = new SimplePromise();

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

    var correlationsMatrix = [];
    var posNegMatrix = [];
    var ready = new SimplePromise();
    var redrawEvent = new SimpleEvent();
    var periodLengthInDays = 365;

    initStocks();

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

    function init() {
        $.get("rsrc/stocks.csv", function(data) {
            var stockList = d3.csv.parse(data);
            stockList.sort(funcs.createComparator("symbol"));
            stockList.forEach(function(entry) {
                stockNames.push(entry.symbol);
                fullStockNames.push(entry.name);
            });
            math.zero2DimArray(stockNames.length, stockNames.length, correlationsMatrix);
            math.zero2DimArray(stockNames.length, stockNames.length, posNegMatrix);

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