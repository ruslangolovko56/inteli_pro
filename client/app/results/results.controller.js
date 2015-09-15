'use strict';

angular.module('quizAppApp')
    .controller('ResultsCtrl', function ($scope, Result, $filter, dialogs, $rootScope, $state, results) {
        var init;

        //
        // Initialize scope variables.
        //
        $scope.results = results;
        $scope.row = '';
        $scope.data = [];
        $scope.active = true;
        $scope.data.filteredResults = [];

        //
        // Function called when page is selected.
        //
        $scope.select = function (page) {
            var end, start;
            start = (page - 1) * $scope.data.numPerPage;
            end = start + $scope.data.numPerPage;
            return $scope.currentPageResults = $scope.data.filteredResults.slice(start, end);
        };

        //
        // Function called when filter changes.
        //
        $scope.onFilterChange = function () {
            $scope.select(1);
            $scope.currentPage = 1;
            return $scope.row = '';
        };

        //
        // Function called when display number per page changes.
        //
        $scope.onNumPerPageChange = function () {

            $scope.select(1);
            return $scope.currentPage = 1;
        };

        //
        // Function called when order changes.
        //
        $scope.onOrderChange = function () {
            $scope.select(1);
            return $scope.currentPage = 1;
        };

        //
        // Search result.
        //
        $scope.search = function () {
            $scope.data.filteredResults = $filter('filter')($scope.results, $scope.data.searchKeywords);
            return $scope.onFilterChange();
        };

        //
        // Order by column.
        //
        $scope.order = function (rowName) {
            if ($scope.row === rowName) {
                return;
            }
            $scope.row = rowName;
            $scope.data.filteredResults = $filter('orderBy')($scope.data.filteredResults, rowName);
            return $scope.onOrderChange();
        };

        //
        // Initialize pagination variables.
        //
        $scope.numPerPageOpt = [20, 50, 100];
        $scope.data.numPerPage = $scope.numPerPageOpt[0];
        $scope.currentPage = 1;
        $scope.currentPageResults = [];

        //
        // Display tags in format.
        //
        $scope.printTags = function (tags) {
            var strTag = "";
            tags.forEach(function (tag) {
                strTag += tag.text + " ";
            });
            return strTag;
        };

        //
        // Display used in format.
        //
        $scope.printUsed = function (used) {
            return used ? 'Yes' : 'No';
        };

        //
        // Display date in format.
        //
        $scope.printDate = function (date) {
            return Date('d m Y', Date.parse(date));
        };

        //
        // Delete result.
        //
        $scope.delete = function (result) {
            var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this result?');

            dlg.result.then(function (btn) {
                var index = $scope.results.indexOf(result);

                Result.delete({ id: result._id }, function () {
                    $scope.results.splice(index, 1);
                    $scope.search();
                    $state.go('results');
                });
            }, function (btn) {
                return;
            });
        };

        //
        // clone quiz.
        //
        $scope.clone = function (result) {
            var dlg = dialogs.wait(undefined, undefined, 100);

            var updated = angular.copy(result);
            delete updated._id;
            delete updated.created;
            delete updated.updated;

            Result.save(updated, function (data) {
                $scope.results.push(data);
                $scope.search();
                $rootScope.$broadcast('dialogs.wait.complete');
            });
        };

        $scope.goToResultsPages = function () {
          $state.go('resultspages');
        };

        //
        // Initialize.
        //
        $scope.search();

    });
