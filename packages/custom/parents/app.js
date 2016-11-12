'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Parents = new Module('parents');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Parents.register(function(app, auth, database, circles) {

  //We enable routing. By default the Package Object is passed to the routes
  Parents.routes(app, auth, database, circles);

  //We are adding a link to the main menu for all authenticated users
  Parents.menus.add({
    title: '家长',
    link: 'parent',
    roles: ['parent'],
    menu: 'main',
    weight:30
  });
  // Parents.aggregateAsset('css', 'parent.css');
  
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Parents.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Parents.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Parents.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Parents;
});
