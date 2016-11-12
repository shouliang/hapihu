'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;
var Admin = new Module('admin');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */

Admin.register(function(app, auth, database, circles,classes ,common ) {

    var icons = 'admin/assets/img/icons/';

    Admin.menus.add({
        title: '系统管理',
        link: 'system.base',
        roles: ['admin'],
        menu: 'main',
        weight:1
    });

    Admin.menus.add({
        roles: ['admin'],
        title: '模块',
        link: 'modules',
        icon: icons + 'modules.png',
        menu: 'admin',
        weight:2
    });
    // Admin.menus.add({
    //     roles: ['admin'],
    //     title: '风格',
    //     link: 'themes',
    //     icon: icons + 'themes.png',
    //     menu: 'admin',
    //     weight:100
    // });
    Admin.menus.add({
        roles: ['admin'],
        title: '设置',
        link: 'settings',
        icon: icons + 'settings.png',
        menu: 'admin',
        weight:3
    });
    Admin.menus.add({
        roles: ['admin'],
        title: '用户',
        link: 'users',
        icon: icons + 'users.png',
        menu: 'admin',
        weight:4
    });
    Admin.routes(app, auth, database);
    Admin.aggregateAsset('css', 'admin.css');
    Admin.aggregateAsset('js', '../lib/ng-clip/src/ngClip.js', {
        absolute: false,
        global: true
    });

    Admin.aggregateAsset('js', '../lib/zeroclipboard/dist/ZeroClipboard.js', {
        absolute: false,
        global: true
    });

    Admin.angularDependencies(['ngClipboard','mean.common']);

    // We enable routing. By default the Package Object is passed to the routes

    return Admin;
});
