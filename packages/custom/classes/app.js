'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Classes = new Module('classes');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Classes.register(function(app, auth, database,common) {

  //We are adding a link to the main menu for all authenticated users
  var icons = 'classes/assets/img/';
  Classes.menus.add({
    title: '我的班级',
    link: 'my classes',
    roles: ['student'],
    menu: 'main',
    weight:10
  });
  Classes.menus.add({
    roles: ['admin'],
    title: '班级',
    link: 'admin classes',
    icon: icons + 'schools.png',
    menu: 'admin',
    weight:10
  });
  //We enable routing. By default the Package Object is passed to the routes
  Classes.routes(app, auth, database);
  Classes.aggregateAsset('css', 'classes.css');
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Classes.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Classes.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Classes.settings(function(err, settings) {
        //you now have the settings object
    });
    */
  return Classes;
});
