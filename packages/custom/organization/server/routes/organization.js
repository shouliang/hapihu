(function() {
    'use strict';

    /* jshint -W098 */
    // The Package is past automatically as first parameter
    module.exports = function(Organization, app, auth, database) {
        var organization = require('../controllers/organization')();
        app.get("/api/organization/:schoolId",auth.requiresLogin,organization.show);
        app.get('/api/organization/trainer/:schoolId', auth.requiresLogin,organization.trainer);
        app.post('/api/organization/trainer/:schoolId', auth.requiresLogin,organization.addTrainer);
        app.delete('/api/organization/trainer/:schoolId', auth.requiresLogin,organization.deleteTrainer);

        app.get('/api/organization/trainee/:schoolId', auth.requiresLogin,organization.trainee);
        app.post('/api/organization/trainee/:schoolId', auth.requiresLogin,organization.addTrainee);
        app.delete('/api/organization/trainee/:schoolId', auth.requiresLogin,organization.deleteTrainee);

        app.get('/api/organization/klass/:schoolId', auth.requiresLogin,organization.klass);
        app.post('/api/organization/klassManager/:classId', auth.requiresLogin,organization.klassManager);
        app.post('/api/organization/klassMember/:classId', auth.requiresLogin,organization.klassMember);
        app.post('/api/organization/traineeProducts/:schoolId', auth.requiresLogin,organization.traineeProducts);

    };
})();
