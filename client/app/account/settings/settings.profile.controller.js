'use strict';

angular.module('quizAppApp')
  .controller('SettingsProfileCtrl', function ($scope, User, Auth, $state, user, $http, $upload) {
    $scope.errors = {};
    $scope.user = user;
    $scope.edit = {};
    $scope.max = 100;
    $scope.canUpload = true;

    var originalUser = angular.copy(user);

    /**
     * Action to update edit status on input fields.
     * @param field
     * @returns {boolean}
     */
    $scope.toggleEdit = function (field) {
      return $scope.edit[field] ? $scope.edit[field] = false : $scope.edit[field] = true;
    };

    /**
     * Form submit function when click update profile button.
     * @param form
     */
    $scope.updateProfile = function (form) {
      $scope.message = '';
      $scope.submitted = true;
      if ($scope.user.newPassword !== $scope.user.confirmPassword) {
        form.confirmPassword.$setValidity('mongoose', false);
        form.newPassword.$setValidity('mongoose', false);
        $scope.errors.password = "Password does not match";
      } else if (form.$valid) {
        Auth.updateProfile($scope.user.username, $scope.user.name, $scope.user.email, $scope.user.newPassword, $scope.user.photo)
          .then(function () {
            $scope.message = 'Profile successfully updated.';
            $scope.edit = {};
            $scope.errors = {};
            originalUser = angular.copy($scope.user);
          })
          .catch(function (err) {
            err = err.data;
            $scope.errors = {};

            // Update validity of form fields that match the mongoose errors
            angular.forEach(err.errors, function (error, field) {
              form[field].$setValidity('mongoose', false);
              $scope.errors[field] = error.message;
            });
          });
      }
    };

    /**
     * Action called when button upload profile photo is clicked
     * @param $files
     * @param index
     * @param type
     */
    $scope.onFileSelect = function ($files, index, type) {
      //
      // Should be single file.
      //
      if ($files.length > 1) return;

      var file = $files[0];

      var max = $scope.max;
      $scope.progress = parseInt(0);
      $scope.upload = null;

      //
      // Get S3 config data.
      //
      $http.get('/api/s3Policy/' + encodeURIComponent(file.type)).success(function (response) {
        var s3Params = response;
        $scope.canUpload = false;

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
        // When uploaded.
        //
        $scope.upload
          .then(function (response) {
            $scope.progress = parseInt(max);
            $scope.canUpload = true;
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
              // Set uploaded info to scope variables.
              //
              $scope.user.photo = parsedData;

            } else {
              alert('Upload Failed');
            }
          }, null, function (evt) {
            $scope.progress = parseInt(max * evt.loaded / evt.total);
          });
      });
    };

    /**
     * Get photo url
     * @returns {*}
     */
    $scope.getPhotoUrl = function () {
      if (!$scope.user.photo) {
        return "assets/images/dummy_avatar.png";
      } else {
        return user.photo.location;
      }
    };

    /**
     * Check the validity of form to submit.
     * @returns {*|boolean}
     */
    $scope.canSubmit = function () {
      return $scope.form.$valid && !angular.equals($scope.user, originalUser);
    };
  });

