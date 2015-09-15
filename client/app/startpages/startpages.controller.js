'use strict';

angular.module('quizAppApp')
    .controller('StartpagesCtrl', function ($scope, StartPage, startPages, $filter, dialogs, $rootScope, $state) {
        //
        // Initialize function definition.
        //
        var init;

        //
        // Initialize scope variables.
        //
        $scope.startPages = startPages;
        $scope.searchKeywords = '';
        $scope.filteredStartPages = [];
        $scope.row = '';

        //
        // Select page.
        //
        $scope.select = function (page) {
            var end, start;
            start = (page - 1) * $scope.numPerPage;
            end = start + $scope.numPerPage;
            return $scope.currentPageStartPages = $scope.filteredStartPages.slice(start, end);
        };

        //
        // Reflect data when filter changes.
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
        // Search start pages.
        //
        $scope.search = function () {
            $scope.filteredStartPages = $filter('filter')($scope.startPages, $scope.searchKeywords);
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
            $scope.filteredStartPages = $filter('orderBy')($scope.filteredStartPages, rowName);
            return $scope.onOrderChange();
        };

        //
        // Pagination variables.
        //
        $scope.numPerPageOpt = [20, 50, 100];
        $scope.numPerPage = $scope.numPerPageOpt[0];
        $scope.currentPage = 1;
        $scope.currentPageStartPages = [];

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
        // Display used option in format.
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
        // Delete start page.
        //
        $scope.delete = function (startPage) {
            var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this page?');

            dlg.result.then(function (btn) {
                var index = $scope.startPages.indexOf(startPage);

                StartPage.delete({ id: startPage._id }, function () {
                    $scope.startPages.splice(index, 1);
                    $scope.search();
                    $state.go('startpages');
                });
            }, function (btn) {
                return;
            });
        };

        //
        // Clone start page.
        //
        $scope.clone = function (startPage) {
            var dlg = dialogs.wait(undefined, undefined, 100);

            var updated = angular.copy(startPage);
            delete updated._id;
            delete updated.created;
            delete updated.updated;

            StartPage.save(updated, function (data) {
                $scope.startPages.push(data);
                $scope.search();
                $rootScope.$broadcast('dialogs.wait.complete');
            });
        };

        //
        // Initialize.
        //
        $scope.search();

    });
