'use strict';

/*
 * Defining the Package
 */
var meanio= require('meanio');
var Module=meanio.Module;
var Task = new Module('task');
var config=meanio.loadConfig();


/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Task.register(function(app, auth, database,common,books,classes) {

  //We enable routing. By default the Package Object is passed to the routes
  Task.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Task.menus.add({
    title: '我的作业',
    link: 'student tasks',
    roles: ['student'],
    menu: 'main',
    weight:20
  });

  Task.menus.add({
    title: '历史作业',
    link: 'teacher tasks',
    roles: ['teacher'],
    menu: 'main',
    weight:20
  });
  Task.menus.add({
    title:'孩子作业',
    link:'child tasks',
    roles:['parent'],
    menu:'main',
    weight:20
  });
  Task.menus.add({
    title:'学习分析',
    link:'child statistic',
    roles:['parent'],
    menu:'main',
    weight:20

  });

  Task.aggregateAsset('css', 'task.css');
  if(config.recognizeFunc){
    // require("./server/controllers/recognize.js").recognizeService(config);
    require("./server/controllers/recognize.js");
  }
  return Task;
});
