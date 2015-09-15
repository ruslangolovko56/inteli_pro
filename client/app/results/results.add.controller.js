'use strict';

angular.module('quizAppApp')
    .controller('ResultsAddCtrl', function ($scope, $upload, $http, Result, result, Auth, $state, dialogs, $stateParams) {

        //
        // Initializer.
        //
        var init,
            originalResult;

        //
        // Initialize scope variables.
        //
        $scope.result = {};
        $scope.editable = false;
        $scope.max = 100;

        //
        // Initialize function.
        //
        init = function () {
            if ($stateParams.id) {
                //
                // Edit status.
                //
                $scope.editable = true;

                $scope.result = angular.copy(result);
                if ($scope.result.attachment)
                    $scope.result.status = "uploaded";
                else
                    $scope.result.status = "";
            } else {
                //
                // Initialize result.
                //
                $scope.result = {
                    attachment: {},
                    description: '',
                    tags: [],
                    title: '',
                    status: ''
                };
            }

            originalResult = angular.copy($scope.result);
        };

        //
        // Validate submit data.
        //
        $scope.canSubmit = function () {
            return $scope.form_result.$valid && !angular.equals($scope.result, originalResult);
        };

        //
        // Prepare submit data.
        //
        var prepareSubmit = function () {
            var result = angular.copy($scope.result);

            delete result.status;

            result.user = Auth.getCurrentUser()._id;

            return result;
        };

        //
        // Save data.
        //
        $scope.save = function () {
            if ($scope.editable) {
                //
                // Save edit.
                //
                Result.update(prepareSubmit(), function (data) {
                    $scope.results.forEach(function (result) {
                        if (result._id == data._id) {
                            var index = $scope.results.indexOf(result);
                            $scope.results[index] = data;
                        }
                    });
                    $scope.search();
                    $state.go('^');
                });
            } else {
                //
                // Save new result.
                //
                Result.save(prepareSubmit(), function (data) {
                    $scope.results.push(data);
                    $scope.search();
                    $state.go('^');
                });
            }
        };

        //
        // Add new result.
        //
        $scope.addNew = function () {
            if ($scope.canSubmit()) {
                //
                // Save before add new result.
                //
                Result.save(prepareSubmit(), function (data) {
                    $scope.results.push(data);
                    $scope.search();
                    init();
                    $scope.form_result.$setPristine();
                });
            } else if (!angular.equals($scope.result, originalResult)) {
                //
                // Alert confirmation.
                //
                var dlg = dialogs.confirm('Please confirm', 'You have not filled all fields. Are you sure to continue without saving data?');

                dlg.result.then(function (btn) {
                    init();
                    $scope.form_result.$setPristine();
                }, function (btn) {
                    return;
                });
            } else {
                init();
            }

        };

        //
        // Cancel result.
        //
        $scope.cancel = function () {
            if (!angular.equals($scope.result, originalResult)) {
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
            $scope.result.attachment = null;
            $scope.result.status = '';
        };

        //
        // Upload file.
        //
        $scope.onFileSelect = function ($files, index) {
            //
            // Only single file is allowed.
            //
            if ($files.length > 1) return;

            var file = $files[0];
            $scope.result.status = "uploading";

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
                            $scope.result.status = "uploaded";
                            $scope.result.attachment = parsedData;

                        } else {
                            alert('Upload Failed');
                        }
                    }, null, function (evt) {
                        $scope.progress = parseInt(max * evt.loaded / evt.total);
                    });
            });
        };

        //
        // Call initialize function.
        //
        init();

    });

