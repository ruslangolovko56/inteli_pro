'use strict';

angular.module('quizAppApp')
    .controller('FormsCtrl', function ($scope, OptInForm, forms, $filter, dialogs, $rootScope, $state) {
        //
        // Initialize scope variables.
        //
        $scope.forms = forms;
        $scope.searchKeywords = '';
        $scope.filteredForms = [];
        $scope.row = '';

        //
        // Select page.
        //
        $scope.select = function (page) {
            var end, start;
            start = (page - 1) * $scope.numPerPage;
            end = start + $scope.numPerPage;
            return $scope.currentPageForms = $scope.filteredForms.slice(start, end);
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
        // Search forms.
        //
        $scope.search = function () {
            $scope.filteredForms = $filter('filter')($scope.forms, $scope.searchKeywords);
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
            $scope.filteredForms = $filter('orderBy')($scope.filteredForms, rowName);
            return $scope.onOrderChange();
        };

        //
        // Pagination variables.
        //
        $scope.numPerPageOpt = [20, 50, 100];
        $scope.numPerPage = $scope.numPerPageOpt[0];
        $scope.currentPage = 1;
        $scope.currentPageForms = [];

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
        // Delete form.
        //
        $scope.delete = function (form) {
            var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this page?');

            dlg.result.then(function (btn) {
                var index = $scope.forms.indexOf(form);

                OptInForm.delete({ id: form._id }, function () {
                    $scope.forms.splice(index, 1);
                    $scope.search();
                    $state.go('forms');
                });
            }, function (btn) {
                return;
            });
        };

        //
        // Clone form.
        //
        $scope.clone = function (form) {
            var dlg = dialogs.wait(undefined, undefined, 100);

            var updated = angular.copy(form);
            delete updated._id;
            delete updated.created;
            delete updated.updated;

            OptInForm.save(updated, function (form) {
                $scope.forms.push(form);
                $scope.search();
                $rootScope.$broadcast('dialogs.wait.complete');
            });
        };

        //
        // Initialize.
        //
        $scope.search();

    });
