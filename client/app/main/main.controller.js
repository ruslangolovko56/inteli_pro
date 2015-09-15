'use strict';

angular.module('quizAppApp')
  .controller('UpdateCostDialogCtrl', function ($scope, $modalInstance, data, Quiz) {
    $scope.quiz = data.quiz;
    $scope.form = {
      datePickerOpened: false,
      totalCost: data.quiz.cost,
      updateDate: data.quiz.costUpdatedAt
    };

    var originalForm = angular.copy($scope.form);

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.dismiss();
    };

    /**
     * Event handler when click date picker button
     *
     * @param $event
     * @param condition
     */
    $scope.openDatePicker = function ($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.form.datePickerOpened = true;
    };

    /**
     * Display data cost per data
     *
     * @returns {string}
     */
    $scope.getCostPerLead = function () {
      if ($scope.form.totalCost && $scope.quiz.leadCount && parseInt($scope.quiz.leadCount) != 0) {
        return '$ ' + $scope.form.totalCost / $scope.quiz.leadCount;
      }
    };

    //
    // Check form is valid or not.
    //
    $scope.canSubmit = function () {
      return $scope.form_updatecost.$valid && !angular.equals($scope.form, originalForm);
    };


    /**
     * Submit cost data and return update
     *
     * @param form
     */
    $scope.update = function (form) {
      if (form.$valid) {
        Quiz.update({id: $scope.quiz._id}, {
          cost: $scope.form.totalCost,
          costUpdatedAt: $scope.form.updateDate
        }, function (data) {
          $modalInstance.close(data);
        });
      }
    };
  })
  .controller('MainCtrl', function ($scope, $http, quizzes, domain, $filter, dialogs, Quiz, stats, lodash) {
    //
    // Initialize scope variables.
    //
    $scope.quizzes = quizzes;
    $scope.stats = stats;
    $scope.searchKeywords = '';
    $scope.filteredQuizzes = [];
    $scope.row = '';

    //
    // Function called when select pagination button.
    //
    $scope.select = function (page) {
      var end, start;
      start = (page - 1) * $scope.numPerPage;
      end = start + $scope.numPerPage;
      return $scope.currentPageQuizzes = $scope.filteredQuizzes.slice(start, end);
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
    // Search quiz.
    //
    $scope.search = function () {
      $scope.filteredQuizzes = $filter('filter')($scope.quizzes, $scope.searchKeywords);
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
      $scope.filteredQuizzes = $filter('orderBy')($scope.filteredQuizzes, rowName);
      return $scope.onOrderChange();
    };

    //
    // Pagination variables.
    //
    $scope.numPerPageOpt = [20, 50, 100];
    $scope.numPerPage = $scope.numPerPageOpt[0];
    $scope.currentPage = 1;
    $scope.currentPageQuizzes = [];

    //
    // Check whether quiz is active or not.
    //
    $scope.isActive = function (quiz) {
      return quiz.status == 'active' ? true : false;
    };

    //
    // Activate quiz.
    //
    $scope.activate = function (quiz) {
      //var dlg = dialogs.wait({}, {}, 100);

      Quiz.activate({id: quiz._id}, {}).$promise.then(function (result) {
        var index = $scope.quizzes.indexOf(quiz);
        $scope.quizzes[index].status = 'active';
        $scope.quizzes[index].startedAt = new Date();
        //$rootScope.$broadcast('dialogs.wait.complete');
      }, function (response) {
        //$rootScope.$broadcast('dialogs.wait.complete');
        if (response.status == 403) {
          dialogs.notify('Your current quiz is not valid!', 'Please ensure that you have only one starting question and also ensure that all questions and results are connected with each other. Also note that attached ESP fields should be mapped in settings page.');
        }
      });
    };

    //
    // Deactivate quiz.
    //
    $scope.deactivate = function (quiz) {
      //var dlg = dialogs.wait({}, {}, 100);

      Quiz.deactivate({id: quiz._id}, {}).$promise.then(function (result) {
        var index = $scope.quizzes.indexOf(quiz);
        $scope.quizzes[index].status = 'inactive';
        //$rootScope.$broadcast('dialogs.wait.complete');
      });
    };

    //
    // Display modal to show direct link.
    //
    $scope.directLink = function (quiz) {
      dialogs.create('app/quizzes/directlink.dialog.html', 'DirectLinkDialogCtrl', {
        id: quiz._id,
        domain: domain.domain
      }, {size: 'lg', keyboard: true, backdrop: false});
    };

    //
    // Display modal to show embed link.
    //
    $scope.embedLink = function (quiz) {
      dialogs.create('app/quizzes/embedlink.dialog.html', 'EmbedLinkDialogCtrl', {
        id: quiz._id,
        domain: domain.domain
      }, {size: 'md', keyboard: true, backdrop: false});
    };

    //
    // Display modal to update cost
    //
    $scope.updateCost = function (quiz) {
      var dlg = dialogs.create('app/main/updatecost.dialog.html', 'UpdateCostDialogCtrl', {
        quiz: quiz
      }, {size: 'md', keyboard: true, backdrop: false});
      dlg.result.then(function (data) {
        var index = $scope.quizzes.indexOf(quiz);
        $scope.quizzes.splice(index, 1, data);
        console.log(data);
        $scope.search();
      });
    };

    //
    // Display cost per count
    //
    $scope.getCostPerCount = function (quiz) {
      if (quiz.cost && quiz.leadCount && parseInt(quiz.leadCount) != 0) {
        return '$ ' + quiz.cost / quiz.leadCount;
      }
      return '';
    };

    //
    // Display percentage.
    //
    $scope.printPercentage = function (c, t) {
      return t == 0 || !c || !t ? 0 : Math.round(c / t * 100);
    }

    function init() {
      $scope.quizzes = lodash.map($scope.quizzes, function (quiz) {
        quiz.percentCompleted = quiz.landed == 0 || !quiz.completed || !quiz.landed ? 0 : Math.round(quiz.completed / quiz.landed * 100);
        quiz.percentLeadCount = quiz.landed == 0 || !quiz.leadCount || !quiz.landed ? 0 : Math.round(quiz.leadCount / quiz.landed * 100);
        return quiz;
      });

      if ($scope.quizzes.length == 0) {
        $scope.bestQuiz = {title: ''};
        $scope.worstQuiz = {title: ''};
      } else {
        $scope.bestQuiz = lodash.max($scope.quizzes, 'percentCompleted');
        $scope.worstQuiz = lodash.min($scope.quizzes, 'percentCompleted');
      }

      $scope.search();
    }

    //
    // Initialize.
    //
    init();
  })
  .directive('impressionChart', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        config: '='
      },
      template: '<div id="chartdiv" style="width: 100%; height: 200px; background-color:#fcf8e3;"></div>',
      link: function (scope, element, attrs) {

        var chart = false;

        var initChart = function () {
          if (chart) chart.destroy();
          var config = scope.config || {};
          chart = AmCharts.makeChart("chartdiv", {
            "type": "serial",
            "theme": "none",
            "pathToImages": "http://www.amcharts.com/lib/3/images/",
            "dataProvider": config,
            "graphs": [{
              "balloonText": "Impressions: <span style='font-size:14px; color:#000000;'><b>[[value]]</b></span>",
              "fillAlphas": 0.6,
              "lineAlpha": 0.4,
              "title": "Impression",
              "valueField": "impression"
            }, {
              "balloonText": "Completed: <span style='font-size:14px; color:#000000;'><b>[[value]]</b></span>",
              "fillAlphas": 0.6,
              "lineAlpha": 0.4,
              "title": "Completed",
              "valueField": "completed"
            }, {
              "balloonText": "LeadCount: <span style='font-size:14px; color:#000000;'><b>[[value]]</b></span>",
              "fillAlphas": 0.6,
              "lineAlpha": 0.4,
              "title": "Lead Count",
              "valueField": "leadCount"
            }],
            "plotAreaBorderAlpha": 0,
            "marginTop": 10,
            "marginLeft": 0,
            "marginBottom": 0,
            "chartScrollbar": {},
            "chartCursor": {
              "cursorAlpha": 0
            },
            "categoryField": "_id",
            "categoryAxis": {
              "startOnAxis": true,
              "axisColor": "#DADADA",
              "gridAlpha": 0.07,
              "parseDates": true
            },
            "valueAxes": [{
              "integersOnly": true
            }]
          });
        };

        initChart();

      }
    }
  });

