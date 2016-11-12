'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Organization = new Module('organization');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Organization.register(function(app, auth, database, circles) {

  //We enable routing. By default the Package Object is passed to the routes
  Organization.routes(app, auth, database, circles);

  //We are adding a link to the main menu for all authenticated users
  Organization.menus.add({
    title: '学校',
    link: 'organization',
    roles: ['organization'],
    menu: 'main',
    weigth:30
  });
  
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Organization.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Organization.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Organization.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Organization;
});
