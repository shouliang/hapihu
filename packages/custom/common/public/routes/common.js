(function () {
  'use strict';

  angular
    .module('mean.common')
    .config(common)
    .config(['toastyConfigProvider', function(toastyConfigProvider) {
      toastyConfigProvider.setConfig({
        sound: true,
        shake: false,
        theme:'bootstrap',
        timeout:3000,
        showClose: false,
        clickToClose: true
      });
    }])
      .config(['$provide', function($provide){
        // this demonstrates how to register a new tool and add it to the default toolbar
        $provide.decorator('taOptions', ['taRegisterTool', '$delegate', '$uibModal', function (taRegisterTool, taOptions, $uibModal){
          // $delegate is the taOptions we are decorating
          // here we override the default toolbars and classes specified in taOptions.
          taOptions.forceTextAngularSanitize = false; // set false to allow the textAngular-sanitize provider to be replaced
          taOptions.keyMappings = []; // allow customizable keyMappings for specialized key boards or languages
          taRegisterTool('uploadImage', {
            buttontext: '',
            iconclass: "fa fa-upload",
            action: function (deferred,restoreSelection) {
              var modal=$uibModal.open({
                controller: 'UploadImageModalInstance',
                controllerAs:'vm',
                templateUrl: '/common/views/upload.html'
              })
              .result.then(
                function (result) {
                  restoreSelection();
                  if(angular.isArray(result)){
                    angular.forEach(result,function (img) {
                      document.execCommand('insertImage', true, img);
                    })

                  }else{
                    document.execCommand('insertImage', true, result);
                  }

                  deferred.resolve();
                },
                function () {
                  deferred.resolve();
                }
            )
              ;
              return false;
            }
          });
          taOptions.toolbar[1].push('uploadImage');
          taOptions.toolbar = [
            [ 'h3', 'h4', 'p', 'pre', 'quote'],
            ['bold', 'italics', 'underline', 'ul', 'ol', 'redo', 'undo', 'clear'],
            ['justifyLeft','justifyCenter','justifyRight', 'justifyFull'],
            ['html', 'insertImage','uploadImage', 'insertLink','charcount']
          ];
          taOptions.classes = {
            focussed: 'focussed',
            toolbar: 'btn-toolbar',
            toolbarGroup: 'btn-group',
            toolbarButton: 'btn btn-default',
            toolbarButtonActive: 'active',
            disabled: 'disabled',
            textEditor: 'form-control',
            htmlEditor: 'form-control'
          };
          return taOptions; // whatever you return will be the taOptions
        }]);
        // this demonstrates changing the classes of the icons for the tools for font-awesome v3.x
        $provide.decorator('taTools', ['$delegate', function(taTools){
          taTools.bold.iconclass = 'fa fa-bold';
          taTools.italics.iconclass = 'fa fa-italic';
          taTools.underline.iconclass = 'fa fa-underline';
          taTools.ul.iconclass = 'fa fa-list-ul';
          taTools.ol.iconclass = 'fa fa-list-ol';
          taTools.undo.iconclass = 'fa fa-undo';
          taTools.redo.iconclass = 'fa fa-repeat';
          taTools.justifyLeft.iconclass = 'fa fa-align-left';
          taTools.justifyRight.iconclass = 'fa fa-align-right';
          taTools.justifyCenter.iconclass = 'fa fa-align-center';
          taTools.clear.iconclass = 'fa fa-ban';
          taTools.insertLink.iconclass = 'fa fa-link';
          taTools.insertImage.iconclass = 'fa fa-picture-o';
          // there is no quote icon in old font-awesome so we change to text as follows
          delete taTools.quote.iconclass;
          taTools.quote.buttontext = 'quote';
          return taTools;
        }]);
      }])
      .config(['ChartJsProvider',function (ChartJsProvider) {
        ChartJsProvider.setOptions({ colors : [ '#f6a94e', '#83e3c3', '#FFA98B'] });
      }])
    .run(function(editableOptions) {
        editableOptions.theme = 'bs3';
      })
    ;

  common.$inject = ['$stateProvider'];

  function common($stateProvider) {
    // $stateProvider.state('common example page', {
    //   url: '/common/example',
    //   templateUrl: 'common/views/index.html'
    // });
  }

})();
