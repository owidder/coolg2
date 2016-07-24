'use strict';

com_geekAndPoke_coolg.STOCK_CONTROLLER = "stockController";

angular.module(com_geekAndPoke_coolg.moduleName).controller(com_geekAndPoke_coolg.STOCK_CONTROLLER, function(
    $scope, $timeout, $interval, $routeParams) {

    var Stock = bottle.container.Stock;
    var SimplePromise = bottle.container.SimplePromise;
    var SimpleEvent = bottle.container.SimpleEvent;
    var dateUtil = bottle.container.dateUtil;
    var constants = bottle.container.constants;
    var funcs = bottle.container.funcs;
    var dimensions = bottle.container.dimensions;
    var mathUtil = bottle.container.mathUtil;
    var SvgLegend = bottle.container.SvgLegend;

    var stockMap = {};
    var currentShownStocks = [];
    var stockSwitches = {};
    var stockPromises = [];
    var stockList;

    var initPhaseStartedPromise = new SimplePromise();
    var initPhaseEndedPromise = new SimplePromise();

    var ROUTE_PARAMS_DEMO = "demo";
    var demoMode = funcs.isDefined($routeParams[ROUTE_PARAMS_DEMO]);

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
    var periodLengthInDays = 30;
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

    var symbolsSelectedEvent = new SimpleEvent();
    var symbolsDeselectedEvent = new SimpleEvent();
    $scope.symbolsSelectedEvent = symbolsSelectedEvent;
    $scope.symbolsDeselectedEvent = symbolsDeselectedEvent;

    whenInitialized(function() {
        symbolsSelectedEvent.on(function(symbolA, symbolB) {
            draw();
            showScatterPlot(symbolA, symbolB);
        });

        symbolsDeselectedEvent.on(function() {
            draw();
            hideScatterPlot();
        });
    });

    $scope.dateSliderMax = dateUtil.daysBetweenDates(constants.START_DATE, constants.END_DATE);

    function setPeriodEnd() {
        $scope.current_period_end = dateUtil.addDaysToDate($scope.current_period_start, periodLengthInDays);
    }

    function draw() {
        $timeout(function() {
            setPeriodEnd();
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

    function step() {
        if(!$scope.pauseFlag) {
            draw();
            setPeriodEnd();
            updateScatterPlot();
            $scope.current_period_start = dateUtil.incByOneDay($scope.current_period_start);
            var numberOfDaysSinceStart = dateUtil.daysBetweenDates(constants.START_DATE, $scope.current_period_start);
            dateChangedEvent.startWhenFirstListenerReady(numberOfDaysSinceStart);
            if($scope.current_period_start > constants.END_DATE) {
                $scope.current_period_start = constants.START_DATE;
            }
            $timeout(step, 50);
        }
    }

    function whenInitialized(fkt) {
        initPhaseEndedPromise.promise.then(fkt);
    }

    function drawWhenInitialized() {
        whenInitialized(draw);
    }

    function dateSliderChanged(value) {
        $scope.current_period_start = dateUtil.addDaysToDate(constants.START_DATE, value);
        setPeriodEnd();
        drawWhenInitialized();
        updateScatterPlot();
    }

    function periodLengthSliderChanged(value) {
        periodLengthInDays = value;
        setPeriodEnd();
        drawWhenInitialized();
        updateScatterPlot();
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
        var stocksFile = demoMode ? "stocks_demo.csv" : "stocks.csv";
        $.get("rsrc/" + stocksFile, function(data) {
            stockList = d3.csv.parse(data);
            stockList.sort(funcs.createComparator("symbol"));
            initStockSwitches();

            $scope.stockList = stockList;
            $scope.current_period_start = constants.START_DATE;

            initAfterStockChange();

            initPhaseStartedPromise.resolve();
            Promise.all(stockPromises).then(function() {
                initPhaseEndedPromise.resolve();
            });
        });
    }

    /************ scatter plot ***********************/

    var scatterPlotRedrawEvent = new SimpleEvent();
    var scatterPlotResetEvent = new SimpleEvent();
    var scatterPlotRemoveEvent = new SimpleEvent();

    var scatterPlotAllValues = [];
    var scatterPlotPeriodValues = [];
    var scatterPlotNames = [];
    var scatterPlotShownFlag = false;
    var currentShownSymbol1;
    var currentShownSymbol2;

    function updatePeriodValues() {
        var stock1 = stockMap[currentShownSymbol1];
        var stock2 = stockMap[currentShownSymbol2];

        var periodValues1 = stock1.period($scope.current_period_start, $scope.current_period_end, constants.STOCK_PROPERTY_NAME);
        var periodValues2 = stock2.period($scope.current_period_start, $scope.current_period_end, constants.STOCK_PROPERTY_NAME);
        funcs.combineArrays([periodValues1, periodValues2, periodValues1.dates, periodValues2.dates], scatterPlotPeriodValues);

        computePeriod($scope.current_period_start, $scope.current_period_end);
    }

    function currentCorrCoeff() {
        var stock1 = stockMap[currentShownSymbol1];
        var stock2 = stockMap[currentShownSymbol2];
        var corrCoeff = correlationsMatrix[stock1.index][stock2.index] * posNegMatrix[stock1.index][stock2.index];

        return mathUtil.round(corrCoeff/1000, 2);
    }

    function updateScatterPlot() {
        if(scatterPlotShownFlag) {
            updatePeriodValues();

            scatterPlotRedrawEvent.startWhenFirstListenerReady(currentCorrCoeff());
        }
    }

    function showScatterPlot(symbolA, symbolB) {
        currentShownSymbol1 = symbolA;
        currentShownSymbol2 = symbolB;

        var stock1 = stockMap[symbolA];
        var stock2 = stockMap[symbolB];

        var allValues1 = stock1.period(constants.START_DATE, constants.END_DATE, constants.STOCK_PROPERTY_NAME);
        var allValues2 = stock2.period(constants.START_DATE, constants.END_DATE, constants.STOCK_PROPERTY_NAME);

        scatterPlotNames.length = 0;
        Array.prototype.push.apply(scatterPlotNames, [stock1.name, stock2.name]);

        funcs.combineArrays([allValues1, allValues2], scatterPlotAllValues);

        updatePeriodValues();

        if(scatterPlotShownFlag) {
            scatterPlotRedrawEvent.startWhenFirstListenerReady(currentCorrCoeff())
        }
        else {
            scatterPlotResetEvent.startWhenFirstListenerReady(currentCorrCoeff());
        }

        scatterPlotShownFlag = true;
    }

    function hideScatterPlot() {
        scatterPlotShownFlag = false;
        currentShownSymbol1 = undefined;
        currentShownSymbol2 = undefined;
        scatterPlotRemoveEvent.startWhenFirstListenerReady();
    }

    function createLegend(svgElement) {
        return svgElement.getAttribute("_legend");
    }

    var svgLegend = new SvgLegend(createLegend);

    var width = dimensions.width(),
        height = dimensions.height();

    var svg = d3.select("#mainsvg").append("svg")
        .attr("class", "canvas")
        .attr("width", width+200)
        .attr("height", height+200)
        .on("mousemove", function () {
            var evt = d3.mouse(this);
            svgLegend.onMouseMoved(evt[0], evt[1]);
        });

    var graphs = svg.append("g")
        .attr("class", "main canvas");

    var legend = svg.append("g")
        .attr("class", "legend canvas");

    svgLegend.init();

    var ROUTE_PARAMS_START_SYMBOL_A = "symbA";
    var ROUTE_PARAMS_START_SYMBOL_B = "symbB";

    $scope.graphs = graphs;

    $scope.startSymbolA = $routeParams[ROUTE_PARAMS_START_SYMBOL_A];
    $scope.startSymbolB = $routeParams[ROUTE_PARAMS_START_SYMBOL_B];

    $scope.current_period_start = constants.START_DATE;
    setPeriodEnd();

    $scope.scatterPlotRedrawEvent = scatterPlotRedrawEvent;
    $scope.scatterPlotResetEvent = scatterPlotResetEvent;
    $scope.scatterPlotRemoveEvent = scatterPlotRemoveEvent;

    $scope.scatterPlotAllValues = scatterPlotAllValues;
    $scope.scatterPlotPeriodValues = scatterPlotPeriodValues;
    $scope.scatterPlotNames = scatterPlotNames;

    $scope.switchStockOnOff = switchStockOnOff;
    $scope.stockSwitches = stockSwitches;
    $scope.currentShownStocks = currentShownStocks;
    $scope.width = dimensions.width();
    $scope.height = dimensions.height();

    $scope.startPeriodLength = periodLengthInDays;

    init();

    if(demoMode) {
        whenInitialized(function() {
            var startDateValue = 12000;
            var startPeriodLengthValue = 300;

            dateChangedEvent.startWhenFirstListenerReady(startDateValue)
            dateSliderChanged(startDateValue);

            periodLengthSliderChangeEvent.startWhenFirstListenerReady(startPeriodLengthValue);
            periodLengthSliderChanged(startPeriodLengthValue);

            play();
        });
    }

});