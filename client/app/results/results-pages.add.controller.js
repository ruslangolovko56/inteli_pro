'use strict';

angular.module('quizAppApp')
  .controller('ResultsPageAddFieldsDialogCtrl', function ($scope, $modalInstance, data, $filter) {
    $scope.form = {
      fields            : data.fields,
      searchKeywords    : '',
      filteredFields    : [],
      numPerPageOpt     : [3, 5, 10, 20],
      numPerPage        : 10,
      currentPage       : 1,
      currentPageQuizzes: [],
      selectedField     : null
    };

    // Order by column.
    $scope.orderFields = function (rowName) {
      if ($scope.rowSystem === rowName) {
        return;
      }
      $scope.rowSystem = rowName;
      $scope.form.currentPageFields = $filter('orderBy')($scope.form.currentPageFields, rowName);
    };

    //
    // Function called when select pagination button.
    //
    $scope.select = function (page) {
      var end, start;
      start = (page - 1) * $scope.form.numPerPage;
      end = start + $scope.form.numPerPage;
      return $scope.form.currentPageFields = $scope.form.filteredFields.slice(start, end);
    };

    //
    // Function called when filter changes.
    //
    $scope.onFilterChange = function () {
      $scope.select(1);
      return $scope.form.currentPage = 1;
    };

    //
    // Function called when display number per page changes.
    //
    $scope.onNumPerPageChange = function () {
      $scope.select(1);
      return $scope.form.currentPage = 1;
    };

    //
    // Search quiz.
    //
    $scope.search = function () {
      $scope.form.filteredFields = $filter('filter')($scope.form.fields, $scope.form.searchKeywords);
      return $scope.onFilterChange();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };

    $scope.add = function () {
      $modalInstance.close('{' + $scope.form.selectedField.name + '}');
      //$modalInstance.close();
    };

    $scope.canSubmit = function () {
      return $scope.form.selectedField != null;
      //return true;
    };

    $scope.selectRow = function (field) {
      $scope.form.selectedField = field;
    };

    $scope.selectedRowClass = function (field) {
      return angular.equals($scope.form.selectedField, field) ? 'success' : '';
    };

    $scope.search();

  })
  .controller('ResultsPagesAddCtrl', function ($scope, $upload, $http, ResultsPage, resultsPage, Auth, $state, dialogs, $stateParams, results, $filter, lodash) {

    //
    // Initializer.
    //
    var init,
        originalResultsPage;

    //
    // Initialize scope variables.
    //
    $scope.resultsPage = {};
    $scope.results = angular.copy(results);
    $scope.editable = false;
    $scope.sortableOptions = {
      connectWith: ".apps-container"
    };

    //
    // Initialize function.
    //
    init = function () {

      if ($stateParams.id) {
        //
        // Edit status.
        //
        $scope.editable = true;

        $scope.resultsPage = angular.copy(resultsPage);

        var originalResults = angular.copy($scope.resultsPage.results);

        $scope.resultsPage.results = [];

        lodash.filter(originalResults, function (result) {
          var f = lodash.find($scope.results, function (r) {
            return r && r._id == result._id;
          });

          if (f) {
            $scope.resultsPage.results.push(f);
            $scope.results.splice($scope.results.indexOf(f), 1);
          }
        });

        console.log($scope.resultsPage.results);
      } else {
        //
        // Initialize result.
        //
        $scope.resultsPage = {
          description  : '',
          tags         : [],
          name         : '',
          beforeResults: '',
          afterResults : '',
          results      : []
        };
      }

      originalResultsPage = angular.copy($scope.resultsPage);

      $scope.searchResult();
    };

    //
    // Validate submit data.
    //
    $scope.canSubmit = function () {
      return $scope.form_results_page.$valid && !angular.equals($scope.resultsPage, originalResultsPage);
    };

    //
    // Prepare submit data.
    //
    var prepareSubmit = function () {
      var resultsPage = angular.copy($scope.resultsPage);

      resultsPage.user = Auth.getCurrentUser()._id;

      resultsPage.results = lodash.map(resultsPage.results, function (result) {
        return result._id;
      });

      console.log(resultsPage);

      return resultsPage;
    };

    //
    // Save data.
    //
    $scope.save = function () {
      if ($scope.editable) {
        //
        // Save edit.
        //
        $(".indicator").show();
        ResultsPage.update(prepareSubmit(), function (data) {
          $scope.resultsPages.forEach(function (result) {
            if (result._id == data._id) {
              var index = $scope.resultsPages.indexOf(result);
              $scope.resultsPages[index] = data;
            }
          });
          $scope.search();
          $state.go('^');
          $(".indicator").hide();
        });
      } else {
        //
        // Save new result.
        //
        $(".indicator").show();
        ResultsPage.save(prepareSubmit(), function (data) {
          $scope.resultsPages.push(data);
          $scope.search();
          $state.go('^');
          $(".indicator").hide();
        });
      }
    };

    //
    // Add new result.
    //
    $scope.addNew = function () {
      if ($scope.canSubmit()) {
        //
        // Save before add new result.
        //
        ResultsPage.save(prepareSubmit(), function (data) {
          $scope.resultsPage.push(data);
          $scope.search();
          init();
          $scope.form_results_page.$setPristine();
        });
      } else if (!angular.equals($scope.resultsPage, originalResultsPage)) {
        //
        // Alert confirmation.
        //
        var dlg = dialogs.confirm('Please confirm', 'You have not filled all fields. Are you sure to continue without saving data?');

        dlg.result.then(function (btn) {
          init();
          $scope.form_results_page.$setPristine();
        }, function (btn) {
          return;
        });
      } else {
        init();
      }

    };

    //
    // Cancel result.
    //
    $scope.cancel = function () {
      if (!angular.equals($scope.resultsPage, originalResultsPage)) {
        var dlg = dialogs.confirm('Please confirm', 'Are you sure to continue without saving data?');

        dlg.result.then(function (btn) {
          return $state.go('^');
        }, function (btn) {
          return;
        });
      } else {
        return $state.go('^');
      }
    };

    $scope.searchResult = function () {
      $scope.filteredResults = $filter('filter')($scope.results, $scope.searchResultKeywords);
      return $scope.onFilterChange();
    }

    //
    // Call initialize function.
    //
    init();

  });

