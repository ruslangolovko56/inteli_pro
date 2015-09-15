'use strict';

angular.module('quizAppApp')
    .controller('QuestionsCtrl', function ($scope, Question, $filter, dialogs, $rootScope, questions, $state) {
        //
        // Initialize function definition.
        //
        var init;

        //
        // Initialize scope variables.
        //
        $scope.questions = questions;
        $scope.searchKeywords = '';
        $scope.filteredQuestions = [];
        $scope.row = '';

        //
        // Select page.
        //
        $scope.select = function(page) {
            var end, start;
            start = (page - 1) * $scope.numPerPage;
            end = start + $scope.numPerPage;
            return $scope.currentPageQuestions = $scope.filteredQuestions.slice(start, end);
        };

        //
        // Reflect data when filter changes.
        //
        $scope.onFilterChange = function() {
            $scope.select(1);
            $scope.currentPage = 1;
            return $scope.row = '';
        };

        //
        // Function called when display number per page changes.
        //
        $scope.onNumPerPageChange = function() {
            $scope.select(1);
            return $scope.currentPage = 1;
        };

        //
        // Function called when order changes.
        //
        $scope.onOrderChange = function() {
            $scope.select(1);
            return $scope.currentPage = 1;
        };

        //
        // Search question.
        //
        $scope.search = function() {
            $scope.filteredQuestions = $filter('filter')($scope.questions, $scope.searchKeywords);
            return $scope.onFilterChange();
        };

        //
        // Order by column.
        //
        $scope.order = function(rowName) {
            if ($scope.row === rowName) {
                return;
            }
            $scope.row = rowName;
            $scope.filteredQuestions = $filter('orderBy')($scope.filteredQuestions, rowName);
            return $scope.onOrderChange();
        };

        //
        // Pagination variables.
        //
        $scope.numPerPageOpt = [20, 50, 100];
        $scope.numPerPage = $scope.numPerPageOpt[0];
        $scope.currentPage = 1;
        $scope.currentPageQuestions = [];

        //
        // Get questions.
        //
        $scope.query = function() {
            Question.query().$promise.then(function (questions){
                $scope.questions = questions;
                return $scope.search();
            });
        }

        //
        // Display tags in format.
        //
        $scope.printTags = function(tags) {
            var strTag = "";
            tags.forEach(function(tag) {
                strTag += tag.text + " ";
            });
            return strTag;
        }

        //
        // Display used option in format.
        //
        $scope.printUsed = function(used) {
            return used ? 'Yes' : 'No';
        }

        //
        // Display date in format.
        //
        $scope.printDate = function(date) {
            return Date('d m Y', Date.parse(date));
        }

        //
        // Delete question.
        //
        $scope.delete = function(question) {
            var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this question?');

            dlg.result.then(function(btn){
                var index = $scope.questions.indexOf(question);

                Question.delete({ id: question._id }, function () {
                    $scope.questions.splice(index, 1);
                    $scope.search();
                    $state.go('questions');
                });
            },function(btn){
                return;
            });
        }

        //
        // Clone question.
        //
        $scope.clone = function(question) {
            var dlg = dialogs.wait(undefined,undefined,100);

            var updated = angular.copy(question);
            delete updated._id;
            delete updated.created;
            delete updated.updated;
            updated.answers.forEach(function (answer) {
                delete answer._id;
            });

            Question.save(updated, function (data) {
                $scope.questions.push(data);
                $scope.search();
                $rootScope.$broadcast('dialogs.wait.complete');
            });
        }

        //
        // Initialize.
        //
        $scope.search();

    });
