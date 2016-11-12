'use strict';
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
    Company = mongoose.model('Company'),
  _ = require('lodash');


var findUser = exports.findUser = function(id, cb) {
  User.findOne({
        _id: id
    }, function(err, user) {
        if (err || !user) return cb(null);
        if(user.profile && user.profile.company){
            Company.findOne({name:user.profile.company},function (err,company) {
                if(company){
                    user.profile.companyObject=company;
                }
                cb(user);
            })
        }else{
            cb(user);
        }

    });
};


/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).send('User is not authorized');
  }
  findUser(req.user._id, function(user) {
      if (!user) return res.status(401).send('User is not authorized');
      req.user = user;
      next();
  });
};

/**
 * Generic require Admin routing middleware
 * Basic Role checking - future release with full permission system
 */
exports.requiresAdmin = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).send('User is not authorized');
  }
  findUser(req.user._id, function(user) {
      if (!user) return res.status(401).send('User is not authorized');

      if (req.user.roles.indexOf('admin') === -1) return res.status(401).send('User is not authorized');
      req.user = user;
      next();
  });
};

/**
 * Generic validates if the first parameter is a mongo ObjectId
 */
exports.isMongoId = function(req, res, next) {
  if ((_.size(req.params) === 1) && (!mongoose.Types.ObjectId.isValid(_.values(req.params)[0]))) {
      return res.status(500).send('Parameter passed is not a valid Mongo ObjectId');
  }
  next();
};
