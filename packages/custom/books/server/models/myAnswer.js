'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * MyAnswer Schema
 */
var MyAnswerSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: Schema.ObjectId,
    ref: 'Topic',
    required: true
  },
  score:{
    type:Number
  },
  mark:{ // right or wrong
    type:String
  },
  status:{ // if judged
    type:String
  },
  myAnswer:{
    type: String,
  },
  myAnswerImg:{
    type: Array,
  },
  location:{  //题目所在的书、任务、学生书等位置
    type:Object
  },
  remark:{  // self comment message
    type:String
  },
  comments:{ // teacher or parent comment
    type:Array
  }

});


/**
 * Statics
 */
MyAnswerSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('MyAnswer', MyAnswerSchema);
