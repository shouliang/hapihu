'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Vendor Schema
 */
var VendorSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  profile: {
    type: Object
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  manager:{
    type:Array
  },
  permissions: {
    type: Array
  }
});


/**
 * Statics
 */
VendorSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('Vendor', VendorSchema);
