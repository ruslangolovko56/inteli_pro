'use strict';

angular.module('quizAppApp')
    .controller('StartPagesAddCtrl', function ($scope, $upload, $http, StartPage, startPage, Auth, $state, dialogs, $stateParams) {
        //
        // Initializer.
        //
        var init;
        var originalStartPage;

        //
        // Initialize scope variables.
        //
        $scope.startPage = {};
        $scope.editable = false;
        $scope.max = 100;

        //
        // Initialize function.
        //
        init = function () {
            if ($stateParams.id) {
                //
                // Edit start page state.
                //
                $scope.editable = true;

                //
                // Get start page json data.
                //
                $scope.startPage = angular.copy(startPage);
                if ($scope.startPage.attachment)
                    $scope.startPage.status = "uploaded";
                else
                    $scope.startPage.status = "";
            } else {
                //
                // Set up init value for scope variables.
                //
                $scope.startPage = {
                    attachment: {},
                    instruction: '',
                    tags: [],
                    title: '',
                    buttonText: '',
                    status: ''
                };
            }

            originalStartPage = angular.copy($scope.startPage);
        };

        //
        // Validate submit data.
        //
        $scope.canSubmit = function () {
            return $scope.form_startpage.$valid && !angular.equals($scope.startPage, originalStartPage);
        };

        //
        // Prepare submit data.
        //
        var prepareSubmit = function () {
            var startPage = angular.copy($scope.startPage);

            delete startPage.status;

            startPage.user = Auth.getCurrentUser()._id;

            return startPage;
        };

        //
        // Save data.
        //
        $scope.save = function () {
            if ($scope.editable) {
                //
                // Save edit.
                //
                StartPage.update(prepareSubmit(), function (data) {
                    $scope.startPages.forEach(function (startPage) {
                        if (startPage._id == data._id) {
                            var index = $scope.startPages.indexOf(startPage);
                            $scope.startPages[index] = data;
                        }
                    });
                    $scope.search();
                    $state.go('^');
                });
            } else {
                //
                // Save new start page.
                //
                StartPage.save(prepareSubmit(), function (data) {
                    $scope.startPages.push(data);
                    $scope.search();
                    $state.go('^');
                });
            }
        };

        //
        // Add new start pages.
        //
        $scope.addNew = function () {
            if ($scope.canSubmit()) {
                //
                // Save before add new start page.
                //
                StartPage.save(prepareSubmit(), function (data) {
                    $scope.startPages.push(data);
                    $scope.search();
                    init();
                    $scope.form_startpage.$setPristine();
                });
            } else if (!angular.equals($scope.startPage, originalStartPage)) {
                //
                // Alert confirmation.
                //
                var dlg = dialogs.confirm('Please confirm', 'You have not filled all fields. Are you sure to continue without saving data?');

                dlg.result.then(function (btn) {
                    init();
                    $scope.form_startpage.$setPristine();
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
            if (!angular.equals($scope.startPage, originalStartPage)) {
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
            $scope.startPage.attachment = null;
            $scope.startPage.status = '';
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
            $scope.startPage.status = "uploading";

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
                            $scope.startPage.status = "uploaded";
                            $scope.startPage.attachment = parsedData;

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

