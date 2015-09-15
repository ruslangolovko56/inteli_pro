'use strict';

angular.module('quizAppApp')
  .controller('DirectLinkDialogCtrl', function ($scope, $modalInstance, data) {
    $scope.directLink = data.domain + '/s/' + data.id;

    $scope.close = function () {
      $modalInstance.dismiss();
    };

    $scope.getTextToCopy = function () {
      return $scope.directLink;
    };
  })
  .controller('EmbedLinkDialogCtrl', function ($scope, $modalInstance, data) {
    $scope.form = {
      'embedLink': '<div class="quiz-container" data-quiz="' + data.id + '"></div><script src="' + data.domain + '/s/jsEmbed"></script>',
      'align': false
    };

    $scope.getTextToCopy = function () {
      return $scope.form.embedLink;
    };

    $scope.$watch('form.align', function (newValue, oldValue) {
      if (newValue === true) {
        $scope.form.embedLink = '<div class="quiz-container" style="text-align: center" data-quiz="' + data.id + '"></div><script src="' + data.domain + '/s/jsEmbed"></script>';
      } else {
        $scope.form.embedLink = '<div class="quiz-container" data-quiz="' + data.id + '"></div><script src="' + data.domain + '/s/jsEmbed"></script>';
      }
    });

    $scope.close = function () {
      $modalInstance.dismiss();
    };

  })
  .controller('CloneDialogCtrl', function ($scope, $modalInstance, data) {
    $scope.dlg = {};
    $scope.dlg.title = data.title;

    $scope.cancel = function () {
      $modalInstance.dismiss();
    }

    $scope.create = function () {
      if ($scope.dlg.title != '') {
        return $modalInstance.close($scope.dlg.title);
      }
    }

    $scope.canSubmit = function () {
      return $scope.dlg.form_dlg.$valid;
    }
  })
  .controller('QuizzesCtrl', function ($scope, Quiz, StartPage, ResultsPage, Result, Question, OptInForm, questions, forms, resultsPages, startPages, results, $filter, dialogs, $state, $stateParams, $rootScope, quizzes, domain, $q, lodash) {
    var init;

    //
    // Initialize scope variables.
    //
    $scope.quizzes = quizzes;
    $scope.questions = questions;
    $scope.forms = forms;
    $scope.resultsPages = resultsPages;
    $scope.startPages = startPages;
    $scope.results = results;
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
    // Display tags in format.
    //
    $scope.printTags = function (tags) {
      var strTag = "";
      tags.forEach(function (tag) {
        strTag += tag.text + " ";
      });
      return strTag;
    }

    //
    // Display percentage.
    //
    $scope.printPercentage = function (c, t) {
      return t == 0 || !c || !t ? 0 : Math.round(c / t * 100);
    }

    //
    // Display used option in format.
    //
    $scope.printUsed = function (used) {
      return used ? 'Yes' : 'No';
    }

    //
    // Display date in format.
    //
    $scope.printDate = function (date) {
      return Date('d m Y', Date.parse(date));
    }

    //
    // delete quiz.
    //
    $scope.delete = function (quiz) {
      var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this quiz?');

      dlg.result.then(function (btn) {
        var index = $scope.quizzes.indexOf(quiz);

        Quiz.delete({id: quiz._id}, function () {
          $scope.quizzes.splice(index, 1);
          $scope.search();
          $state.go('quizzes');
        });
      }, function (btn) {
        return;
      });
    }

    //
    // clone quiz.
    //
    $scope.clone = function (quiz) {
      var newQuiz = angular.copy(quiz);

      var dlg = dialogs.create('app/quizzes/clone.dialog.html', 'CloneDialogCtrl', {title: quiz.title}, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });

      dlg.result.then(function (title) {
        newQuiz.title = title;

        delete newQuiz._id;
        delete newQuiz.created;
        delete newQuiz.updated;
        delete newQuiz.startedAt;
        delete newQuiz.landed;
        delete newQuiz.status;

        Quiz.save(newQuiz, function (data) {
          $scope.quizzes.push(data);
          $scope.search();
        });
      });
    };

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

        $scope.quizzes[index].chartDataModel.nodes.forEach(function (node) {
          if (node.type=='startPage'){
            var startPage = lodash.find($scope.startPages, {_id: node.dataId});
            var updated = angular.copy(startPage);
            delete updated._id;
            delete updated.created;
            delete updated.updated;

            StartPage.save(updated, function (data) {
              console.log(data);
            });
          } else if (node.type=='question'){
            var question = lodash.find($scope.questions, {_id: node.dataId});
            var updated = angular.copy(question);
            delete updated._id;
            delete updated.created;
            delete updated.updated;
            updated.answers.forEach(function (answer) {
              delete answer._id;
            });

            Question.save(updated, function (data) {
              console.log(data);
            });
          } else if (node.type=='form'){
            var form = lodash.find($scope.forms, {_id: node.dataId});
            var updated = angular.copy(form);
            delete updated._id;
            delete updated.created;
            delete updated.updated;

            OptInForm.save(updated, function (data) {
              console.log(data);
            });
          } else if (node.type=='resultsPage'){
            var resultsPage = lodash.find($scope.resultsPages, {_id: node.dataId});
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

            ResultsPage.save(updated, function (data) {
              console.log(data);
            });

            resultsPage.results.forEach(function (each) {
              var result = lodash.find($scope.results, {_id: each._id});
              updated = angular.copy(result);
              delete updated._id;
              delete updated.created;
              delete updated.updated;

              Result.save(updated, function (data) {
                console.log(data);
              });
            });
            //result = lodash.find($scope.results, {_id: node.dataId});
            //updated = angular.copy(result);
            //delete updated._id;
            //delete updated.created;
            //delete updated.updated;
            //
            //Result.save(updated, function (data) {
            //  console.log(data);
            //});
          }
        });

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
    // Check if quiz is editable.
    //
    $scope.isEditable = function (quiz) {
      return quiz.status == 'test' ? true : false;
    };

    //
    // Export quiz to csv
    //
    $scope.export = function(quiz) {
      var deffered = $q.defer();

      Quiz.getLeads({id: quiz._id}, function(data) {
        console.log(data);
        var csv = [];

        data.forEach(function(item) {
          var date = $filter('date')(item.created, "MM/dd/yyyy 'at' h:mma");
          var n = {
            date: date,
            completed: item.completed ? 'completed' : 'incompleted',
            email: item.email || ' '
          };

          var index = 1;

          item.path.forEach(function(q) {
            if(q.question.type.id == 1) {
              var answer = lodash.find(q.question.answers, function(answer) {
                return answer._id == q.answer;
              });

              n['question' + index] = q.question.text;
              n['answer' + index] = answer.text;
            } else {
              n['question' + index] = q.question.text;
              n['answer' + index] = q.answer;
            }

            index ++;
          });

          csv.push(n);
        });

        deffered.resolve(csv);
      }, function(err) {
        deffered.reject();
      });

      return deffered.promise;
    };

    //
    // Initialize.
    //
    $scope.search();
  });


