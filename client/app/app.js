'use strict';

angular.module('quizAppApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'ngDraggable',
  'angularFileUpload',
  'ngTagsInput',
  'dialogs.main',
  'dialogs.default-translations',
  'ngLodash',
  'ngClipboard',
  'ngDragDrop',
  'frapontillo.bootstrap-duallistbox',
  'bgf.paginateAnything',
  'textAngular',
  'ui.sortable',
  'ngCsv',
  'DWand.nw-fileDialog'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');
  })
  .config(['ngClipProvider', function (ngClipProvider) {
    ngClipProvider.setPath("bower_components/zeroclipboard/dist/ZeroClipboard.swf");
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }])
  .config(function ($provide) {
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', 'taTranslations', 'dialogs', 'fileDialog', 'Field', function (taRegisterTool, taOptions, taTranslations, dialogs, fileDialog, Field) {
      // $delegate is the taOptions we are decorating
      // register the tool with textAngular
      taRegisterTool('insertCopyright', {
        buttontext: 'Add Fields',
        iconclass: 'btn btn-info',
        display: '<button class="btn btn-info">Add Fields</button>',
        tooltiptext: 'Add Fields',
        action: function ($deferred) {
          function insertTextAtCursor(text) {
            var sel, range;
            if (window.getSelection) {
              sel = window.getSelection();
              if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
              }
            } else if (document.selection && document.selection.createRange) {
              document.selection.createRange().text = text;
            }
          }

          function moveCaret(charCount) {
            var sel, range;
            if (window.getSelection) {
              sel = window.getSelection();
              if (sel.rangeCount > 0) {
                var textNode = sel.focusNode;
                sel.collapse(textNode.nextSibling, charCount);
              }
            } else if ((sel = window.document.selection)) {
              if (sel.type != "Control") {
                range = sel.createRange();
                range.move("character", charCount);
                range.select();
              }
            }
          }

          Field.query({}, function (fields) {
            var r = rangy.saveSelection();

            var dlg = dialogs.create('app/results/add-fields.dialog.html', 'ResultsPageAddFieldsDialogCtrl', {
              fields: fields
            }, {
              size: 'lg',
              keyboard: true,
              backdrop: false
            });

            dlg.result.then(function (data) {
              rangy.restoreSelection(r);
              insertTextAtCursor(data.toString());
              return moveCaret(data.length);
            }, function () {
              return;
            });
          });
        }
      });

      taRegisterTool('imageUpload', {
        buttontext: 'Upload Image',
        iconclass: 'btn btn-info',
        display: '<button class="btn btn-info btn-image-upload">Upload Image</button>',
        tooltiptext: 'Upload Image',
        action: function ($deferred) {
          function insertImgAtCursor(text) {
            var sel, range;
            if (window.getSelection) {
              sel = window.getSelection();
              if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                var oImg=document.createElement("img");

                oImg.setAttribute('src', text);
                oImg.setAttribute('alt', 'na');
                oImg.setAttribute('height', '200px');
                oImg.setAttribute('width', '200px');

                range.insertNode(oImg);
              }
            } else if (document.selection && document.selection.createRange) {
              document.selection.createRange().text = text;
            }
          }

          var r = rangy.saveSelection();

          fileDialog.openFile(function(file){
            var reader = new FileReader();
            reader.onloadend = function(e){
              var data = e.target.result;
              //send you binary data via $http or $resource or do anything else with it
              rangy.restoreSelection(r);
              insertImgAtCursor(data);
            };
            reader.readAsDataURL(file);
          });


        }
      });

      // add the button to the default toolbar definition
      taOptions.toolbar.push([]);
      taOptions.toolbar[4].push('insertCopyright');
      taOptions.toolbar[4].push('imageUpload');
      return taOptions;
    }]);
  })

  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token') && config.headers.authorization != '') {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        if (config.headers.setCorsSimpleRequest && config.headers.setCorsSimpleRequest == 'true') {
          delete config.headers.Authorization;
          delete config.headers.setCorsSimpleRequest;
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function (response) {
        if (response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })

  .run(function ($rootScope, $location, Auth) {
    // xEditable theme setup
    //editableOptions.theme = 'bs3';

    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function (loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  });
