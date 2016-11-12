'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Notification = new Module('notification');
var EventEmitter=require('events');
/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Notification.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Notification.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  // Notification.menus.add({
  //   title: '消息',
  //   link: 'parent notification',
  //   roles: ['parent'],
  //   menu: 'main',
  //   weight:30
  // });
  
  Notification.aggregateAsset('css', 'notification.css');

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Notification.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Notification.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Notification.settings(function(err, settings) {
        //you now have the settings object
    });
    */
  var notification=require("./server/controllers/notification")(Notification);
  var eventEmitter=new EventEmitter();
  eventEmitter.on('notification_single',notification.single);
  eventEmitter.on('notification_multiple',notification.multiple);
  app.set('notificationEvent',eventEmitter);
  return Notification;
});
