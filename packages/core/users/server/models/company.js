'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Company Schema
 */
var CompanySchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  access:{
    type:String,
    required:true,
    trim: true,
    unique: true
  },
  path:{
    type:String,
    required:true,
    trim: true,
    unique: true
  },
  summary:{
    type:String
  },
  postcode: {
    type: Array
  },
  profile:{
    type:Object
  },
  location:{
    type:Array
  },
  abbr:{
    type:Array
  }
});

/**
 * Validations
 */
/**
 * Statics
 */
CompanySchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).exec(cb);
};

mongoose.model('Company', CompanySchema);
