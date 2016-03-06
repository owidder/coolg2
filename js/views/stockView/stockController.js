'use strict';

com_geekAndPoke_coolg.STOCK_CONTROLLER = "stockController";

angular.module(com_geekAndPoke_coolg.moduleName).controller(com_geekAndPoke_coolg.STOCK_CONTROLLER, function($scope, $timeout) {

    var Stock = bottle.container.Stock;
    var SimplePromise = bottle.container.SimplePromise;
    var SimpleEvent = bottle.container.SimpleEvent;
    var dateUtil = bottle.container.dateUtil;

    var stockNames = ["aapl", "dai-de", "ge", "nyt", "fb", "goog", "xom"];
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

    $scope.correlationsMatrix = correlationsMatrix;
    $scope.posNegMatrix = posNegMatrix;
    $scope.stockNames = stockNames;

    $scope.redrawEvent = redrawEvent;
    $scope.ready = ready.promise;

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

    function drawMonth(yyyy_mm_dd) {
        var yyyy_mm_dd_plus1m = dateUtil.incByOneMonth(yyyy_mm_dd);
        computePeriod(yyyy_mm_dd, yyyy_mm_dd_plus1m);
        redrawEvent.listenersReady.then(function() {
            redrawEvent.start();
        });

        return yyyy_mm_dd_plus1m;
    }

    $scope.currentYYYY_MM_DD = "1980-01-01";
    function step() {
        $scope.currentYYYY_MM_DD = drawMonth($scope.currentYYYY_MM_DD);
        if($scope.currentYYYY_MM_DD < "1980-03-01") {
            $timeout(step, 2000);
        }
    }

    Promise.all(stockPromises).then(function() {
        step();
    });
});