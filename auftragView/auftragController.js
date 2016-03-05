'use strict';

com_eosItServices_fx.ABLAUF_CONTROLLER = "AblaufController";

angular.module(com_eosItServices_fx.moduleName).controller(com_eosItServices_fx.ABLAUF_CONTROLLER,
    function ($scope, $routeParams, $location, $filter, ngTableParams, fileUtil, util, funcs, httpUtil, Auftrag) {

        var ROUTE_PARAM_SUFFIX = "suffix";
        var suffix = httpUtil.getParam(ROUTE_PARAM_SUFFIX, "2014");
        $scope.suffix = suffix;
        $scope.title = "Forderungen mit KE in Januar " + (funcs.isEmpty(suffix) ? "2014" : suffix);

        function configureTable(rows) {
            $scope.tableParams = new ngTableParams({
                page: 1,
                count: 100,
                filter: {
                    auftrId: $routeParams.auftrId,
                    auftrName: $routeParams.auftrName,
                    mdName: $routeParams.mdName
                }
            }, {
                total: rows.length, // length of data
                getData: function ($defer, params) {
                    var filteredRows = params.filter() ?
                        $filter('filter')(rows, params.filter()) :
                        rows;

                    var orderedRows = params.sorting() ?
                        $filter('orderBy')(filteredRows, params.orderBy()) :
                        filteredRows;

                    var tableRows = orderedRows.slice((params.page() - 1) * params.count(), params.page() * params.count());
                    params.total(orderedRows.length);

                    util.createUrlParameters($location, params.filter());

                    $defer.resolve(tableRows);
                    $scope.tableRows = tableRows;
                }
            });
        }

        var auftrag = new Auftrag(suffix);
        auftrag.ready().then(function() {
            configureTable(auftrag.auftragArray);
        });
    });