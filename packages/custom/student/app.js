'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Student = new Module('student');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Student.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Student.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Student.menus.add({
    title: '学生',
    link: 'student',
    roles: ['student'],
    menu: 'main',
    weight:30
  });
Student.menus.add({
    title: '错题本',
    link: 'student collectionNotebook',
    roles: ['student'],
    menu: 'main',
    weight:10
});
  Student.aggregateAsset('css', 'student.css');

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Student.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Student.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Student.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Student;
});
