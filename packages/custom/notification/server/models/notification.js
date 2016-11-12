'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Notification Schema
 */
var NotificationSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content:{
    type:String
  },
  link:{        // 消息中的链接信息 {taskId:'',taskExeId:''}
    type:Object
  },
  from: {
    type:Object
  },
  to:{
    type:String
  },
  status:{
    type:String
  }
});


/**
 * Statics
 */
NotificationSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('Notification', NotificationSchema);
