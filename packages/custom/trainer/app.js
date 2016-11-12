'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Trainer = new Module('trainer');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Trainer.register(function(app, auth, database, circles) {

  //We enable routing. By default the Package Object is passed to the routes
  Trainer.routes(app, auth, database, circles);

  //We are adding a link to the main menu for all authenticated users
  Trainer.menus.add({
    title: '首页',
    link: 'trainer',
    roles: ['trainer'],
    menu: 'main',
    weight:'30'
  });
  Trainer.menus.add({
    title: '学生',
    link: 'trainer student',
    roles: ['trainer'],
    menu: 'main',
    weight:'25'
  });
  Trainer.menus.add({
    title: '班级',
    link: 'trainer klasses',
    roles: ['trainer'],
    menu: 'main',
    weight:'20'
  });
  
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Trainer.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Trainer.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Trainer.settings(function(err, settings) {
        //you now have the settings object
    });
    */
  Trainer.aggregateAsset('css', 'trainer.css');

  return Trainer;
});
