'use strict';

com_geekAndPoke_coolg.STOCK_CONTROLLER = "stockController";

angular.module(com_geekAndPoke_coolg.moduleName).controller(com_geekAndPoke_coolg.STOCK_CONTROLLER, function($scope) {

    var Stock = bottle.container.Stock;

    var stockNames = ["aapl", "dai-de", "ge", "nyt"];
    var stocks = [];
    var stockPromises = [];

    stockNames.forEach(function(stockName) {
        var stock = new Stock(stockName);
        stocks.push(stock);
        stockPromises.push(stock.ready);
    });

    var correlations = [];

    Promise.all(stockPromises).then(function() {
        stocks.forEach(function(stockA) {
            var periodA = stockA.period("2014-01-01", "2015-01-01", "Close");
            stocks.forEach(function(stockB) {
                var periodB = stockB.period("2014-01-01", "2015-01-01", "Close");
                var correlation = math.correlation(periodA, periodB);
                correlations.push({
                    nameA: stockA.name,
                    nameB: stockB.name,
                    correlation: correlation
                })
            });
        });
    });
});