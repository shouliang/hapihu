'use strict';

/**
 * teacher book copy by book
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * TeacherBook Schema
 */
var TeacherBookSchema = new Schema({
  teacherId:{
    type:String,
  },
  bookId:{
    type:String,
  },
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  verificationCode:{
    type:String,
  }
  ,
  grade:{
    type:String
  },
  session:{
    type:String
  },
  subject:{
    type:String
  },
  edition:{
    type:String,
  },
  cover:{
    type:String,
  },
  path:{
    type:String
  },
  online:{
    type:String,
    default:'unOnline'
  },
  publisher:{
    type:String
  },
  isbn:{
    type:String
  },
  summary: {
    type: String,
    trim: true
  },
  tags:{
    type:Array
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    type: Array
  },
  updated: {
    type: Array,
  },
  nodes:{
    type: Array
  },
  topics:{
    type: Array
  },
  resources:{
    type: Array
  },
  sync:{
    type:Boolean,
    default:true
  }
});


/**
 * Statics
 */
TeacherBookSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('TeacherBook', TeacherBookSchema);
