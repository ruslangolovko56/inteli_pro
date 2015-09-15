'use strict';

angular.module('quizAppApp')
  .controller('LeadsCtrl', function ($scope, $filter, quizzes, lodash, fields, dialogs) {
    $scope.filters = [
      {
        name: 'Quiz Name',
        conditions: ['=', 'Not'],
        systemId: 'quiz_name',
        type: 'dropdown',
        values: lodash.map(angular.copy(quizzes), function (quiz) {
          return {
            id: quiz._id,
            value: quiz.title
          };
        })
      },
      {
        name: 'Completion Date',
        systemId: 'completion_date',
        conditions: ['=', '>', '<', 'Not'],
        type: 'date'
      }
    ];

    $scope.operations = ['AND', 'OR'];

    var blankCondition = {
      filter: '',
      value: '',
      condition: '',
      operation: '',
      datePickerOpened: false
    };

    $scope.conditions = [];

    //
    // Pagination variables.
    //
    $scope.currentPageLeads = [];
    $scope.numPerPageOpt = [20, 50, 100];
    $scope.numPerPage = 20;
    $scope.urlParams = {};

    /**
     * Initialize function
     */
    function init() {
      $scope.conditions.push(angular.copy(blankCondition));

      lodash.forEach(fields, function (field) {
        var filter = {};

        filter.name = field.name;
        filter.fieldId = field._id;
        switch (field.type) {
          case 'text':
            filter.conditions = ['=', 'Contains'];
            filter.type = 'text';
            break;
          case 'email':
            filter.conditions = ['=', 'Contains'];
            filter.type = 'email';
            break;
          default:
            filter.conditions = [];
            filter.type = undefined;
        }

        $scope.filters.push(filter);
      });
    }

    /**
     * Event handler when click date picker button
     *
     * @param $event
     * @param condition
     */
    $scope.openDateTimePicker = function ($event, condition) {
      $event.preventDefault();
      $event.stopPropagation();

      var index = lodash.indexOf($scope.conditions, condition);
      $scope.conditions[index].datePickerOpened = true;
    };

    /**
     * Add new condition
     */
    $scope.addCondition = function () {
      $scope.conditions.push(angular.copy(blankCondition));
    };

    /**
     * Event handler when change name in filter
     * @param condition
     */
    $scope.changeFilter = function (condition) {
      var index = lodash.indexOf($scope.conditions, condition);
      $scope.conditions[index].value = '';
      $scope.conditions[index].condition = '';
      $scope.conditions[index].operation = '';
      $scope.conditions[index].datePickerOpened = false;
    };

    /**
     * Search leads upon filter
     */
    $scope.search = function (form) {
      $scope.submitted = true;

      if(form.$valid) {
        var conditions = angular.copy($scope.conditions);

        conditions = lodash.map(conditions, function(condition) {
          var newCon = {};

          if(condition.filter.fieldId) {
            newCon.fieldId = condition.filter.fieldId;
          }
          if(condition.filter.systemId) {
            newCon.systemId = condition.filter.systemId;
          }
          if(condition.filter.type == 'date') {
            newCon.value = new Date(condition.value);
          } else {
            newCon.value = condition.value;
          }
          newCon.condition = condition.condition;
          newCon.operation = condition.operation;
          newCon.type = condition.filter.type;

          return newCon;
        });

        $scope.urlParams = conditions;
        $scope.currentLead = null;
      }
    };

    /**
     * Delete single condition
     *
     * @param condition
     */
    $scope.delete = function (condition) {
      var index = lodash.indexOf($scope.conditions, condition);
      $scope.conditions.splice(index, 1);
    };

    $scope.displayPath = function(lead) {
      console.log(lead);
      $scope.currentLead = lead;
    };

    $scope.leadRowClass = function (lead) {
      return angular.equals($scope.currentLead, lead) ? 'success' : '';
    };

    $scope.displayAnswerText = function (path) {
      var answer;

      if(path.question.type.id == 1) {
        answer = lodash.find(path.question.answers, function (answer) {
          return answer._id == path.answer;
        }).text;
      } else {
        answer = path.answer;
      }

      return answer;
    };


//        //
//        // Select page.
//        //
//        $scope.select = function(page) {
//            var end, start;
//            start = (page - 1) * $scope.numPerPage;
//            end = start + $scope.numPerPage;
//            return $scope.currentPageLeads = $scope.filteredLeads.slice(start, end);
//        };
//
//        //
//        // Reflect data when filter changes.
//        //
//        $scope.onFilterChange = function() {
//            $scope.select(1);
//            $scope.currentPage = 1;
//            return $scope.row = '';
//        };
////
//        // Function called when display number per page changes.
//        //
//        $scope.onNumPerPageChange = function() {
//            $scope.select(1);
//            return $scope.currentPage = 1;
//        };
//
//        //
//        // Function called when order changes.
//        //
//        $scope.onOrderChange = function() {
//            $scope.select(1);
//            return $scope.currentPage = 1;
//        };
//
//        //
//        // Search lead.
//        //
//        $scope.search = function() {
//            $scope.filteredLeads = $filter('filter')($scope.leads, $scope.searchKeywords);
//            return $scope.onFilterChange();
//        };
//
    //
    // Order by column.
    //
    $scope.order = function (rowName) {
      if ($scope.row === rowName) {
        return;
      }
      $scope.row = rowName;
      return $scope.currentPageLeads = $filter('orderBy')($scope.currentPageLeads, rowName);
    };

    /**
     * Initialize
     */
    init();

  });
