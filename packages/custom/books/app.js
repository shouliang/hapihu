'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Books = new Module('books');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Books.register(function(app, auth, database,common) {

  //We enable routing. By default the Package Object is passed to the routes
  Books.routes(app, auth, database);
  var icons = 'books/assets/img/icons/';

  //We are adding a link to the main menu for all authenticated users
  Books.menus.add({
    title: '我的书',
    link: 'student books',
    roles: ['student'],
    menu: 'main',
    weight:11
  });
  Books.menus.add({
    title: '我的书',
    link: 'teacher books',
    roles: ['teacher'],
    menu: 'main',
    weight:11
  });
  Books.menus.add({
    title: '我的书',
    link: 'vendor books',
    roles: ['vendor'],
    menu: 'main',
    weight:10
  });
  Books.menus.add({
    title: '辅导书',
    link: 'admin books',
    roles: ['admin'],
    icon:icons + 'books.png',
    menu: 'admin',
    weight:11
  });
  Books.menus.add({
    title: '题目',
    link: 'admin questions',
    roles: ['admin'],
    icon:icons + 'questions.png',
    menu: 'admin',
    weight:12
  });
  Books.menus.add({
    title: '资源',
    link: 'admin resources',
    roles: ['admin'],
    icon:icons + 'resources.png',
    menu: 'admin',
    weight:13
  });
  Books.menus.add({
    title: '知识体系',
    link: 'admin knowledgeSystem list',
    roles: ['admin'],
    icon:icons + 'knowledges.png',
    menu: 'admin',
    weight:14
  });

  Books.aggregateAsset('css', 'books.css');
  Books.angularDependencies(['mean.system','mean.common']);
  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Books.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Books.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Books.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Books;
});
