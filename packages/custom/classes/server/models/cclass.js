'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Cclass Schema
 */
var CclassSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  school:{
    type: Schema.ObjectId,
    ref: 'School',
    required: true
  },
  grade: {
    type: String,
  },
  profile:{
    type:Object
  },
  members:{
    type:Array,
  },
  admins:{
    type:Array,
  },
  abbr:{
    type:Array
  },
  cid:{   //班级ID
    type:String
  },
  ccode:{   //验证码
    type:String
  },
  status:{
    type:String,
    default:'unconfirmed'
  },
  tasks:{
    type:Array
  },
  managers:[]
});

/**
 * Validations
 */
/**
 * Statics
 */
CclassSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('school').exec(cb);
};

mongoose.model('Cclass', CclassSchema);
