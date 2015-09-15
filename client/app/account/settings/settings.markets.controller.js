'use strict';

angular.module('quizAppApp')
  .controller('AddMarketDialogCtrl', function ($scope, $modalInstance, data, Market, lodash) {
    /**
     * Scope variable
     */
    $scope.form = {
      name: ''
    };
    $scope.submitted = false;

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.dismiss();
    };

    /**
     * Save new market.
     */
    $scope.add = function (form) {
      $scope.submitted = true;

      if (form.$valid) {
        Market.save({name: $scope.form.name}, function (data) {
          $modalInstance.close(data);
        }, function (err) {
          err = err.data;
          $scope.errors = {};
          lodash.forEach(err.errors, function (error, field) {
            form[field].$setValidity('mongoose', false);
            $scope.errors[field] = error.message;
          });
        });
      }
    };

    $scope.canSubmit = function (form) {
      return form.$valid;
    };
  })
  .controller('SettingsMarketsCtrl', function ($scope, $state, $http, dialogs, $filter, markets, Market) {
    var init;

    //
    // Initialize scope variables.
    //
    $scope.markets = markets;
    $scope.row = '';

    //
    // Function called when select pagination button.
    //
    $scope.select = function (page) {
      var end, start;
      start = (page - 1) * $scope.numPerPage;
      end = start + $scope.numPerPage;
      return $scope.currentPageMarkets = $scope.markets.slice(start, end);
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
    // Order by column.
    //
    $scope.order = function (rowName) {
      if ($scope.row === rowName) {
        return;
      }
      $scope.row = rowName;
      $scope.markets = $filter('orderBy')($scope.markets, rowName);
      return $scope.onOrderChange();
    };

    //
    // Pagination variables.
    //
    $scope.numPerPageOpt = [3, 5, 10, 20];
    $scope.numPerPage = $scope.numPerPageOpt[2];
    $scope.currentPage = 1;
    $scope.currentPageMarkets = [];

    /**
     * open dialog to add new market
     */
    $scope.add = function () {
      var dlg = dialogs.create('app/account/settings/settings.add-market.dialog.html', 'AddMarketDialogCtrl', {}, {
        size: 'sm',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (data) {
        $scope.markets.push(data);
      }, function () {
      });
    };

    /**
     * Edit market
     * @param market
     */
    $scope.edit = function (market) {
      if (market.editable) {
        var index = $scope.markets.indexOf(market);
        $scope.markets[index].tempName = $scope.markets[index].name;
        $scope.markets[index].status = 'edit';
      }
    }

    /**
     * Cancel editing
     * @param market
     */
    $scope.cancel = function (market) {
      if (market.editable) {
        var index = $scope.markets.indexOf(market);
        $scope.markets[index].status = '';
      }
    };

    /**
     * Save edited
     * @param market
     */
    $scope.save = function (market) {
      if (market.editable) {
        var index = $scope.markets.indexOf(market);
        var name = $scope.markets[index].name;
        $scope.markets[index].name = $scope.markets[index].tempName;
        Market.update(market, function (data) {
          $scope.markets[index].status = '';
        }, function () {
          $scope.markets[index].name = name;
        });
      }
    };

    /**
     * Display activation tooltip
     * @param market
     * @returns {string}
     */
    $scope.displayTooltip = function (market) {
      return market.active ? 'Deactivate' : 'Activate';
    };

    /**
     * Delete market
     * @param market
     */
    $scope.delete = function (market) {
      if (market.editable) {
        var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete?', {size: 'sm'});

        dlg.result.then(function (btn) {
          var index = $scope.markets.indexOf(market);
          Market.delete({id: market._id}, function () {
            $scope.markets.splice(index, 1);
          }, function () {
            //error
          });
        });
      }
    };

    var updated = false;

    /**
     * Update activation status
     * @param market
     */
    $scope.updateStatus = function (market) {
      if (!updated) {
        updated = true;
        Market.update(market, function () {
          // success;
          updated = false;
        }, function () {
          var index = $scope.markets.indexOf(market);
          $scope.markets[index].active = !$scope.markets[index].active;
          updated = false;
        });
      }
    };

  });


