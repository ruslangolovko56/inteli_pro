'use strict';

angular.module('quizAppApp')
  .controller('ExitUrlDialogCtrl', function ($scope, $modalInstance, data) {
    $scope.data = {
      url: data.exitUrl || ''
    };
    var originalData = angular.copy($scope.data);

    $scope.close = function () {
      $modalInstance.dismiss();
    };

    $scope.save = function () {
      $modalInstance.close($scope.data.url);
    };

    $scope.canSubmit = function () {
      return $scope.form_exiturl.$valid && !angular.equals(originalData, $scope.data);
    };
  })
  .controller('QuizzesAddCtrl', function ($scope, Question, Result, Quiz, Auth, startPages, forms, questions, resultsPages, markets, quiz, $stateParams, $filter, $state, dialogs, lodash, esps, $timeout, $document) {
    //
    // Initializer
    //
    var init,
      originalQuiz,
      originalChartDataModel,
      chartDataModel = {
        nodes: [],
        connections: []
      };


    //
    // Initialize scope variables.
    //
    $scope.keyword = {
      searchQuestionKeywords: '',
      searchResultsPageKeywords: '',
      searchEspKeywords: '',
      searchStartPageKeywords: '',
      searchFormKeywords: ''
    };
    $scope.editable = false;
    $scope.questions = [];
    $scope.resultsPages = [];
    $scope.esps = [];
    $scope.startPages = [];
    $scope.forms = [];
    $scope.quiz = {};
    $scope.markets = markets;
    // Initialize style for quiz container.
    $scope.questionRectStyle = {
      width: quizmap.nodeMinWidth,
      height: quizmap.nodeHeight,
      'line-height': quizmap.nodeHeight + 'px'
    };
    $scope.ellipsisStyle = {
      height: Math.floor((quizmap.nodeHeight - 20) / 20) * 20
    };
    $scope.espListSelectStyle = {
      width: quizmap.nodeWidth - 20,
      'margin-top': -Math.floor(quizmap.nodeHeight / 2),
      'margin-left': 20,
      position: 'absolute'
    };
    $scope.espExitUrlStyle = {
      //width: quizmap.nodeWidth,
      'margin-top': -Math.floor(quizmap.nodeHeight),
      'margin-left': quizmap.nodeWidth - 7,
      position: 'absolute'
    };
    $scope.espListLabelStyle = {
      'margin-top': 20
    };

    $('head').append("<style>.ellipsis:before{ content:''; float: left; width: 5px; height: " + (Math.floor((quizmap.nodeHeight - 20) / 20) * 20) + "px;}</style>");

    //
    // Initialize function.
    //
    init = function () {
      // set settings for quiz map view.
      quizmap.mapViewId = 'container-map';
      quizmap.mapContainerId = 'quiz-map';

      if ($stateParams.id) {
        $scope.editable = true;

        //
        // Read quiz data set.
        //
        chartDataModel = angular.copy(quiz.chartDataModel);

        // Calculate view element height.
        var mapHeight = quizmap.mapHeight;
        var mapWidth = quizmap.mapWidth;
        chartDataModel.nodes.forEach(function (node) {
          if (node.y > mapHeight) {
            mapHeight = node.y;
          }
          if (node.x > mapWidth) {
            mapWidth = node.x;
          }
        });

        $timeout(function() {
          quizmap.mapHeight = mapHeight + quizmap.nodeHeight * 2;
          $document[0].getElementById(quizmap.mapViewId).style.height = (quizmap.mapHeight) + "px";
          quizmap.mapWidth = mapWidth + quizmap.nodeWidth;
          $document[0].getElementById(quizmap.mapViewId).style.width = (quizmap.mapWidth) + "px";
        }, 500);

        // Set quiz.
        delete quiz.chartDataModel;
        $scope.quiz = angular.copy(quiz);

        // Set quiz market.
//                $scope.quiz.market = $scope.markets.filter(function (market) {
//                    return market.id == $scope.quiz.market.id && market.name == $scope.quiz.market.name;
//                })[0];

        //
        // Create the view-model for the quiz-map and attach to the scope.
        //
        $scope.chartViewModel = new quizmap.ChartViewModel(chartDataModel);

        //
        // Initialize serial no for id to create new node.
        //
        chartDataModel.nodes.length > 0 ? $scope.sId = $filter('orderBy')(chartDataModel.nodes, '-id')[0].id + 1 : $scope.sId = 0;
      } else {
        //
        // Initialize quiz.
        //
        $scope.quiz = {
          title: '',
          description: '',
          tags: [],
          market: null,
          hasButton: false
        };

        //
        // Create the view-model for the quiz-map and attach to the scope.
        //
        $scope.chartViewModel = new quizmap.ChartViewModel(chartDataModel);

        //
        // Initialize serial no for id to create new node.
        //
        $scope.sId = 0;
      }

      //
      // Copy data objects to watch changes.
      //
      originalQuiz = angular.copy($scope.quiz);
      originalChartDataModel = angular.copy(chartDataModel);

      //
      // Setup data model for questions and answers.
      //
      questions.forEach(function (question) {
        var q = {
          name: question.text,
          dataId: question._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [],
          type: 'question'
        };
        for (var i = 0; i < question.answers.length; i++) {
          if (question.answers[i].enable) {
            q.outputConnectors.push({
              name: i + 1,
              dataId: question.answers[i]._id,
              description: question.answers[i].text
            });
          }
        }
        if (question.editable) {
          $scope.questions.push(q);
        }
      });
      $scope.search('question');

      //
      // Setup data model for resultsPages.
      //
      resultsPages.forEach(function (resultsPage) {
        var r = {
          name: resultsPage.name,
          dataId: resultsPage._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'resultsPage',
          meta: {
            exitUrl: '',
            dragging: false
          }
        };
        if (resultsPage.editable) {
          $scope.resultsPages.push(r);
        }
      });
      $scope.search('resultsPage');

      //
      // Setup data model for esps.
      //
      esps.forEach(function (esp) {
        var e = {
          name: esp.name,
          dataId: esp._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'esp',
          meta: {
            list: null,
            lists: esp.lists,
            dragging: false
          }
        };
        $scope.esps.push(e);
      });
      $scope.search('esp');

      //
      // Setup data model for start pages.
      //
      startPages.forEach(function (startPage) {
        var e = {
          name: startPage.title,
          dataId: startPage._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'startPage'
        };
        if (startPage.editable) {
          $scope.startPages.push(e);
        }
      });
      $scope.search('startPage');

      //
      // Setup data model for forms.
      //
      forms.forEach(function (form) {
        var e = {
          name: form.title,
          dataId: form._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'form',
          meta: {
            exitUrl: '',
            dragging: false
          }
        };
        if (form.editable) {
          $scope.forms.push(e);
        }
      });
      $scope.search('form');
    };

    //
    // Set dragging status in case of esp node
    //
    $scope.onDragStart = function (data) {
      data.meta.dragging = true;
    };

    //
    // Set dragging status in case of esp node
    //
    $scope.onDragEnd = function (data) {
      data.meta.dragging = false;
    };

    //
    // Add new node to the quiz-map.
    //
    $scope.onDropComplete = function (data, evt) {
      var dataModel = $scope.chartViewModel.data;

      //
      // Create object for new node.
      //
      var newNode = JSON.parse(JSON.stringify(data));
      if (newNode.type === 'esp') {
        var origin = lodash.findWhere($scope.esps, {dataId: newNode.dataId});
        if (origin.meta.list === null) {
          return false;
        }
        delete newNode.meta;
        newNode.meta = {
          list: origin.meta.list
        };
      }

      if(newNode.type == 'resultsPage') {
        var origin = lodash.findWhere($scope.resultsPages, {dataId: newNode.dataId});
        newNode.meta.exitUrl = origin.meta.exitUrl;
      }

      if(newNode.type == 'form') {
        var origin = lodash.findWhere($scope.forms, {dataId: newNode.dataId});
        newNode.meta.exitUrl = origin.meta.exitUrl;
      }

      console.log(newNode);

      //
      // Set node id.
      //
      newNode.id = $scope.sId++;

      //
      // Calculate drop position.
      //
      var x = evt.x + $('.quiz-map').scrollLeft() - $('.quiz-map').offset().left - quizmap.nodeMinWidth / 2;
      var y = evt.y + $('.quiz-map').scrollTop() - $('.quiz-map').offset().top + quizmap.nodeHeight / 2;

      if (Math.abs(quizmap.mapHeight - y) < quizmap.nodeHeight) {
        quizmap.mapHeight += quizmap.incSize;
        $document[0].getElementById(quizmap.mapViewId).style.height = (quizmap.mapHeight) + "px";
      }
      if (Math.abs(quizmap.mapWidth - x) < quizmap.nodeWidth) {
        quizmap.mapWidth += quizmap.incSize;
        $document[0].getElementById(quizmap.mapViewId).style.width = (quizmap.mapWidth) + "px";
      }

      //
      // Set node position.
      //
      newNode.x = x;
      newNode.y = y;

      //
      // Add node to data model.
      //
      dataModel.nodes.push(newNode);

      //
      // Delete old model.
      //
      delete $scope.chartViewModel;

      //
      // Instantiate new view model.
      //
      $scope.chartViewModel = new quizmap.ChartViewModel(dataModel);
    };

    //
    // Code for the delete key.
    //
    var deleteKeyCode = 46;
    //
    // Code for control key.
    //
    var ctrlKeyCode = 17;

    //
    // Set to true when the ctrl key is down.
    //
    var ctrlDown = false;

    //
    // Code for A key.
    //
    var aKeyCode = 65;

    //
    // Code for esc key.
    //
    var escKeyCode = 27;

    //
    // code for backspace key.
    //
    var backspaceKeyCode = 8;

    //
    // Event handler for key-down on the quiz-map.
    //
    $scope.keyDown = function (evt) {
      if (evt.keyCode === ctrlKeyCode) {

        ctrlDown = true;
        evt.stopPropagation();
        evt.preventDefault();
      }

      if (evt.keyCode === backspaceKeyCode) {
        evt.preventDefault();
      }
    };

    //
    // Event handler for key-up on the quiz-map.
    //
    $scope.keyUp = function (evt) {
      if (evt.keyCode === deleteKeyCode || evt.keyCode === backspaceKeyCode) {
        //
        // Delete key.
        //
        $scope.chartViewModel.deleteSelected();
      }

      if (evt.keyCode == aKeyCode && ctrlDown) {
        //
        // Ctrl + A
        //
        $scope.chartViewModel.selectAll();
      }

      if (evt.keyCode == escKeyCode) {
        // Escape.
        $scope.chartViewModel.deselectAll();
      }

      if (evt.keyCode === ctrlKeyCode) {
        ctrlDown = false;

        evt.stopPropagation();
        evt.preventDefault();
      }
    };

    //
    // Event handler to set focus on quiz-map div element.
    //
    $scope.selectQuizMap = function () {
      $('#quiz-map').focus();
    };

    //
    // Search filter.
    //
    $scope.search = function (type) {
      switch (type) {
        case 'question':
          $scope.filteredQuestions = $scope.questions.filter(function (question) {
            return question.name.toLowerCase().indexOf($scope.keyword.searchQuestionKeywords.toLowerCase()) !== -1 || $scope.keyword.searchQuestionKeywords == '' ? true : false;
          });
          break;
        case 'resultsPage':
          $scope.filteredResultsPages = $scope.resultsPages.filter(function (resultsPage) {
            return resultsPage.name.toLowerCase().indexOf($scope.keyword.searchResultsPageKeywords.toLowerCase()) !== -1 || $scope.keyword.searchResultsPageKeywords == '' ? true : false;
          });
          break;
        case 'esp':
          $scope.filteredEsps = $scope.esps.filter(function (esp) {
            return esp.name.toLowerCase().indexOf($scope.keyword.searchEspKeywords.toLowerCase()) !== -1 || $scope.keyword.searchEspKeywords == '' ? true : false;
          });
          break;
        case 'startPage':
          $scope.filteredStartPages = $scope.startPages.filter(function (startPage) {
            return startPage.name.toLowerCase().indexOf($scope.keyword.searchStartPageKeywords.toLowerCase()) !== -1 || $scope.keyword.searchStartPageKeywords == '' ? true : false;
          });
          break;
        case 'form':
          $scope.filteredForms = $scope.forms.filter(function (form) {
            return form.name.toLowerCase().indexOf($scope.keyword.searchFormKeywords.toLowerCase()) !== -1 || $scope.keyword.searchFormKeywords == '' ? true : false;
          });
          break;
      }
    };

    //
    // Check form is valid or not.
    //
    $scope.canSubmit = function () {
      return $scope.form_quiz.$valid && (!angular.equals($scope.quiz, originalQuiz) || ($scope.chartViewModel && !angular.equals($scope.chartViewModel.data, originalChartDataModel)));
    };

    //
    // Prepare json data before submit.
    //
    var prepareSubmit = function () {
      var quiz = angular.copy($scope.quiz);

      quiz.chartDataModel = angular.copy($scope.chartViewModel.data);

      var connections = [];
      quiz.chartDataModel.connections.forEach(function (connection) {
        var newCon = {};
        newCon.source = {};
        newCon.source.nodeId = connection.source.nodeID;
        var node = lodash.findWhere(quiz.chartDataModel.nodes, {id: connection.source.nodeID});
        if (node.type == 'question') {
          newCon.source.connectorId = node.outputConnectors[connection.source.connectorIndex].dataId;
        }

        newCon.dest = {};
        newCon.dest.nodeId = connection.dest.nodeID;

        connections.push(newCon);
      });

      quiz.chartDataModel.connections = connections;

      quiz.chartDataModel.nodes.forEach(function (node) {
        delete node.inputConnectors;
        delete node.name;
//                if(node.type == 'result') {
        delete node.outputConnectors;
//                } else {
//                    node.outputConnectors.forEach(function(outputConnector) {
//                        if(outputConnector.dataId) {
//                            delete outputConnector.name;
//                            delete outputConnector.description;
//                        }
//                    });
//                }
      });

      quiz.user = Auth.getCurrentUser()._id;

      //if (quiz.startPage == '') {
      //  delete quiz.startPage;
      //}
      //if (quiz.form == '') {
      //  delete quiz.form;
      //}

      return quiz;
    };

    //
    // Send json request to server-side api in order to save or update quiz data.
    //
    $scope.save = function () {
      if ($scope.editable) {
        Quiz.update(prepareSubmit(), function (data) {
          $scope.quizzes.forEach(function (quiz) {
            if (quiz._id == data._id) {
              var index = $scope.quizzes.indexOf(quiz);
              $scope.quizzes[index] = data;
            }
          });
          $scope.$parent.search();
          $state.go('^');
        });
      } else {
        Quiz.save(prepareSubmit(), function (data) {
          console.log(data);
          $scope.quizzes.push(data);
          $scope.$parent.search();
          $state.go('^');
        });
      }
    };

    //
    // Cancel quiz edit.
    //
    $scope.cancel = function () {
      if (!angular.equals($scope.quiz, originalQuiz) || !angular.equals($scope.chartViewModel.data, originalChartDataModel)) {
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

    $scope.setExitUrl = function (data, type) {
      var dlg = dialogs.create('app/quizzes/exit-url.dialog.html', 'ExitUrlDialogCtrl', {exitUrl: data.meta.exitUrl}, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });

      dlg.result.then(function (url) {
        if (type == 'resultsPage') {
          var index = $scope.resultsPages.indexOf(data);
          $scope.resultsPages[index].meta.exitUrl = url;
          $scope.search('resultsPage');
        } else if (type == 'form') {
          var index = $scope.forms.indexOf(data);
          $scope.forms[index].meta.exitUrl = url;
          $scope.search('form');
        }
      });


    };

    //
    // Initialize controller
    //
    init();
  }).controller('QuizzesViewCtrl', function ($scope, Question, Result, Quiz, Auth, startPages, forms, questions, resultsPages, markets, quiz, $stateParams, $filter, $state, dialogs, lodash, esps, $timeout, $document) {
    //
    // Initializer
    //
    var init,
      originalQuiz,
      originalChartDataModel,
      chartDataModel = {
        nodes: [],
        connections: []
      };


    //
    // Initialize scope variables.
    //
    $scope.keyword = {
      searchQuestionKeywords: '',
      searchResultsPageKeywords: '',
      searchEspKeywords: '',
      searchStartPageKeywords: '',
      searchFormKeywords: ''
    };
    $scope.editable = false;
    $scope.questions = [];
    $scope.resultsPages = [];
    $scope.esps = [];
    $scope.startPages = [];
    $scope.forms = [];
    $scope.quiz = {};
    $scope.markets = markets;
    // Initialize style for quiz container.
    $scope.questionRectStyle = {
      width: quizmap.nodeMinWidth,
      height: quizmap.nodeHeight,
      'line-height': quizmap.nodeHeight + 'px'
    };
    $scope.ellipsisStyle = {
      height: Math.floor((quizmap.nodeHeight - 20) / 20) * 20
    };
    $scope.espListSelectStyle = {
      width: quizmap.nodeWidth - 20,
      'margin-top': -Math.floor(quizmap.nodeHeight / 2),
      'margin-left': 20,
      position: 'absolute'
    };
    $scope.espExitUrlStyle = {
      //width: quizmap.nodeWidth,
      'margin-top': -Math.floor(quizmap.nodeHeight),
      'margin-left': quizmap.nodeWidth - 7,
      position: 'absolute'
    };
    $scope.espListLabelStyle = {
      'margin-top': 20
    };

    $('head').append("<style>.ellipsis:before{ content:''; float: left; width: 5px; height: " + (Math.floor((quizmap.nodeHeight - 20) / 20) * 20) + "px;}</style>");

    //
    // Initialize function.
    //
    init = function () {
      // set settings for quiz map view.
      quizmap.mapViewId = 'container-map';
      quizmap.mapContainerId = 'quiz-map';

      if ($stateParams.id) {
        $scope.editable = true;

        //
        // Read quiz data set.
        //
        chartDataModel = angular.copy(quiz.chartDataModel);

        // Calculate view element height.
        var mapHeight = quizmap.mapHeight;
        var mapWidth = quizmap.mapWidth;
        chartDataModel.nodes.forEach(function (node) {
          if (node.y > mapHeight) {
            mapHeight = node.y;
          }
          if (node.x > mapWidth) {
            mapWidth = node.x;
          }
        });

        $timeout(function() {
          quizmap.mapHeight = mapHeight + quizmap.nodeHeight * 2;
          $document[0].getElementById(quizmap.mapViewId).style.height = (quizmap.mapHeight) + "px";
          quizmap.mapWidth = mapWidth + quizmap.nodeWidth;
          $document[0].getElementById(quizmap.mapViewId).style.width = (quizmap.mapWidth) + "px";
        }, 500);

        // Set quiz.
        delete quiz.chartDataModel;
        $scope.quiz = angular.copy(quiz);

        // Set quiz market.
//                $scope.quiz.market = $scope.markets.filter(function (market) {
//                    return market.id == $scope.quiz.market.id && market.name == $scope.quiz.market.name;
//                })[0];

        //
        // Create the view-model for the quiz-map and attach to the scope.
        //
        $scope.chartViewModel = new quizmap.ChartViewModel(chartDataModel);

        //
        // Initialize serial no for id to create new node.
        //
        chartDataModel.nodes.length > 0 ? $scope.sId = $filter('orderBy')(chartDataModel.nodes, '-id')[0].id + 1 : $scope.sId = 0;
      } else {
        //
        // Initialize quiz.
        //
        $scope.quiz = {
          title: '',
          description: '',
          tags: [],
          market: null,
          hasButton: false
        };

        //
        // Create the view-model for the quiz-map and attach to the scope.
        //
        $scope.chartViewModel = new quizmap.ChartViewModel(chartDataModel);

        //
        // Initialize serial no for id to create new node.
        //
        $scope.sId = 0;
      }

      //
      // Copy data objects to watch changes.
      //
      originalQuiz = angular.copy($scope.quiz);
      originalChartDataModel = angular.copy(chartDataModel);

      //
      // Setup data model for questions and answers.
      //
      questions.forEach(function (question) {
        var q = {
          name: question.text,
          dataId: question._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [],
          type: 'question'
        };
        for (var i = 0; i < question.answers.length; i++) {
          q.outputConnectors.push({
            name: i + 1,
            dataId: question.answers[i]._id,
            description: question.answers[i].text
          });
        }
        if (question.editable) {
          $scope.questions.push(q);
        }
      });
      $scope.search('question');

      //
      // Setup data model for resultsPages.
      //
      resultsPages.forEach(function (resultsPage) {
        var r = {
          name: resultsPage.name,
          dataId: resultsPage._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'resultsPage',
          meta: {
            exitUrl: '',
            dragging: false
          }
        };
        if (resultsPage.editable) {
          $scope.resultsPages.push(r);
        }
      });
      $scope.search('resultsPage');

      //
      // Setup data model for esps.
      //
      esps.forEach(function (esp) {
        var e = {
          name: esp.name,
          dataId: esp._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'esp',
          meta: {
            list: null,
            lists: esp.lists,
            dragging: false
          }
        };
        $scope.esps.push(e);
      });
      $scope.search('esp');

      //
      // Setup data model for start pages.
      //
      startPages.forEach(function (startPage) {
        var e = {
          name: startPage.title,
          dataId: startPage._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'startPage'
        };
        if (startPage.editable) {
          $scope.startPages.push(e);
        }
      });
      $scope.search('startPage');

      //
      // Setup data model for forms.
      //
      forms.forEach(function (form) {
        var e = {
          name: form.title,
          dataId: form._id,
          x: 0,
          y: 0,
          inputConnectors: [
            {}
          ],
          outputConnectors: [
            {}
          ],
          type: 'form',
          meta: {
            exitUrl: '',
            dragging: false
          }
        };
        if (form.editable) {
          $scope.forms.push(e);
        }
      });
      $scope.search('form');
    };

    //
    // Set dragging status in case of esp node
    //
    $scope.onDragStart = function (data) {
      data.meta.dragging = true;
    };

    //
    // Set dragging status in case of esp node
    //
    $scope.onDragEnd = function (data) {
      data.meta.dragging = false;
    };

    //
    // Add new node to the quiz-map.
    //
    $scope.onDropComplete = function (data, evt) {
      var dataModel = $scope.chartViewModel.data;

      //
      // Create object for new node.
      //
      var newNode = JSON.parse(JSON.stringify(data));
      if (newNode.type === 'esp') {
        var origin = lodash.findWhere($scope.esps, {dataId: newNode.dataId});
        if (origin.meta.list === null) {
          return false;
        }
        delete newNode.meta;
        newNode.meta = {
          list: origin.meta.list
        };
      }

      if(newNode.type == 'resultsPage') {
        var origin = lodash.findWhere($scope.resultsPages, {dataId: newNode.dataId});
        newNode.meta.exitUrl = origin.meta.exitUrl;
      }

      if(newNode.type == 'form') {
        var origin = lodash.findWhere($scope.forms, {dataId: newNode.dataId});
        newNode.meta.exitUrl = origin.meta.exitUrl;
      }

      console.log(newNode);

      //
      // Set node id.
      //
      newNode.id = $scope.sId++;

      //
      // Calculate drop position.
      //
      var x = evt.x + $('.quiz-map').scrollLeft() - $('.quiz-map').offset().left - quizmap.nodeMinWidth / 2;
      var y = evt.y + $('.quiz-map').scrollTop() - $('.quiz-map').offset().top + quizmap.nodeHeight / 2;

      if (Math.abs(quizmap.mapHeight - y) < quizmap.nodeHeight) {
        quizmap.mapHeight += quizmap.incSize;
        $document[0].getElementById(quizmap.mapViewId).style.height = (quizmap.mapHeight) + "px";
      }
      if (Math.abs(quizmap.mapWidth - x) < quizmap.nodeWidth) {
        quizmap.mapWidth += quizmap.incSize;
        $document[0].getElementById(quizmap.mapViewId).style.width = (quizmap.mapWidth) + "px";
      }

      //
      // Set node position.
      //
      newNode.x = x;
      newNode.y = y;

      //
      // Add node to data model.
      //
      dataModel.nodes.push(newNode);

      //
      // Delete old model.
      //
      delete $scope.chartViewModel;

      //
      // Instantiate new view model.
      //
      $scope.chartViewModel = new quizmap.ChartViewModel(dataModel);
    };

    //
    // Code for the delete key.
    //
    var deleteKeyCode = 46;
    //
    // Code for control key.
    //
    var ctrlKeyCode = 17;

    //
    // Set to true when the ctrl key is down.
    //
    var ctrlDown = false;

    //
    // Code for A key.
    //
    var aKeyCode = 65;

    //
    // Code for esc key.
    //
    var escKeyCode = 27;

    //
    // code for backspace key.
    //
    var backspaceKeyCode = 8;

    //
    // Event handler for key-down on the quiz-map.
    //
    $scope.keyDown = function (evt) {
      if (evt.keyCode === ctrlKeyCode) {

        ctrlDown = true;
        evt.stopPropagation();
        evt.preventDefault();
      }

      if (evt.keyCode === backspaceKeyCode) {
        evt.preventDefault();
      }
    };

    //
    // Event handler for key-up on the quiz-map.
    //
    $scope.keyUp = function (evt) {
      if (evt.keyCode === deleteKeyCode || evt.keyCode === backspaceKeyCode) {
        //
        // Delete key.
        //
        $scope.chartViewModel.deleteSelected();
      }

      if (evt.keyCode == aKeyCode && ctrlDown) {
        //
        // Ctrl + A
        //
        $scope.chartViewModel.selectAll();
      }

      if (evt.keyCode == escKeyCode) {
        // Escape.
        $scope.chartViewModel.deselectAll();
      }

      if (evt.keyCode === ctrlKeyCode) {
        ctrlDown = false;

        evt.stopPropagation();
        evt.preventDefault();
      }
    };

    //
    // Event handler to set focus on quiz-map div element.
    //
    $scope.selectQuizMap = function () {
      $('#quiz-map').focus();
    };

    //
    // Search filter.
    //
    $scope.search = function (type) {
      switch (type) {
        case 'question':
          $scope.filteredQuestions = $scope.questions.filter(function (question) {
            return question.name.toLowerCase().indexOf($scope.keyword.searchQuestionKeywords.toLowerCase()) !== -1 || $scope.keyword.searchQuestionKeywords == '' ? true : false;
          });
          break;
        case 'resultsPage':
          $scope.filteredResultsPages = $scope.resultsPages.filter(function (resultsPage) {
            return resultsPage.name.toLowerCase().indexOf($scope.keyword.searchResultsPageKeywords.toLowerCase()) !== -1 || $scope.keyword.searchResultsPageKeywords == '' ? true : false;
          });
          break;
        case 'esp':
          $scope.filteredEsps = $scope.esps.filter(function (esp) {
            return esp.name.toLowerCase().indexOf($scope.keyword.searchEspKeywords.toLowerCase()) !== -1 || $scope.keyword.searchEspKeywords == '' ? true : false;
          });
          break;
        case 'startPage':
          $scope.filteredStartPages = $scope.startPages.filter(function (startPage) {
            return startPage.name.toLowerCase().indexOf($scope.keyword.searchStartPageKeywords.toLowerCase()) !== -1 || $scope.keyword.searchStartPageKeywords == '' ? true : false;
          });
          break;
        case 'form':
          $scope.filteredForms = $scope.forms.filter(function (form) {
            return form.name.toLowerCase().indexOf($scope.keyword.searchFormKeywords.toLowerCase()) !== -1 || $scope.keyword.searchFormKeywords == '' ? true : false;
          });
          break;
      }
    };

    //
    // Check form is valid or not.
    //
    $scope.canSubmit = function () {
      return $scope.form_quiz.$valid && (!angular.equals($scope.quiz, originalQuiz) || ($scope.chartViewModel && !angular.equals($scope.chartViewModel.data, originalChartDataModel)));
    };

    //
    // Prepare json data before submit.
    //
    var prepareSubmit = function () {
      var quiz = angular.copy($scope.quiz);

      quiz.chartDataModel = angular.copy($scope.chartViewModel.data);

      var connections = [];
      quiz.chartDataModel.connections.forEach(function (connection) {
        var newCon = {};
        newCon.source = {};
        newCon.source.nodeId = connection.source.nodeID;
        var node = lodash.findWhere(quiz.chartDataModel.nodes, {id: connection.source.nodeID});
        if (node.type == 'question') {
          newCon.source.connectorId = node.outputConnectors[connection.source.connectorIndex].dataId;
        }

        newCon.dest = {};
        newCon.dest.nodeId = connection.dest.nodeID;

        connections.push(newCon);
      });

      quiz.chartDataModel.connections = connections;

      quiz.chartDataModel.nodes.forEach(function (node) {
        delete node.inputConnectors;
        delete node.name;
//                if(node.type == 'result') {
        delete node.outputConnectors;
//                } else {
//                    node.outputConnectors.forEach(function(outputConnector) {
//                        if(outputConnector.dataId) {
//                            delete outputConnector.name;
//                            delete outputConnector.description;
//                        }
//                    });
//                }
      });

      quiz.user = Auth.getCurrentUser()._id;

      //if (quiz.startPage == '') {
      //  delete quiz.startPage;
      //}
      //if (quiz.form == '') {
      //  delete quiz.form;
      //}

      return quiz;
    };

    //
    // Send json request to server-side api in order to save or update quiz data.
    //
    $scope.save = function () {
      if ($scope.editable) {
        Quiz.update(prepareSubmit(), function (data) {
          $scope.quizzes.forEach(function (quiz) {
            if (quiz._id == data._id) {
              var index = $scope.quizzes.indexOf(quiz);
              $scope.quizzes[index] = data;
            }
          });
          $scope.$parent.search();
          $state.go('^');
        });
      } else {
        Quiz.save(prepareSubmit(), function (data) {
          console.log(data);
          $scope.quizzes.push(data);
          $scope.$parent.search();
          $state.go('^');
        });
      }
    };

    //
    // Cancel quiz edit.
    //
    $scope.cancel = function () {
      if (!angular.equals($scope.quiz, originalQuiz) || !angular.equals($scope.chartViewModel.data, originalChartDataModel)) {
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

    $scope.setExitUrl = function (data, type) {
      var dlg = dialogs.create('app/quizzes/exit-url.dialog.html', 'ExitUrlDialogCtrl', {exitUrl: data.meta.exitUrl}, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });

      dlg.result.then(function (url) {
        if (type == 'resultsPage') {
          var index = $scope.resultsPages.indexOf(data);
          $scope.resultsPages[index].meta.exitUrl = url;
          $scope.search('resultsPage');
        } else if (type == 'form') {
          var index = $scope.forms.indexOf(data);
          $scope.forms[index].meta.exitUrl = url;
          $scope.search('form');
        }
      });


    };

    //
    // Initialize controller
    //
    init();
  });
