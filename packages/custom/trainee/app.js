'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Trainee = new Module('trainee');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Trainee.register(function(app, auth, database, circles) {

  //We enable routing. By default the Package Object is passed to the routes
  Trainee.routes(app, auth, database, circles);

  //We are adding a link to the main menu for all authenticated users
  Trainee.menus.add({
    title: '报告',
    link: 'trainee statistic',
    roles: ['trainee'],
    menu: 'main',
    weight:28
  });
  Trainee.menus.add({
    title: '历史测试',
    link: 'trainee list',
    roles: ['trainee'],
    menu: 'main',
    weight:25
  });
  Trainee.menus.add({
    title: '首页',
    link: 'trainee',
    roles: ['trainee'],
    menu: 'main',
    weight:30
  });
  
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Trainee.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Trainee.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Trainee.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Trainee;
});
