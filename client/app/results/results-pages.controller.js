'use strict';

angular.module('quizAppApp')
  .controller('ResultsPagesCtrl', function ($scope, ResultsPage, $filter, dialogs, $rootScope, $state, resultsPages, lodash) {
    var init;

    /**
     * Select results tab
     */
    $scope.goToResults = function () {
      $state.go('results');
    };

    //
    // Initialize scope variables.
    //
    $scope.resultsPages = resultsPages;
    $scope.row = '';
    $scope.active = true;
    $scope.data = [];
    $scope.data.filteredResultsPages = [];

    //
    // Function called when page is selected.
    //
    $scope.select = function (page) {
      var end, start;
      start = (page - 1) * $scope.data.numPerPage;
      end = start + $scope.data.numPerPage;
      return $scope.currentPageResultsPages = $scope.data.filteredResultsPages.slice(start, end);
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
      $scope.data.filteredResultsPages = $filter('filter')($scope.resultsPages, $scope.data.searchKeywords);
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
      $scope.data.filteredResultsPages = $filter('orderBy')($scope.data.filteredResultsPages, rowName);
      return $scope.onOrderChange();
    };

    //
    // Initialize pagination variables.
    //
    $scope.numPerPageOpt = [20, 50, 100];
    $scope.data.numPerPage = $scope.numPerPageOpt[0];
    $scope.currentPage = 1;
    $scope.currentPageResultsPages = [];

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
    $scope.delete = function (resultsPage) {
      var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this result page?');

      dlg.result.then(function (btn) {
        var index = $scope.resultsPages.indexOf(resultsPage);

        ResultsPage.delete({id: resultsPage._id}, function () {
          $scope.resultsPages.splice(index, 1);
          $scope.search();
          $state.go('resultspages');
        });
      }, function (btn) {
        return;
      });
    };

    //
    // clone quiz.
    //
    $scope.clone = function (resultsPage) {
      var dlg = dialogs.wait(undefined, undefined, 100);

      console.log(resultsPage);

      var updated = {
        name: resultsPage.name,
        description: resultsPage.description,
        tags: resultsPage.tags,
        beforeResults: resultsPage.beforeResults,
        afterResults: resultsPage.afterResults,
        user: resultsPage.user
      };

      updated.results = lodash.map(resultsPage.results, function (result) {
        return result._id;
      });

      console.log(updated);

      ResultsPage.save(updated, function (data) {
        console.log(data);
        $scope.resultsPages.push(data);
        $scope.search();
        $rootScope.$broadcast('dialogs.wait.complete');
      });
    };

    //
    // Initialize.
    //
    $scope.search();

  });
