'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Teacher = new Module('teacher');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Teacher.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Teacher.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Teacher.menus.add({
    title: '老师',
    link: 'teacher',
    roles: ['teacher'],
    menu: 'main',
    weight:30
  });
  Teacher.menus.add({
    title: '联考',
    link: 'unioner',
    roles: ['unioner'],
    menu: 'main',
    weight:30
  });
  Teacher.menus.add({
    title: '学校',
    link: 'schooler',
    roles: ['schooler'],
    menu: 'main',
    weight:30
  });
  Teacher.aggregateAsset('css', 'teacher.css');
  Teacher.angularDependencies(['mean.system','mean.common']);
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Teacher.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Teacher.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Teacher.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Teacher;
});
