'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Examination = new Module('examination');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Examination.register(function(app, auth, database, circles) {

  //We enable routing. By default the Package Object is passed to the routes
  Examination.routes(app, auth, database, circles);
  Examination.aggregateAsset('css', 'examination.css');
  //We are adding a link to the main menu for all authenticated users
   Examination.menus.add({
    title: '组卷',
    link: 'groupExam list',
    roles: ['teacher'],
    menu: 'main',
    weight:10
  });
  
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Examination.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Examination.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Examination.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Examination;
});
