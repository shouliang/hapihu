'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Common = new Module('common');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Common.register(function(app, auth, database) {

  //load node module
  app.use(require('skipper')());

  //We enable routing. By default the Package Object is passed to the routes
  Common.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  // Common.menus.add({
  //   title: 'common example page',
  //   link: 'common example page',
  //   roles: ['authenticated'],
  //   menu: 'main'
  // });
  
  // Common.aggregateAsset('css', 'angular-szn-autocomplete.css');
  Common.aggregateAsset('css', 'angular-toasty.css');
  Common.aggregateAsset('css', '../lib/sweetalert/sweetalert.css');
  Common.aggregateAsset('js', '../lib/sweetalert/sweetalert.min.js');
  Common.aggregateAsset('css', '../lib/xeditable/xeditable.css');
  Common.aggregateAsset('js', '../lib/xeditable/xeditable.min.js');
  Common.aggregateAsset('js', '../lib/fileupload/angular-file-upload.min.js');
  Common.aggregateAsset('css', '../lib/uitree/angular-ui-tree.min.css');
  Common.aggregateAsset('js', '../lib/uitree/angular-ui-tree.js');
  Common.aggregateAsset('css', '../lib/textangular/textAngular.css');
  // Common.aggregateAsset('js', '../lib/textangular/textAngular-rangy.min.js');
  // Common.aggregateAsset('js', '../lib/textangular/textAngular-sanitize.min.js');
  Common.aggregateAsset('js', '../lib/textangular/textAngular.min.js');
  Common.aggregateAsset('js', '../lib/particles/particles.min.js');
  Common.aggregateAsset('css', '../lib/ngImgCropFullExtended/ng-img-crop.css');
  Common.aggregateAsset('js', '../lib/ngImgCropFullExtended/ng-img-crop.js');
  Common.aggregateAsset('css', '../lib/ngImgCrop/cropper.css');
  Common.aggregateAsset('js', '../lib/ngImgCrop/cropper.js');
  Common.aggregateAsset('js', '../lib/ngImgCrop/ngCropper.js');
  // Common.aggregateAsset('js', '../lib/angularChart/Chart.bundle.min.js');
  Common.aggregateAsset('js', '../lib/angularChart/angular-chart.js');
  Common.aggregateAsset('js', '../lib/bindonce/bindonce.min.js');
  Common.aggregateAsset('js', '../lib/vjs-video/vjs-video.js');
  // Common.aggregateAsset('js', '../lib/ng-affix/ng-affix.min.js');
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Common.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Common.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Common.settings(function(err, settings) {
        //you now have the settings object
    });
    */
  Common.angularDependencies(['angular-loading-bar','cnCitySelect' ,'bw.paging','angular-toasty','oitozero.ngSweetAlert','xeditable','angularFileUpload','pasvaz.bindonce','ui.tree','textAngular','ngImgCrop','ngCropper','chart.js','vjs.video']);

  return Common;
});
