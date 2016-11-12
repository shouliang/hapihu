'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Vendor = new Module('vendor');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Vendor.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Vendor.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Vendor.menus.add({
    title: '出版社',
    link: 'vendor',
    roles: ['vendor'],
    menu: 'main',
    weight:20
  });
  Vendor.menus.add({
    title: '题库',
    link: 'admin questions',
    roles: ['edit'],
    menu: 'main',
    weight:15
  });
  
  Vendor.aggregateAsset('css', 'vendor.css');
  Vendor.angularDependencies(['mean.system','mean.common']);
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Vendor.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Vendor.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Vendor.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Vendor;
});
