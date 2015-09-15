'use strict';

angular.module('quizAppApp')
  .controller('FieldsAddDialogCtrl', function ($scope, $modalInstance, data, Field, $cookieStore, $http, lodash, $sce) {
    /**
     * Scope variables
     */
    $scope.editable = (!data.field) ? false : true;
    $scope.category = data.category || data.field.category;
    $scope.field = data.field || {};
    $scope.field.visible = $scope.field.visible != undefined && $scope.field.visible != null ? $scope.field.visible : ( $scope.category == 'answer' ? false : true );
    $scope.field.required = $scope.field.required != undefined && $scope.field.required != null ? $scope.field.required : false;
    var originalField = angular.copy($scope.field);

    /**
     * field types
     */
    $scope.types = data.types;

    /**
     *
     * @param src
     * @returns {*}
     */
    $scope.trustSrc = function (src) {
      return $sce.trustAsResourceUrl(src);
    };

    /**
     * Check form submit status
     *
     * @param form
     * @returns {*|boolean}
     */
    $scope.canSubmit = function (form) {
      return form.$valid && !angular.equals($scope.field, originalField);
    };

    /**
     * Create new custom field
     */
    $scope.create = function (form) {
      $scope.submitted = true;
      $scope.field.category = data.category;
      Field.save($scope.field, function (data) {
        return $modalInstance.close(data);
      }, function (err) {
        err = err.data;
        $scope.errors = {};
        lodash.forEach(err.errors, function (error, field) {
          form[field].$setValidity('mongoose', false);
          $scope.errors[field] = error.message;
        });
      });
    };

    /**
     * Update custom field
     */
    $scope.save = function (form) {
      Field.update($scope.field, function (data) {
        return $modalInstance.close(data);
      }, function (err) {
        err = err.data;
        $scope.errors = {};
        lodash.forEach(err.errors, function (error, field) {
          form[field].$setValidity('mongoose', false);
          $scope.errors[field] = error.message;
        });
      })
    };

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.dismiss();
    };
  })
  .controller('SettingsFieldsCtrl', function ($scope) {

  })
  .controller('SettingsSystemFieldsCtrl', function ($scope, systemFields, fieldTypes, dialogs, $filter, Field) {
    $scope.systemFields = systemFields;

    // Order by column.
    $scope.orderSystemFields = function (rowName) {
      if ($scope.rowSystem === rowName) {
        return;
      }
      $scope.rowSystem = rowName;
      $scope.systemFields = $filter('orderBy')($scope.systemFields, rowName);
    };

    // Order by column.
    $scope.orderCustomFields = function (rowName) {
      if ($scope.rowCustom === rowName) {
        return;
      }
      $scope.rowCustom = rowName;
      $scope.customFields = $filter('orderBy')($scope.customFields, rowName);
    };

    // Add new system field
    $scope.add = function () {
      var dlg = dialogs.create('app/account/settings/settings.form-fields.add.dialog.html', 'FieldsAddDialogCtrl', {types: fieldTypes, category: 'system'}, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (newField) {
        newField.removable = true;
        newField.editable = true;
        $scope.systemFields.push(newField);
      }, function () {
        return;
      });
    };

    // Edit system field
    $scope.edit = function (field) {
      var dlg = dialogs.create('app/account/settings/settings.system-fields.add.dialog.html', 'FieldsAddDialogCtrl', {
        field: field,
        types: fieldTypes
      }, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (updatedField) {
        var index = $scope.systemFields.indexOf(field);
        $scope.systemFields[index] = updatedField;
      }, function () {
        return;
      });
    };

    // Delete system field
    $scope.delete = function (field) {
      var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this system field?');

      dlg.result.then(function () {
        Field.delete({id: field._id}, function () {
          var index = $scope.systemFields.indexOf(field);
          $scope.systemFields.splice(index, 1);
        });
      }, function () {
        return;
      });
    }

    $scope.isEditable = function (field) {
      return field.editable;
    };

    $scope.isRemovable = function (field) {
      return field.removable;
    };

  })
  .controller('SettingsFormFieldsCtrl', function ($scope, formFields, fieldTypes, dialogs, $filter, Field) {
    $scope.formFields = formFields;

    // Order by column.
    $scope.orderSystemFields = function (rowName) {
      if ($scope.rowSystem === rowName) {
        return;
      }
      $scope.rowSystem = rowName;
      $scope.systemFields = $filter('orderBy')($scope.systemFields, rowName);
    };

    // Order by column.
    $scope.orderCustomFields = function (rowName) {
      if ($scope.rowCustom === rowName) {
        return;
      }
      $scope.rowCustom = rowName;
      $scope.formFields = $filter('orderBy')($scope.formFields, rowName);
    };

    // Add new custom field
    $scope.add = function () {
      var dlg = dialogs.create('app/account/settings/settings.form-fields.add.dialog.html', 'FieldsAddDialogCtrl', {types: fieldTypes, category: 'form'}, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (newField) {
        newField.removable = true;
        newField.editable = true;
        $scope.formFields.push(newField);
      }, function () {
        return;
      });
    };

    // Edit custom field
    $scope.edit = function (field) {
      var dlg = dialogs.create('app/account/settings/settings.form-fields.add.dialog.html', 'FieldsAddDialogCtrl', {
        field: field,
        types: fieldTypes
      }, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (updatedField) {
        var index = $scope.formFields.indexOf(field);
        $scope.formFields[index] = updatedField;
      }, function () {
        return;
      });
    };

    // Delete custom field
    $scope.delete = function (field) {
      var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this custom field?');

      dlg.result.then(function () {
        Field.delete({id: field._id}, function () {
          var index = $scope.formFields.indexOf(field);
          $scope.formFields.splice(index, 1);
        });
      }, function () {
        return;
      });
    }

    $scope.isEditable = function (field) {
      return field.editable;
    };

    $scope.isRemovable = function (field) {
      return field.removable;
    };
  })
  .controller('SettingsAnswerFieldsCtrl', function ($scope, answerFields, fieldTypes, dialogs, $filter, Field) {
    $scope.answerFields = answerFields;

    // Order by column.
    $scope.orderSystemFields = function (rowName) {
      if ($scope.rowSystem === rowName) {
        return;
      }
      $scope.rowSystem = rowName;
      $scope.systemFields = $filter('orderBy')($scope.systemFields, rowName);
    };

    // Order by column.
    $scope.orderCustomFields = function (rowName) {
      if ($scope.rowCustom === rowName) {
        return;
      }
      $scope.rowCustom = rowName;
      $scope.answerFields = $filter('orderBy')($scope.answerFields, rowName);
    };

    // Add new custom field
    $scope.add = function () {
      var dlg = dialogs.create('app/account/settings/settings.form-fields.add.dialog.html', 'FieldsAddDialogCtrl', {types: fieldTypes, category: 'answer'}, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (newField) {
        newField.removable = true;
        newField.editable = true;
        $scope.answerFields.push(newField);
      }, function () {
        return;
      });
    };

    // Edit custom field
    $scope.edit = function (field) {
      var dlg = dialogs.create('app/account/settings/settings.form-fields.add.dialog.html', 'FieldsAddDialogCtrl', {
        field: field,
        types: fieldTypes
      }, {
        size: 'lg',
        keyboard: true,
        backdrop: false
      });
      dlg.result.then(function (updatedField) {
        var index = $scope.answerFields.indexOf(field);
        $scope.answerFields[index] = updatedField;
      }, function () {
        return;
      });
    };

    // Delete custom field
    $scope.delete = function (field) {
      var dlg = dialogs.confirm('Please confirm', 'Are you sure you wanna delete this custom field?');

      dlg.result.then(function () {
        Field.delete({id: field._id}, function () {
          var index = $scope.answerFields.indexOf(field);
          $scope.answerFields.splice(index, 1);
        });
      }, function () {
        return;
      });
    }

    $scope.isEditable = function (field) {
      return field.editable;
    };

    $scope.isRemovable = function (field) {
      return field.removable;
    };
  });


