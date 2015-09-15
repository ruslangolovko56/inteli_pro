'use strict';

angular.module('quizAppApp')
  .controller('SurveyCtrl', function ($scope, $stateParams, Quiz, Question, StartPage, OptInForm, Result, Lead, dialogs, quiz, $timeout, $window, lodash, $location, ResultsPage, Field) {

    $scope.quiz = quiz;     // Quiz promise.
    $scope.step = 0;        // Represent step status.
    $scope.queue = [];      // Answers and results path queue.
    $scope.question = {};   // Current question.
    $scope.results = [];    // Results.
    $scope.esps = [];
    $scope._height = 0;    // Height of window.
    $scope.form = {
      error: ''
    };
    $scope.exitUrl = '';

    var fields,
        leadId;

    // Initialize function.
    var init = function () {
      if($scope.quiz.status == 'active') {
        Quiz.land({id: $stateParams.id}, {});
      }

      // Without startpage.
      if (!$scope.quiz.startPage) {
        $scope.startQuiz();
      } else {
        $scope.step = 1;
      }
    };

    // Resize iframe window for embed code.
    if ($stateParams.embed == 'true') {
      $window.onresize = function () {
        $scope.$apply();
      };
    }

    // Find root element.
    var findRoot = function () {
      var root = [];

      $scope.quiz.chartDataModel.nodes.forEach(function (node) {
        var source = $scope.quiz.chartDataModel.connections.filter(function (connection) {
          return connection.source.nodeId == node.id;
        });
        var dest = $scope.quiz.chartDataModel.connections.filter(function (connection) {
          return connection.dest.nodeId == node.id;
        });
        if (source.length > 0 && dest.length == 0) {
          root.push(node);
        }
      });

      return root.length == 1 ? root[0].id : -1;
    };

    // Find node by node id.
    var findNodeByNodeId = function (nodeId) {
      if (nodeId == -1) return;
      return $scope.quiz.chartDataModel.nodes.filter(function (node) {
        return node.id == nodeId;
      })[0];
    };

    // Query question.
    var queryQuestion = function (qId, callback) {
      Question.select({id: qId}).$promise.then(function (question) {
        callback(null, question);
      }, function (err) {
        callback(err);
      });
    };

    // Query results page
    var queryResultsPage = function (dataId, callback) {
      ResultsPage.select({id: dataId}).$promise.then(function (resultsPage) {
        callback(null, resultsPage);
      }, function (err) {
        callback(err);
      });
    };

    // Query form
    var queryForm = function (dataId, callback) {
      OptInForm.select({id: dataId}).$promise.then(function (form) {
        callback(null, form);
      }, function (err) {
        callback(err);
      });
    };

    var stepToQuiz = function () {
      if($scope.quiz.startPage) {
        $scope.question = findNodeByNodeId(findNext(findRoot()));
      } else {
        $scope.question = findNodeByNodeId(findRoot());
      }

      if ($scope.question) {
        queryQuestion($scope.question.dataId, function (err, question) {
          if (err) {
            //throw new Error(err);
            return $scope.form.error = 'Something went wrong. Please try again later.';
          }
          $scope.question.data = question;
          $scope.step = 2;
        });
      } else {
        $scope.form.error = 'Current quiz contains none of questions.';
      }
    }

    // Start quiz.
    $scope.startQuiz = function () {

      // Increase landing number.
      if ($scope.quiz.status == 'active') {
        Lead.save({quiz: $stateParams.id}, function (data) {
          leadId = data._id;
          stepToQuiz();
        }, function (err) {
          return $scope.form.error = 'Something went wrong. Please try again later.';
        });
      } else {
        stepToQuiz();
      }
    };

    // Query result.
    var queryResult = function (results, callback) {
      Result.survey({results: results}).$promise.then(function (results) {
        callback(null, results);
      });
    };

    // Get result.
    var getResult = function (nodeId, results, esps) {
      var node = findNodeByNodeId(nodeId);
      if (node.type == 'result') {
        results.push(node.dataId);
        var nextNodeId = findNext(nodeId);
        if (nextNodeId != -1) {
          return getResult(nextNodeId, results, esps);
        } else {
          return {results: results, esps: esps};
        }
      } else if (node.type == 'esp') {
        esps.push({id: node.dataId, meta: node.meta});
        var nextNodeId = findNext(nodeId);
        if (nextNodeId != -1) {
          return getResult(nextNodeId, results, esps);
        } else {
          return {results: results, esps: esps};
        }
      } else {
        return {results: results, esps: esps};
      }
    };

    // Get Esp lists
    var findEsps = function (nodeId, esps) {
      var node = findNodeByNodeId(nodeId);

      if (node.type == 'esp') {
        esps.push({id: node.dataId, meta: node.meta});
        var nextNodeId = findNext(nodeId);
        if (nextNodeId != -1) {
          return findEsps(nextNodeId, esps);
        }
      }
      return esps;
    }

    // Get Results Page
    var findResultsPage = function (nodeId) {
      var node = findNodeByNodeId(nodeId);

      if (node.type == 'resultsPage') {
        return nodeId;
      } else {
        var nextNodeId = findNext(nodeId);
        if (nextNodeId == -1) {
          return -1;
        } else {
          return findResultsPage(nextNodeId);
        }
      }
    }

    // Check the question is first.
    $scope.isFirst = function () {
      if($scope.quiz.startPage) {
        return $scope.question && $scope.question.id == findNext(findRoot());
      } else {
        return $scope.question && $scope.question.id == findRoot();
      }
    };

    // Navigate to previous question.
    $scope.back = function () {
      $scope.question = $scope.queue.pop();
    };

    // Find next node id.
    var findNext = function (nodeId, connectorId) {
      var next;
      if (connectorId) {
        next = $scope.quiz.chartDataModel.connections.filter(function (connection) {
          return connection.source.nodeId == nodeId && connection.source.connectorId == connectorId;
        });
      } else {
        next = $scope.quiz.chartDataModel.connections.filter(function (connection) {
          return connection.source.nodeId == nodeId;
        });
      }
      if (next.length == 1) {
        return next[0].dest.nodeId;
      } else {
        return -1;
      }
    };

    // Navigate to next question.
    $scope.next = function () {
      $scope.queue.push($scope.question);

      if ($scope.quiz.status == 'active') {

        var lead = {};

        lead.quiz = $stateParams.id;
        lead.path = lodash.map($scope.queue, function (question) {
          return {
            answer  : question.answer,
            question: question.dataId,
            id      : question.id
          };
        });

        Lead.update({id: leadId}, lead, function (data) {
        }, function (err) {
          $scope.form.error = 'Sorry, something went wrong! Please try again later.';
        });

      }

      if (!$scope.question.answer || $scope.question.answer.length == 0) {
        var errMsg = '';

        switch ($scope.question.data.type.id) {
          case '1':
            errMsg = 'You have not selected answer !';
            break;
          case '2':
          case '3':
            errMsg = 'The answer field is empty !';
            break;
          case '4':
            errMsg = 'The answer must contain numeric value !';
            break;
        }

        return dialogs.error('Error', errMsg);
      }

      var nextNodeId;
      if ($scope.question.data.type.id == 1) {
        nextNodeId = findNext($scope.question.id, $scope.question.answer);
      } else {
        nextNodeId = findNext($scope.question.id);
      }

      var nextNode = findNodeByNodeId(nextNodeId);

      if (nextNode) {
        switch (nextNode.type) {
          case 'question':
            queryQuestion(nextNode.dataId, function (err, question) {
              if (err) {
                //throw new Error(err);
                return $scope.form.error = 'Something went wrong. Please try again later.';
              }
              nextNode.data = question;
              $scope.question = nextNode;
            });
            break;
          case 'resultsPage':
            $scope.setQuizCompleted();
            queryResultsPage(nextNode.dataId, function (err, resultsPage) {
              if (err) {
                //throw new Error(err);
                return $scope.form.error = 'Something went wrong. Please try again later.';
              }
              $scope.resultsPage = resultsPage;
              $scope.resultsPage.exitUrl = nextNode.meta.exitUrl;
              $scope.complete();
            });
            break;
          case 'form':
            $scope.setQuizCompleted();
            queryForm(nextNode.dataId, function (err, form) {
              if (err) {
                //throw new Error(err);
                return $scope.form.error = 'Something went wrong. Please try again later.';
              }
              $scope.form = form;
              $scope.form.exitUrl = nextNode.meta.exitUrl;
              $scope.esps = findEsps(findNext(nextNode.id), []);
              var resultsPageId = findResultsPage(nextNode.id, []);
              if (resultsPageId != -1) {
                var n = findNodeByNodeId(resultsPageId);
                queryResultsPage(n.dataId, function (err, resultsPage) {
                  if (err) {
                    //throw new Error(err);
                    return $scope.form.error = 'Something went wrong. Please try again later.';
                  }
                  $scope.resultsPage = resultsPage;
                  $scope.resultsPage.exitUrl = n.meta.exitUrl;
                  $scope.step = 3;
                });
              } else {
                $scope.step = 3;
              }
            });
            break;
        }
        //if (nextQuestion.type == 'question') {
        //  queryQuestion(nextQuestion.dataId, function (err, question) {
        //    if (err) {
        //      //throw new Error(err);
        //      return $scope.form.error = 'Something went wrong. Please try again later.';
        //    }
        //    nextQuestion.data = question;
        //    $scope.queue.push($scope.question);
        //    $scope.question = nextQuestion;
        //  });
        //} else {
        //  var result = getResult(nextQuestion.id, [], []);
        //  var results = result.results;
        //  $scope.esps = result.esps;
        //  if (results.length > 0) {
        //    queryResult(results, function (err, results) {
        //      if (err) {
        //        throw new Error(err);
        //      }
        //      $scope.queue.push($scope.question);
        //      $scope.results = results;
        //      if ($scope.quiz.form) {
        //        $scope.step = 3;
        //      } else {
        //        $scope.complete();
        //      }
        //    });
        //  } else {
        //
        //  }
        //}
      } else {
        $scope.setQuizCompleted();
        $scope.complete();
      }
    };

    // Check question type.
    $scope.isType = function (type) {
      return $scope.question && $scope.question.data && $scope.question.data.type.id == type;
    };

    // Check step.
    $scope.isStep = function (step) {
      return $scope.step && $scope.step == step;
    };

    // Check if have attachment.
    $scope.hasAttachment = function (obj) {
      return obj && obj.attachment ? true : false;
    };

    // Select answer.
    $scope.check = function (answer) {
      if ($scope.hasButton()) {
        return $scope.question.answer = answer._id;
      } else {
        $scope.question.answer = answer._id;
        return $scope.next();
      }
    };

    // Check if select answer.
    $scope.isChecked = function (id) {
      return $scope.question.answer == id;
    };

    // Check if question has button.
    $scope.hasButton = function () {
      return $scope.quiz && $scope.quiz.hasButton;
    };

    // Check if can submit form.
    $scope.canSubmit = function () {
      return $scope.form_contact.$valid;
    };

    var getAllFieldsValues = function (callback) {
      Field.queryFromParam({
        userId: $scope.quiz.user,
        params: $location.search()
      }).$promise.then(function (data) {

          fields = lodash.map(data, function (field) {
            field.value = $location.search()[field.param];
            return field;
          });

          $scope.queue.forEach(function (question) {
            if (question.data.type.id == 1) {
              var answer = lodash.find(question.data.answers, function (answer) {
                return answer._id == question.answer;
              });

              answer.fields.forEach(function (field) {
                fields.push(field);
              })
            } else {
              question.data.answers[0].fields.forEach(function (field) {
                fields.push(field);
              })
            }
          });

          if($scope.form && $scope.form.fields) {
            $scope.form.fields.forEach(function (field) {
              if (field.visible) {
                fields.push(field);
              }
            });
          }

          console.log(fields);
          return callback();
        }, function (err) {
          return callback(err);
        });
    };

    // Submit form data.
    $scope.submitForm = function () {
      $scope.form.error = '';

      if ($scope.quiz.status == 'active') {

        getAllFieldsValues(function (err) {
          if (err) {
            return $scope.form.error = 'Sorry, something went wrong! Please try again later.';
          }

          Field.querySystem({ id: 0 }).$promise.then(function (systemfields) {
            var result_field = lodash.find(systemfields, function (s) {
              return s.name == 'rlink';
            });
            var lead = {};

            lead.url = 'http://52.0.250.174:8080' + '/r/' + leadId;
            result_field['value'] = lead.url;
            fields.push(result_field);
            $scope.form.fields.push(result_field);

            lead.fields = lodash.map(fields, function (field) {
              var f = {};
              f.field = field._id;
              f.value = '';
              if (field.visible) {
                var s = lodash.find($scope.form.fields, function (s) {
                  return s._id == field._id;
                });

                if (s) {
                  f.value = s.value;
                }
              } else {
                f.value = field.value || '';
              }
              return f;
            });
            lead.quiz = $stateParams.id;
            lead.path = lodash.map($scope.queue, function (question) {
              return {
                answer  : question.answer,
                question: question.dataId,
                id      : question.id
              };
            });
            lead.esps = $scope.esps;
            lead.resultPages = $scope.resultsPage._id;


            Lead.finish({id: leadId}, lead, function (data) {
              //$scope.getResultsPage();
              //toResultsPage();
              $scope.complete();
            }, function (err) {
              return $scope.form.error = 'Sorry, something went wrong! Please try again later.';
            });
          });

        });

      } else {
        $scope.complete();
      }
    };

    var completeResultsPage = function () {
      var re = /({.*?})/g;
      var exitUrl = '';

      if ($scope.resultsPage && $scope.resultsPage.exitUrl) {
        var arr = $scope.resultsPage.exitUrl.match(re);
        exitUrl = $scope.resultsPage.exitUrl;
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              exitUrl = exitUrl.replace(m, field.value);
            } else {
              exitUrl = exitUrl.replace(m, '');
            }
          });
        }
      } else if ($scope.form && $scope.form.exitUrl) {
        var arr = $scope.form.exitUrl.match(re);
        exitUrl = $scope.form.exitUrl;
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              exitUrl = exitUrl.replace(m, field.value);
            } else {
              exitUrl = exitUrl.replace(m, '');
            }
          });
        }
      }

      $scope.exitUrl = exitUrl;
      console.log($scope.exitUrl);

      if ($scope.resultsPage) {
        var arr = $scope.resultsPage.beforeResults.match(re);
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              $scope.resultsPage.beforeResults = $scope.resultsPage.beforeResults.replace(m, field.value);
            } else {
              $scope.resultsPage.beforeResults = $scope.resultsPage.beforeResults.replace(m, '');
            }
          });
        }

        var arr = $scope.resultsPage.afterResults.match(re);
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              $scope.resultsPage.afterResults = $scope.resultsPage.afterResults.replace(m, field.value);
            } else {
              $scope.resultsPage.afterResults = $scope.resultsPage.afterResults.replace(m, '');
            }
          });
        }
      }
      var lead = {};
      lead.resultPages = $scope.resultsPage;

      Lead.update({id: leadId}, lead, function (data) {
      }, function (err) {
        $scope.form.error = 'Sorry, something went wrong! Please try again later.';
      });
    };

    var toResultsPage = function() {
      if ($scope.resultsPage) {
        $scope.step = 4;
      } else {
        $scope.step = 5;
      }
    };

    var redirectToResultsPage = function () {
      var re = /({.*?})/g;
      var exitUrl = '';

      if ($scope.resultsPage && $scope.resultsPage.exitUrl) {
        var arr = $scope.resultsPage.exitUrl.match(re);
        exitUrl = $scope.resultsPage.exitUrl;
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              exitUrl = exitUrl.replace(m, field.value);
            } else {
              exitUrl = exitUrl.replace(m, '');
            }
          });
        }
      } else if ($scope.form && $scope.form.exitUrl) {
        var arr = $scope.form.exitUrl.match(re);
        exitUrl = $scope.form.exitUrl;
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              exitUrl = exitUrl.replace(m, field.value);
            } else {
              exitUrl = exitUrl.replace(m, '');
            }
          });
        }
      }

      $scope.exitUrl = exitUrl;
      console.log($scope.exitUrl);

      if ($scope.resultsPage) {
        var arr = $scope.resultsPage.beforeResults.match(re);
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              $scope.resultsPage.beforeResults = $scope.resultsPage.beforeResults.replace(m, field.value);
            } else {
              $scope.resultsPage.beforeResults = $scope.resultsPage.beforeResults.replace(m, '');
            }
          });
        }

        var arr = $scope.resultsPage.afterResults.match(re);
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              $scope.resultsPage.afterResults = $scope.resultsPage.afterResults.replace(m, field.value);
            } else {
              $scope.resultsPage.afterResults = $scope.resultsPage.afterResults.replace(m, '');
            }
          });
        }

        $scope.step = 4;
      } else {
        $scope.step = 5;
      }
    };

    // Increase completed count.
    $scope.setQuizCompleted = function () {
      if ($scope.quiz.status == 'active') {
        Quiz.complete({id: $stateParams.id}, {});
      }
    };

    // Complete quiz.
    $scope.getResultsPage = function () {
      if ($scope.fields) {
        completeResultsPage();
      } else {
        getAllFieldsValues(function (err) {
          if (err) {
            return $scope.form.error = 'Sorry, something went wrong! Please try again later.';
          }

          completeResultsPage();
        });
      }
    }

    // Complete quiz.
    $scope.complete = function () {
      if ($scope.fields) {
        redirectToResultsPage();
      } else {
        getAllFieldsValues(function (err) {
          if (err) {
            return $scope.form.error = 'Sorry, something went wrong! Please try again later.';
          }

          redirectToResultsPage();
        });
      }
    }

    $scope.exit = function () {
      $window.location.href = $scope.exitUrl;
    }

    // Initialize.
    init();
  }).controller('SurveyResultCtrl', function ($scope, $stateParams, Quiz, Question, StartPage, OptInForm, Result, Lead, dialogs, lead, $timeout, $window, lodash, $location, ResultsPage, Field) {
    $scope.resultsPage = [];
    $scope.quiz = [];
    var fields = [];

    var init = function () {
      Quiz.survey({id: lead.quiz}).$promise.then(function (quiz) {
        $scope.quiz = quiz;
        ResultsPage.get({id: lead.resultPages}).$promise.then(function (resultsPage) {
          $scope.resultsPage = resultsPage;
          $scope.step = 4;
          $scope.complete();
        }, function (err) {
          return $scope.form.error = 'Sorry, something went wrong! Please try again later.';
        });
      }, function (err) {
        return $scope.form.error = 'Sorry, something went wrong! Please try again later.';
      });
    };

    var getAllFieldsValues = function (item, callback) {
      Field.get({id: item.field}).$promise.then(function(field){
        field["value"] = item.value;
        fields.push(field);
        callback();
      }, function (err) {
        callback(err);
      })
    };

    var redirectToResultsPage = function () {
      var re = /({.*?})/g;
      var exitUrl = '';
      if ($scope.resultsPage && $scope.resultsPage.exitUrl) {
        var arr = $scope.resultsPage.exitUrl.match(re);
        exitUrl = $scope.resultsPage.exitUrl;
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              exitUrl = exitUrl.replace(m, field.value);
            } else {
              exitUrl = exitUrl.replace(m, '');
            }
          });
        }
      } else if ($scope.form && $scope.form.exitUrl) {
        var arr = $scope.form.exitUrl.match(re);
        exitUrl = $scope.form.exitUrl;
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              exitUrl = exitUrl.replace(m, field.value);
            } else {
              exitUrl = exitUrl.replace(m, '');
            }
          });
        }
      }

      $scope.exitUrl = exitUrl;
      console.log($scope.exitUrl);

      if ($scope.resultsPage) {
        var arr = $scope.resultsPage.beforeResults.match(re);
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              $scope.resultsPage.beforeResults = $scope.resultsPage.beforeResults.replace(m, field.value);
            } else {
              $scope.resultsPage.beforeResults = $scope.resultsPage.beforeResults.replace(m, '');
            }
          });
        }

        var arr = $scope.resultsPage.afterResults.match(re);
        if(arr) {
          arr.forEach(function (m) {
            var field = lodash.find(fields, function (field) {
              return field.name.toLowerCase() == m.toLowerCase().substring(1, m.length - 1);
            });

            if (field) {
              $scope.resultsPage.afterResults = $scope.resultsPage.afterResults.replace(m, field.value);
            } else {
              $scope.resultsPage.afterResults = $scope.resultsPage.afterResults.replace(m, '');
            }
          });
        }
      }
    };

    // Complete quiz.
    $scope.complete = function () {
      async.map(lead.fields, getAllFieldsValues, function(err){
        if (err) {
          return $scope.form.error = 'Sorry, something went wrong! Please try again later.';
        }

        redirectToResultsPage();
      });
    }

    // Check step.
    $scope.isStep = function (step) {
      return $scope.step && $scope.step == step;
    };

    // Check if have attachment.
    $scope.hasAttachment = function (obj) {
      return obj && obj.attachment ? true : false;
    };

    init();
  })
  //
  // Checks every $digest for height changes.
  //
  .directive('emHeightSource', function ($window, $stateParams) {
    return {
      link: function (scope, element, attrs) {
        if ($stateParams.embed == 'true') {
          scope.$watch(function () {
            var height = element.height();
            if (scope._height == height) return;
            scope._height = height;
            $window.parent.postMessage($stateParams.id + ':' + height + ':' + $stateParams.index, '*');
          });
        }
      }
    }
  })
  //
  // check for height changes when image loaded.
  //
  .directive('imageonload', function ($stateParams) {
    return {
      restrict: 'A',
      link    : function (scope, element, attrs) {
        if ($stateParams.embed == 'true') {
          element.bind('load', function () {
            scope.$apply();
          });
        }
      }
    };
  });
;
