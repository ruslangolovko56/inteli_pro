'use strict';

angular.module('quizAppApp')
  .controller('EspConnectionDialogCtrl', function ($scope, $modalInstance, data, Esp, $cookieStore, $http, lodash, $sce) {
    $scope.esp = data.esp;
    $scope.api = {};
    $scope.esp.authUrl = data.info.url;

    /**
     *
     * @param src
     * @returns {*}
     */
    $scope.trustSrc = function (src) {
      return $sce.trustAsResourceUrl(src);
    }

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.close();
    };
  })
  .controller('FieldMappingDialogCtrl', function ($scope, $modalInstance, data, Esp, $cookieStore, $http, lodash, dialogs) {
    /**
     * Scope variables
     */
    $scope.esp = data.esp;
    $scope.fields = data.quizFields.map(function (field) {
      field.mappedField = {};
      return field;
    });
    var emptyFields = angular.copy($scope.fields);
    $scope.espFields = data.espFields;
    $scope.form = {
      list : null,
      error: '',
      msg  : 'Drag the fields into the empty field in the table to match fields.'
    };
    $scope.current = {
      list: null
    };

    $scope.closeErrorAlert = function () {
      $scope.form.error = '';
    };

    $scope.closeInfoAlert = function () {
      $scope.form.msg = '';
    };

    /**
     * Process field mapping data to display
     *
     */
    $scope.mappedFields = {};
    data.fieldMappings.forEach(function (mapping) {

      var list = lodash.findWhere($scope.espFields, function (f) {
        return f.listId == mapping.list.id;
      });

      if (list) {

        var fields = lodash.map(angular.copy(emptyFields), function (item) {
          var f = lodash.findWhere(mapping.fields, {field: item._id});
          if (f) {
            item.mappedField = {
              id       : f.mapTo.id,
              fieldName: f.mapTo.name,
              fieldType: f.mapTo.type,
              required : f.mapTo.required
            }
          } else {
            item.mappedField = {};
          }
          return item;
        });

        fields = lodash.remove(fields, function (field) {
          return lodash.findWhere(list.fields, function (f) {
            return !(field.mappedField && f.id == field.mappedField.id);
          });
        });

        list.fields = lodash.remove(list.fields, function (field) {
          return !(lodash.findWhere(fields, function (f) {
            return (f.mappedField && f.mappedField.id == field.id);
          }));
        });

        $scope.mappedFields[mapping.list.id] = {
          'fields': angular.copy(fields),
          'list'  : angular.copy(list)
        };

      }

    });

    console.log($scope.mappedFields);

    var originalMappedFields = angular.copy($scope.mappedFields);
    var originalFields = angular.copy($scope.fields);

    var acFormSubmitted = false;

    /**
     * Update fields upon a selection of list
     */
    $scope.updateEspFields = function () {

      if ($scope.current.list !== null) {
        if (angular.equals($scope.fields, emptyFields)) {
          delete $scope.mappedFields[$scope.current.list.listId];
        } else {
          $scope.mappedFields[$scope.current.list.listId] = {
            'fields': angular.copy($scope.fields),
            'list'  : angular.copy($scope.current.list)
          };
        }
      }

      if ($scope.mappedFields[$scope.form.list.listId]) {
        $scope.fields = angular.copy($scope.mappedFields[$scope.form.list.listId].fields);
        $scope.current.list = angular.copy($scope.mappedFields[$scope.form.list.listId].list);
      } else {
        $scope.fields = angular.copy(emptyFields);
        $scope.current.list = angular.copy($scope.form.list);
      }

      originalFields = angular.copy($scope.fields);
    };

    /**
     * Check submit status
     *
     * @returns {boolean}
     */
    $scope.canSubmit = function () {
      return !angular.equals(originalMappedFields, $scope.mappedFields) || !angular.equals(originalFields, $scope.fields);
    };

    /**
     * Save mapping result
     *
     */
    $scope.save = function () {

      $scope.form.error = '';

      if (!angular.equals($scope.fields, emptyFields)) {
        $scope.mappedFields[$scope.current.list.listId] = {
          'fields': angular.copy($scope.fields),
          'list'  : angular.copy($scope.current.list)
        };
      } else {
        delete $scope.mappedFields[$scope.current.list.listId];
      }

      console.log($scope.mappedFields);

      // Process data before save
      var data = angular.copy($scope.mappedFields);
      var req = [];

      for (var key in data) {
        if (data.hasOwnProperty(key)) {

          var field = data[key];

          console.log(field.list.fields);
          var required = lodash.find(field.list.fields, function (f) {
            return f.required;
          });
          if (required) {
            return $scope.form.error = 'All required ESP form fields should be mapped.';
          }

          field.listId = field.list.listId;
          field.listName = field.list.listName;
          delete field.list;

          field.fields = lodash.remove(field.fields, function (f) {
            return f.mappedField && !angular.equals(f.mappedField, {});
          });

          field.fields = lodash.map(field.fields, function (f) {
            var newField = {};
            newField.field = f._id;
            newField.mapTo = {
              id      : f.mappedField.id,
              name    : f.mappedField.fieldName,
              type    : f.mappedField.fieldType,
              required: f.mappedField.required
            };
            return newField;
          });

          req.push(field);
        }
      }

      // Save data
      Esp.saveMapping({id: $scope.esp._id}, {fieldSets: req}, function () {
        $modalInstance.dismiss();
      });
    };

    /**
     * Close button event handler
     */
    $scope.close = function () {
      $modalInstance.dismiss();
    };

    /**
     * Select all fields
     */
    $scope.selectAll = function () {
      if ($scope.current.list !== null) {
        $scope.fields = lodash.map($scope.fields, function (field) {
          if (!field.mappedField || angular.equals(field.mappedField, {})) {
            field.isSelected = $scope.isSelectedAll;
          }
          return field;
        });
      }
    };

    /**
     * Check if autocreate form is ready
     * @returns {*|boolean}
     */
    $scope.canAutocreate = function () {
      return lodash.find($scope.fields, {isSelected: true}) && $scope.current.list !== null && !acFormSubmitted;
    };

    /**
     * Autocreate unmapped fields
     */
    $scope.autocreate = function () {
      $scope.form.error = '';

      if ($scope.canAutocreate()) {
        acFormSubmitted = true;

        var fields = [];
        lodash.forEach($scope.fields, function (field) {
          if (field.isSelected) {
            fields.push(field._id);
          }
        });

        Esp.createFields({id: $scope.esp._id}, {
          prefix: $scope.form.prefix,
          fields: fields,
          list  : {
            listId: $scope.current.list.listId,
            listName: $scope.current.list.listName
          }
        }, function (fields) {
          fields.forEach(function (field) {
            var f = lodash.find($scope.fields, {_id: field._id});
            var index = $scope.fields.indexOf(f);
            $scope.fields[index].mappedField = field.mappedField;
            delete $scope.fields[index].isSelected;
          });
          acFormSubmitted = false;
        }, function (err) {
          $scope.form.error = err.data;
          acFormSubmitted = false;
        });
      }
    };

    $scope.onDragStart = function (event, ui, field) {
      var index = $scope.fields.indexOf(field);
      if ($scope.fields[index].isSelected)
        delete $scope.fields[index].isSelected;
    };

    $scope.onDrop = function(event, ui, field) {
      var index = $scope.fields.indexOf(field);
      if ($scope.fields[index].isSelected)
        delete $scope.fields[index].isSelected;
    }

  })
  .controller('SettingsLeadCollectionCtrl', function ($scope, User, Auth, $state, $http, $upload, esps, dialogs, Esp, Field, $rootScope) {
    $scope.esps = esps;

    /**
     * Open connection window to test and save given ESP connection
     * @param espId
     */
    $scope.setConnection = function (esp) {
      var dlg = dialogs.wait('Wait for a moment', '', 100, {});

      Esp.authenticate(esp, function (data) {
        $rootScope.$broadcast('dialogs.wait.complete');

        var dlg = dialogs.create('app/account/settings/settings.lead-collection.connection.dialog.html', 'EspConnectionDialogCtrl', {
          esp : esp,
          info: data
        }, {
          size    : 'lg',
          keyboard: true,
          backdrop: false
        });
        dlg.result.then(function () {
          Esp.select({id: esp._id}, function (result) {
            var index = $scope.esps.indexOf(esp);
            $scope.esps.splice(index, 1, result);
          });
        }, function () {
        });
      }, function (err) {
        $rootScope.$broadcast('dialogs.wait.complete');
      });
    };

    /**
     *  Close the connection
     */
    $scope.cancelConnection = function (esp) {
      var espId = esp._id;
      Esp.cancelConnection({id: esp._id}, function (result) {
        if (result.result == 'success') {
          for (var i = 0; i < esps.length; i++) {
            if (esps[i]._id == espId) {
              delete esps[i].connection;
            }
          }
          console.log("Connection Closed!");
        }
      });

    };

    /**
     * Map custom fields to esp fields
     * @param esp
     */
    $scope.mapFields = function (esp) {
      var dlg = dialogs.wait('Wait for a moment', '', 100, {});

      Field.query(function (quizFields) {
        Esp.queryFields({id: esp._id}, function (espFields) {
          Esp.queryMapping({id: esp._id}, function (mappings) {
            $rootScope.$broadcast('dialogs.wait.complete');

            var dlg = dialogs.create('app/account/settings/settings.lead-collection.field-mapping.dialog.html', 'FieldMappingDialogCtrl', {
              esp          : esp,
              quizFields   : quizFields,
              espFields    : espFields,
              fieldMappings: mappings
            }, {
              size    : 'lg',
              keyboard: true,
              backdrop: false
            });
            dlg.result.then(function () {
            }, function () {
            });
          }, function (err) {
            $rootScope.$broadcast('dialogs.wait.complete');
          });
        }, function (err) {
          $rootScope.$broadcast('dialogs.wait.complete');
        });
      }, function (err) {
        $rootScope.$broadcast('dialogs.wait.complete');
      });
    };

    /**
     * Check user authenticated corresponding esp
     * @param esp
     * @returns {boolean}
     */
    $scope.isAuthenticated = function (esp) {
      if (esp.connection) {
        return true;
      } else {
        return false;
      }
    }
  });


