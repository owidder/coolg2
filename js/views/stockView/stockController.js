'use strict';

com_geekAndPoke_coolg.STOCK_CONTROLLER = "stockController";

angular.module(com_geekAndPoke_coolg.moduleName).controller(com_geekAndPoke_coolg.STOCK_CONTROLLER, function($scope, $timeout, $interval) {

    var Stock = bottle.container.Stock;
    var SimplePromise = bottle.container.SimplePromise;
    var SimpleEvent = bottle.container.SimpleEvent;
    var dateUtil = bottle.container.dateUtil;
    var constants = bottle.container.constants;
    var funcs = bottle.container.funcs;

    var stockMap = {};
    var stockSwitches = {};
    var stockPromises = [];
    var stockList;

    var initializedPromise = new SimplePromise();

    function initStocks() {
        var stock, index = 0;
        stockPromises.length = 0;
        stockList.forEach(function(entry) {
            if(stockSwitches[entry.symbol]) {
                stock = stockMap[entry.symbol];
                if(!funcs.isDefined(stock)) {
                    stock = new Stock(entry.symbol);
                    stockMap[entry.symbol] = stock;
                    stockPromises.push(stock.ready);
                }
                stock.index = index++;
            }
        });
        math.zero2DimArray(index, index, correlationsMatrix);
        math.zero2DimArray(index, index, posNegMatrix);
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
        funcs.forEachKeyAndVal(stockMap, function(symbolA, stockA) {
            if(stockSwitches[symbolA]) {
                funcs.forEachKeyAndVal(stockMap, function(symbolB, stockB) {
                    if(stockSwitches[symbolB]) {
                        var correlation = 0;
                        var indexA = stockA.index;
                        var indexB = stockB.index;
                        if(stockA.symbol != stockB.symbol) {
                            var periodA = stockA.period(fromYYYY_MM_DD, toYYYY_MM_DD, "Close");
                            var periodB = stockB.period(fromYYYY_MM_DD, toYYYY_MM_DD, "Close");
                            correlation = math.correlation(periodA, periodB);
                        }
                        correlationsMatrix[indexA][indexB] = Math.abs(correlation * 1000);
                        posNegMatrix[indexA][indexB] = Math.sign(correlation);
                    }
                });
            }
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
            redrawEvent.startWhenFirstListenerReady();
        });
    }

    $scope.current_period_start = constants.START_DATE;
    function step() {
        if(!$scope.pauseFlag) {
            draw();
            $scope.current_period_start = dateUtil.incByOneDay($scope.current_period_start);
            var numberOfDaysSinceStart = dateUtil.daysBetweenDates(constants.START_DATE, $scope.current_period_start);
            dateChangedEvent.startWhenFirstListenerReady(numberOfDaysSinceStart);
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

    function initStockSwitches() {
        stockList.forEach(function(entry) {
            stockSwitches[entry.symbol] = (entry.onByDefault == 1);
        });
    }

    function switchStockOnOff(symbol) {
        stockSwitches[symbol] = !stockSwitches[symbol];
    }

    function init() {
        $.get("rsrc/stocks.csv", function(data) {
            stockList = d3.csv.parse(data);
            stockList.sort(funcs.createComparator("symbol"));
            initStockSwitches();

            $scope.stockList = stockList;
            $scope.current_period_start = constants.START_DATE;
            
            initStocks();
            Promise.all(stockPromises).then(function() {
                initializedPromise.resolve();
            });
            drawWhenInitialized();
        });
    }

    $scope.switchStockOnOff = switchStockOnOff;
    $scope.stockSwitches = stockSwitches;

    init();

});