(function () {
    'use strict';

    /* jshint -W098 */
    // The Package is past automatically as first parameter
    module.exports = function (Parents, app, auth, database, circles) {
        var parents = require('../controllers/parents');

        app.get('/api/parents/relateChildren',auth.requiresLogin, parents.relateChildren);

        app.get('/api/parents/childrenTasks',auth.requiresLogin, parents.childrenTasks);

        app.get('/api/parents/Teachers',auth.requiresLogin, parents.getTeachers);

    };
})();
