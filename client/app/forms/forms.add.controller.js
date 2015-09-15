'use strict';

angular.module('quizAppApp')
  .controller('AddFormFieldsDialogCtrl', function ($scope, $modalInstance, data, $cookieStore, $http, lodash) {
    /**
     * scope variables
     */
    $scope.form = {
      fields: data.fields,
      selected: []
    };

    lodash.forEach(data.selected, function(field) {
      var f = lodash.findWhere($scope.form.fields, {_id: field._id});
      $scope.form.selected.push(f);
    });

    $scope.settings = {
      bootstrap2: false,
      filterClear: 'Show All',
      filterPlaceHolder: 'Search',
      moveSelectedLabel: 'Move selected only',
      moveAllLabel: 'Move all!',
      removeSelectedLabel: 'Remove selected only',
      removeAllLabel: 'Remove all!',
      moveOnSelect: true,
      preserveSelection: 'moved',
      selectedListLabel: 'Selected',
      nonSelectedListLabel: 'Available',
      postfix: '_helperz',
      selectMinHeight: 130,
      filter: true,
      filterNonSelected: '',
      filterSelected: '',
      infoAll: ' ',
      infoFiltered: ' ',
      infoEmpty: ' ',
      filterValues: false
    };

    /**
     * Add button handler
     */
    $scope.add = function () {
      $modalInstance.close($scope.form.selected);
    };

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.dismiss();
    };

  })
  .controller('FormsAddCtrl', function ($scope, $upload, $http, OptInForm, Auth, $state, dialogs, $stateParams, form, fields, lodash) {
    //
    // Initializer.
    //
    var init,
      originalForm;

    //
    // Initialize scope variables.
    //
    $scope.form = {};
    $scope.editable = false;
    $scope.max = 100;
    $scope.formFields = [];
    $scope.fields = fields;

    //
    // Initialize function.
    //
    init = function () {
      if ($stateParams.id) {

        //
        // Edit status.
        //
        $scope.editable = true;

        //
        // form detail.
        //
        $scope.form = form;
        if ($scope.form.attachment)
          $scope.form.status = 'uploaded';
        else
          $scope.form.status = '';

        $scope.form.fields = lodash.map($scope.form.fields, function(field) {
          if(field.visible || field.category == 'system') {
            field.statusLabel = field.label + ' (visible)';
          } else {
            field.statusLabel = field.label + ' (hidden)';
            if(field.category == 'form') {
              field.statusLabel = field.statusLabel + ' (' + field.param + ')';
            }
          }
          return field;
        });
      } else {
        //
        // Set up init value for scope variables.
        //
        $scope.form = {
          attachment: {},
          text: '',
          tags: [],
          title: '',
          buttonText: '',
          fields: [],
          status: ''
        };
      }

      originalForm = angular.copy($scope.form);

      $scope.fields = lodash.map($scope.fields, function(field) {
        if(field.visible || field.category == 'system') {
          field.statusLabel = field.label + ' (visible)';
        } else {
          field.statusLabel = field.label + ' (hidden)';
          if(field.category == 'form') {
            field.statusLabel = field.statusLabel + ' (' + field.param + ')';
          }
        }
        return field;
      });
    };

    //
    // Validate submit data.
    //
    $scope.canSubmit = function () {
      return $scope.form_opt.$valid && !angular.equals($scope.form, originalForm);
    };

    //
    // Prepare submit data.
    //
    var  prepareSubmit = function () {
      var form = angular.copy($scope.form);

      delete form.status;

      form.user = Auth.getCurrentUser()._id;

      form.fields = lodash.map($scope.form.fields, function(field) {
        return field._id;
      })

      return form;
    };

    //
    // Save data.
    //
    $scope.save = function () {
      if ($scope.editable) {
        //
        // Save edit.
        //
        OptInForm.update(prepareSubmit(), function (data) {
          $scope.forms.forEach(function (form) {
            if (form._id == data._id) {
              var index = $scope.forms.indexOf(form);
              $scope.forms[index] = data;
            }
          });
          $scope.search();
          $state.go('^');
        });
      } else {
        //
        // Save new form.
        //
        OptInForm.save(prepareSubmit(), function (data) {
          $scope.forms.push(data);
          $scope.search();
          $state.go('^');
        });
      }
    };

    //
    // Add new form.
    //
    $scope.addNew = function () {
      if ($scope.canSubmit()) {
        //
        // Save before add new form.
        //
        OptInForm.save(prepareSubmit(), function (data) {
          $scope.forms.push(data);
          $scope.search();
          init();
          $scope.form_opt.$setPristine();
        });
      } else if (!angular.equals($scope.form, originalForm)) {
        //
        // Alert confirmation.
        //
        var dlg = dialogs.confirm('Please confirm', 'You have not filled all fields. Are you sure to continue without saving data?');

        dlg.result.then(function (btn) {
          init();
          $scope.form_opt.$setPristine();
        }, function (btn) {
          return;
        });
      } else {
        init();
      }
    };

    //
    // Cancel.
    //
    $scope.cancel = function () {
      if (!angular.equals($scope.form, originalForm)) {
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
    // Delete attachment.
    //
    $scope.deleteAttachment = function () {
      $scope.form.attachment = null;
      $scope.form.status = '';
    };

    //
    // Upload file.
    //
    $scope.onFileSelect = function ($files) {
      //
      // Only single file is allowed.
      //
      if ($files.length > 1) return;

      var file = $files[0];
      $scope.form.status = "uploading";

      var max = $scope.max;
      $scope.progress = parseInt(0);
      $scope.upload = null;

      //
      // Get S3 config info.
      //
      $http.get('/api/s3Policy/' + encodeURIComponent(file.type)).success(function (response) {
        var s3Params = response;

        //
        // Upload file to S3.
        //
        $scope.upload = $upload.upload({
          url: 'https://' + s3Params.bucket + '.s3.amazonaws.com/',
          method: 'POST',
          data: {
            'key': 'upload/' + Math.round(Math.random() * 10000) + '$$' + file.name,
            'acl': 'public-read',
            'Content-Type': file.type,
            'AWSAccessKeyId': s3Params.AWSAccessKeyId,
            'success_action_status': '201',
            'Policy': s3Params.s3Policy,
            'Signature': s3Params.s3Signature
          },
          file: file,
          headers: {
            authorization: ''
          }
        });

        //
        // When success in upload.
        //
        $scope.upload
          .then(function (response) {
            $scope.progress = parseInt(max);
            if (response.status === 201) {
              var data = xml2json.parser(response.data),
                parsedData;
              parsedData = {
                location: data.postresponse.location,
                bucket: data.postresponse.bucket,
                key: data.postresponse.key,
                etag: data.postresponse.etag
              };

              //
              // Set upload data to scope variable.
              //
              $scope.form.status = "uploaded";
              $scope.form.attachment = parsedData;

            } else {
              alert('Upload Failed');
            }
          }, null, function (evt) {
            $scope.progress = parseInt(max * evt.loaded / evt.total);
          });
      });
    };

    $scope.addFields = function () {
      var dlg = dialogs.create('app/forms/add-fields.dialog.html', 'AddFormFieldsDialogCtrl', {
        fields: $scope.fields,
        selected: $scope.form.fields
      }, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (selectedFields) {
        $scope.form.fields = selectedFields;
      }, function () {
      });
    };

    //
    // Call initialize function.
    //
    init();

  });

