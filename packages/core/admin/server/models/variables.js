'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Variable Schema
 */
var VariableSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type:String,
  },
  summary:{
    type:String
  }

});


/**
 * Statics
 */
VariableSchema.statics.load = function(key, cb) {
  this.findOne({
    key: key
  }).exec(cb);
};

mongoose.model('Variable', VariableSchema);
