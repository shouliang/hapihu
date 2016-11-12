'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Zone Schema
 */
var ZoneSchema = new Schema({
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
  postcode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  level:{
    type:Number,
    required:true
  },
  type:{
    type: String,
    default:"省"
  },
  profile:{
    type:Object
  },
  location:{
    type:Object
  },
  abbr:{
    type:Array
  },
  parents:{
    type:Array
  }
});

/**
 * Validations
 */


mongoose.model('Zone', ZoneSchema);
