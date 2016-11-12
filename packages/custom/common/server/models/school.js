'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * School Schema
 */
var SchoolSchema = new Schema({
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
    type: Array,
    required: true
  },
  grades: {
    type: Array,
  },
  classes:{
    type:Array
  },
  tmpClasses:{
    type:Array
  },
  profile:{
    type:Object
  },
  location:{
    type:Array
  },
  abbr:{
    type:Array
  },
  status:{
    type:String,
    default:'unconfirmed'
  },
  manager:[
    {
      type:Schema.ObjectId,ref:'User'
    }
  ]
});

/**
 * Validations
 */
/**
 * Statics
 */
SchoolSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).exec(cb);
};

mongoose.model('School', SchoolSchema);
