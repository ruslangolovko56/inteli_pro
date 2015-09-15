'use strict';

angular.module('quizAppApp')
  .controller('AnswerFieldsAddDialogCtrl', function ($scope, $modalInstance, data, Field, lodash, dialogs) {
    $scope.formAnswer = {
      answers     : data.answers || [],
      answerFields: data.answerFields || []
    };
    var originalAnswers = angular.copy($scope.formAnswer.answers);

    /**
     * Return array with specific length
     * @param num
     * @returns {Array}
     */
    $scope.getNumber = function (num) {
      return new Array(num);
    };

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.dismiss();
    };

    $scope.save = function () {
      $modalInstance.close({answers: $scope.formAnswer.answers, answerFields: $scope.formAnswer.answerFields});
    };

    $scope.delete = function (field) {
      var index = $scope.formAnswer.answerFields.indexOf(field);
      $scope.formAnswer.answerFields.splice(index, 1);

      for (var i = 0; i < $scope.formAnswer.answers.length; i++) {
        $scope.formAnswer.answers[i].fields = $scope.formAnswer.answers[i].fields || {};
        delete $scope.formAnswer.answers[i].fields[field._id];
      }
    };

    $scope.edit = function (field) {
      var index = $scope.formAnswer.answerFields.indexOf(field);
      $scope.formAnswer.answerFields[index].editStatus = true;

      for (var i = 0; i < $scope.formAnswer.answers.length; i++) {
        $scope.formAnswer.answers[i].fields = $scope.formAnswer.answers[i].fields || {};
        $scope.formAnswer.answers[i].editingFields = $scope.formAnswer.answers[i].editingFields || {};
        $scope.formAnswer.answers[i].editingFields[field._id] = $scope.formAnswer.answers[i].fields[field._id];
      }
    };

    $scope.saveEdit = function (field) {
      var index = $scope.formAnswer.answerFields.indexOf(field);
      $scope.formAnswer.answerFields[index].editStatus = false;

      for (var i = 0; i < $scope.formAnswer.answers.length; i++) {
        $scope.formAnswer.answers[i].fields[field._id] = $scope.formAnswer.answers[i].editingFields[field._id];
        delete $scope.formAnswer.answers[i].editingFields[field._id];
      }
    };

    $scope.cancelEdit = function (field) {
      var index = $scope.formAnswer.answerFields.indexOf(field);
      $scope.formAnswer.answerFields[index].editStatus = false;

      for (var i = 0; i < $scope.formAnswer.answers.length; i++) {
        delete $scope.formAnswer.answers[i].editingFields[field._id];
      }
    };

    $scope.add = function () {
      Field.queryAnswer({id: 0}, function (data) {
        var dlg = dialogs.create('app/questions/custom-fields.add.dialog.html', 'AnswerCustomFieldsAddDialogCtrl', {
          selectedFields: $scope.formAnswer.answerFields,
          answerFields  : data
        }, {
          size    : 'lg',
          keyboard: true,
          backdrop: false
        });
        dlg.result.then(function (selectedFields) {
          //$scope.answers = lodash.map($scope.answers, function(answer) {
          //  answer.customFields = answer.customFields || [];
          //  answer.customFields.push(selectedFields);
          //  return answer;
          //  //lodash.forEach(selectedFields, function(field) {
          //  //  answer.customFields.push({
          //  //    field: field._id,
          //  //    value: ''
          //  //  });
          //  //});
          //});
          selectedFields.forEach(function (item) {
            $scope.formAnswer.answerFields.push(item);
          })
          //$scope.formAnswer.answerFields.concat(selectedFields);
        });
      });
    };

    $scope.canSubmit = function () {
      return !angular.equals(originalAnswers, $scope.formAnswer.answers);
    };

  })
  .controller('AnswerCustomFieldsAddDialogCtrl', function ($scope, $modalInstance, data, lodash, $filter) {
    $scope.formCustom = {
      answerFields        : data.answerFields || [],
      searchKeywords      : '',
      filteredAnswerFields: []
    };
    var selectedFields = data.selectedFields || [];

    /**
     * Initializer
     */
    var init = function () {
      selectedFields.forEach(function (field) {
        var s = lodash.find($scope.formCustom.answerFields, {_id: field._id});
        if (s) {
          $scope.formCustom.answerFields.splice($scope.formCustom.answerFields.indexOf(s), 1);
        }
      });

      $scope.search();
    };

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.dismiss();
    };

    /**
     * Add fields
     */
    $scope.add = function () {
      var result = lodash.filter($scope.formCustom.filteredAnswerFields, function (field) {
        if (field.isSelected === true) {
          return true;
        } else {
          return false;
        }
      });
      $modalInstance.close(result);
    };

    /**
     * Check if can submit
     * @returns {boolean}
     */
    $scope.canSubmit = function () {
      return lodash.find($scope.formCustom.filteredAnswerFields, {isSelected: true});
    };

    /**
     * Search custom fields
     *
     * @returns {*}
     */
    $scope.search = function () {
      $scope.formCustom.filteredAnswerFields = $filter('filter')($scope.formCustom.answerFields, $scope.formCustom.searchKeywords);
    };

    init();

  })
  .controller('QuestionsAddCtrl', function ($scope, $upload, $http, Question, Auth, $state, dialogs, $stateParams, question, lodash, answerFields) {

    //
    // Initializer.
    //
    var init,
        originalQuestion,
        originalAnswers;

    var questionPerType = {}
      , answersPerType = {}
      , answerFieldsPerType = {}
      , oldType;

    //
    // Initialize scope variables.
    //
    $scope.question = {};
    $scope.answers = [];
    $scope.editable = false;
    $scope.max = 100;
    $scope.types = [
      {
        id  : '1',
        text: 'Multiple choice'
      },
      {
        id  : '2',
        text: 'Text block'
      },
      {
        id  : '3',
        text: 'Text field'
      },
      {
        id  : '4',
        text: 'Number'
      }
    ];
    $scope.answerFields = [];

    //
    // Initialize function.
    //
    init = function () {
      if ($stateParams.id) {
        // Edit question state.
        $scope.editable = true;

        // Set up data for scope variables.
        $scope.question = angular.copy(question);
        if ($scope.question.attachment && $scope.question.attachment.location != '')
          $scope.question.status = "uploaded";
        else
          $scope.question.status = "";
        $scope.question.type = $scope.types.filter(function (type) {
          return type.id == $scope.question.type.id && type.text == $scope.question.type.text;
        })[0];
        delete $scope.question.answers;

        $scope.answers = angular.copy(question.answers);
        $scope.answers.forEach(function (answer) {
          //if (answer.enable == undefined){
          //  answer.enable = true;
          //}
          if (answer.attachment && answer.attachment.location != '')
            answer.status = "uploaded";
          else
            answer.status = "";
        });

        // Prepare answer fields
        var selectedAnswerFields = {};
        $scope.answers = lodash.map($scope.answers, function (answer) {
          var fields = {};
          answer.fields.forEach(function (field) {
            fields[field._id] = field.value;
            if (!selectedAnswerFields[field._id]) {
              selectedAnswerFields[field._id] = lodash.find(answerFields, {_id: field._id});
            }
          });
          answer.fields = fields;
          return answer;
        });

        for (var key in selectedAnswerFields) {
          if (selectedAnswerFields.hasOwnProperty(key)) {
            $scope.answerFields.push(selectedAnswerFields[key]);
          }
        }

        oldType = $scope.types[$scope.question.type.id - 1];
      } else {
        // Set up init value for scope variables.
        $scope.question = {
          attachment: {},
          text      : '',
          tags      : [],
          type      : null,
          status    : '',
          hasButton : false
        };

        $scope.answers = [
          {
            attachment: {},
            text      : '',
            status    : ''
          }
        ];

        oldType = $scope.types[0];
      }

      //
      // Set up data for original values to watch value change.
      //
      originalQuestion = angular.copy($scope.question);
      originalAnswers = angular.copy($scope.answers);
    };

    //
    // Add new answer.
    //
    $scope.addAnswer = function () {
      return $scope.answers.push({
        attachment: {},
        text      : '',
        status    : ''
      });
    };

    //
    // Validate submition data.
    //
    $scope.canSubmit = function () {
      return $scope.form_question.$valid && (!angular.equals($scope.question, originalQuestion) || !angular.equals($scope.answers, originalAnswers));
    };

    //
    // Prepare submition data.
    //
    var prepareSubmit = function () {
      var question = angular.copy($scope.question);

      delete question.status;

      var answers = angular.copy($scope.answers);
      answers = lodash.map(answers, function (answer) {
        delete answer.status;
        var fields = [];
        for (var key in answer.fields) {
          if (answer.fields.hasOwnProperty(key)) {
            fields.push({
              field: key,
              value: answer.fields[key]
            });
          }
        }
        answer.fields = fields;
        return answer;
      });

      question.answers = answers;

      question.user = Auth.getCurrentUser()._id;

      return question;
    };

    //
    // Save json data.
    //
    $scope.save = function () {
      if ($scope.editable) {
        Question.update(prepareSubmit(), function (data) {
          $scope.questions.forEach(function (question) {
            if (question._id == data._id) {
              var index = $scope.questions.indexOf(question);
              $scope.questions[index] = data;
            }
          });
          $scope.search();
          $state.go('^');
        });
      } else {
        Question.save(prepareSubmit(), function (data) {
          $scope.questions.push(data);
          $scope.search();
          $state.go('^');
        });
      }
    };

    //
    // Add new question.
    //
    $scope.addNew = function () {
      if ($scope.canSubmit()) {
        Question.save(prepareSubmit(), function (data) {
          $scope.questions.push(data);
          $scope.search();
          init();
          $scope.form_question.$setPristine();
        });
      } else if (!angular.equals($scope.question, originalQuestion) || !angular.equals($scope.answers, originalAnswers)) {
        var dlg = dialogs.confirm('Please confirm', 'You have not filled all fields. Are you sure to continue without saving data?');

        dlg.result.then(function (btn) {
          init();
          $scope.form_question.$setPristine();
        }, function (btn) {
          return;
        });
      } else {
        init();
      }

    };

    //
    // Cancel question.
    //
    $scope.cancel = function () {
      if (!angular.equals($scope.question, originalQuestion) || !angular.equals($scope.answers, originalAnswers)) {
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

    //
    // Close answer box.
    //
    $scope.close = function (index) {
      return $scope.answers.splice(index, 1);
    };

    //
    // Delete attachment.
    //
    $scope.deleteAttachment = function (type, index) {
      switch (type) {
        case 'question':
          $scope.question.attachment = {
            location: '',
            bucket  : '',
            key     : '',
            etag    : ''
          };
          $scope.question.status = '';
          break;
        case 'answer':
          $scope.answers[index].attachment = {
            location: '',
            bucket  : '',
            key     : '',
            etag    : ''
          };
          $scope.answers[index].status = '';
          break;
      }
    };

    //
    // Upload file.
    //
    $scope.onFileSelect = function ($files, index, type) {
      //
      // Should be single file.
      //
      if ($files.length > 1) return;

      var file = $files[0];
      (type == "question") ? $scope.question.status = "uploading" : $scope.answers[index].status = "uploading";

      var max = $scope.max;
      $scope.progress = parseInt(0);
      $scope.upload = null;

      //
      // Get S3 config data.
      //
      $http.get('/api/s3Policy/' + encodeURIComponent(file.type)).success(function (response) {
        var s3Params = response;

        //
        // Upload file to S3.
        //
        $scope.upload = $upload.upload({
          url    : 'https://' + s3Params.bucket + '.s3.amazonaws.com/',
          method : 'POST',
          data   : {
            'key'                  : 'upload/' + Math.round(Math.random() * 10000) + '$$' + file.name,
            'acl'                  : 'public-read',
            'Content-Type'         : file.type,
            'AWSAccessKeyId'       : s3Params.AWSAccessKeyId,
            'success_action_status': '201',
            'Policy'               : s3Params.s3Policy,
            'Signature'            : s3Params.s3Signature
          },
          file   : file,
          headers: {
            authorization: ''
          }
        });

        //
        // When uploaded.
        //
        $scope.upload
          .then(function (response) {
            $scope.progress = parseInt(max);
            if (response.status === 201) {
              var data = xml2json.parser(response.data),
                  parsedData;
              parsedData = {
                location: data.postresponse.location,
                bucket  : data.postresponse.bucket,
                key     : data.postresponse.key,
                etag    : data.postresponse.etag
              };
              //
              // Set up uploaded info to scope variables.
              //
              if (type == "question") {
                $scope.question.status = "uploaded";
                $scope.question.attachment = parsedData;
              } else {
                $scope.answers[index].status = "uploaded";
                $scope.answers[index].attachment = parsedData;
              }

            } else {
              alert('Upload Failed');
            }
          }, null, function (evt) {
            $scope.progress = parseInt(max * evt.loaded / evt.total);
          });
      });
    };

    $scope.addFields = function () {
      var dlg = dialogs.create('app/questions/answer-fields.add.dialog.html', 'AnswerFieldsAddDialogCtrl', {
        answers     : $scope.answers,
        answerFields: $scope.answerFields
      }, {
        size    : 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (data) {
        $scope.answers = angular.copy(data.answers);
        $scope.answerFields = angular.copy(data.answerFields);
        console.log($scope.answerFields);
      }, function () {
        return;
      });
    };

    /**
     * Method for when change question type to store question info.
     * @param type
     */
    $scope.changeType = function (type) {
      if (oldType) {
        answersPerType[oldType.id] = angular.copy($scope.answers);
        answerFieldsPerType[oldType.id] = angular.copy($scope.answerFields);
      }

      if (answersPerType[type.id]) {
        $scope.answers = answersPerType[type.id];
        $scope.answerFields = answerFieldsPerType[type.id];
      } else {
        $scope.answers = [
          {
            attachment: {},
            text      : '',
            status    : ''
          }
        ];
        $scope.answerFields = [];
      }

      oldType = type;
    }

    //
    // Call initialize function.
    //
    init();

  });

