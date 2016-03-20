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
    var currentShownStocks = [];
    var stockSwitches = {};
    var stockPromises = [];
    var stockList;

    function initStocks() {
        var stock, index = 0;
        stockPromises.length = 0;
        currentShownStocks.length = 0;
        stockList.forEach(function(entry) {
            if(stockSwitches[entry.symbol]) {
                stock = stockMap[entry.symbol];
                if(!funcs.isDefined(stock)) {
                    stock = new Stock(entry.symbol, entry.name);
                    stockMap[entry.symbol] = stock;
                    stockPromises.push(stock.ready);
                }
                currentShownStocks.push(stock);
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
    var stocksChangedFlag = true;

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
                            var periodA = stockA.period(fromYYYY_MM_DD, toYYYY_MM_DD, constants.STOCK_PROPERTY_NAME);
                            var periodB = stockB.period(fromYYYY_MM_DD, toYYYY_MM_DD, constants.STOCK_PROPERTY_NAME);
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

    var stocksChangedEvent = new SimpleEvent();
    $scope.stocksChangedEvent = stocksChangedEvent;

    var periodLengthSliderChangeEvent = new SimpleEvent();
    periodLengthSliderChangeEvent.on(periodLengthSliderChanged);
    $scope.periodLengthSliderChangeEvent = periodLengthSliderChangeEvent;

    var clickOnChordEvent = new SimpleEvent();
    clickOnChordEvent.on(showScatterPlot);
    $scope.clickOnChordEvent = clickOnChordEvent;

    $scope.dateSliderMax = dateUtil.daysBetweenDates(constants.START_DATE, constants.END_DATE);

    function draw() {
        $timeout(function() {
            $scope.current_period_end = dateUtil.addDaysToDate($scope.current_period_start, periodLengthInDays);
            computePeriod($scope.current_period_start, $scope.current_period_end);
            if(stocksChangedFlag) {
                stocksChangedEvent.startWhenFirstListenerReady();
                stocksChangedFlag = false;
            }
            else {
                redrawEvent.startWhenFirstListenerReady();
            }
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
        Promise.all(stockPromises).then(function() {
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

    function initAfterStockChange() {
        initStocks();
        drawWhenInitialized();
    }

    function switchStockOnOff(symbol) {
        stockSwitches[symbol] = !stockSwitches[symbol];
        stocksChangedFlag = true;
        initAfterStockChange();
    }

    function init() {
        $.get("rsrc/stocks.csv", function(data) {
            stockList = d3.csv.parse(data);
            stockList.sort(funcs.createComparator("symbol"));
            initStockSwitches();

            $scope.stockList = stockList;
            $scope.current_period_start = constants.START_DATE;

            initAfterStockChange();
        });
    }

    /************ scatter plot ***********************/

    var scatterPlotRedrawEvent = new SimpleEvent();
    var scatterPlotResetEvent = new SimpleEvent();
    var scatterPlotAllValues = [];
    var scatterPlotPeriodValues = [];
    var scatterPlotNames = [];
    $scope.scatterPlotRedrawEvent = scatterPlotRedrawEvent;
    $scope.scatterPlotResetEvent = scatterPlotResetEvent;
    $scope.scatterPlotAllValues = scatterPlotAllValues;
    $scope.scatterPlotPeriodValues = scatterPlotPeriodValues;
    $scope.scatterPlotNames = scatterPlotNames;

    function showScatterPlot(symbol1, symbol2) {
        var stock1 = stockMap[symbol1];
        var stock2 = stockMap[symbol2];

        var allValues1 = stock1.period(constants.START_DATE, constants.END_DATE, constants.STOCK_PROPERTY_NAME);
        var allValues2 = stock2.period(constants.START_DATE, constants.END_DATE, constants.STOCK_PROPERTY_NAME);

        var periodValues1 = stock1.period($scope.current_period_start, $scope.current_period_end, constants.STOCK_PROPERTY_NAME);
        var periodValues2 = stock2.period($scope.current_period_start, $scope.current_period_end, constants.STOCK_PROPERTY_NAME);

        scatterPlotNames.length = 0;
        Array.prototype.push.apply(scatterPlotNames, [stock1.name, stock2.name]);

        funcs.combineArrays([allValues1, allValues2], scatterPlotAllValues);
        funcs.combineArrays([periodValues1, periodValues2, periodValues1.dates, periodValues2.dates], scatterPlotPeriodValues);

        scatterPlotResetEvent.startWhenFirstListenerReady();
    }

    $scope.switchStockOnOff = switchStockOnOff;
    $scope.stockSwitches = stockSwitches;
    $scope.currentShownStocks = currentShownStocks;

    init();

});