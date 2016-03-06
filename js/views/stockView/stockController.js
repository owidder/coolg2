'use strict';

com_geekAndPoke_coolg.STOCK_CONTROLLER = "stockController";

angular.module(com_geekAndPoke_coolg.moduleName).controller(com_geekAndPoke_coolg.STOCK_CONTROLLER, function($scope, $timeout, funcs) {

    var Stock = bottle.container.Stock;
    var SimplePromise = bottle.container.SimplePromise;

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

    var correlations = [];
    var correlationsMatrix = math.zero2DimArray(stockNames.length);
    var posNegMatrix = math.zero2DimArray(stockNames.length);
    var ready = new SimplePromise();

    initStocks();

    $scope.correlationsMatrix = correlationsMatrix;
    $scope.posNegMatrix = posNegMatrix;
    $scope.stockNames = stockNames;

    $scope.ready = ready.promise;

    Promise.all(stockPromises).then(function() {
        stocks.forEach(function(stockA) {
            var periodA = stockA.period("1980-01-01", "1980-02-01", "Close");
            stocks.forEach(function(stockB) {
                if(stockA.name != stockB.name) {
                    var periodB = stockB.period("1980-01-01", "1980-02-01", "Close");
                    var correlation = math.correlation(periodA, periodB);
                    var indexA = indexFromStockName(stockA.name);
                    var indexB = indexFromStockName(stockB.name);
                    correlationsMatrix[indexA][indexB] = Math.abs(correlation * 1000);
                    posNegMatrix[indexA][indexB] = Math.sign(correlation);
                    correlations.push({
                        nameA: stockA.name,
                        nameB: stockB.name,
                        correlation: correlation
                    })
                }
            });
        });
        ready.resolve();
        $timeout(function() {
            $scope.correlations = correlations;
        });
    });
});