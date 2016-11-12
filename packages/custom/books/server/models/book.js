'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Book Schema
 */
var BookSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  latest:{
    type: Date,
    default: Date.now
  },
  nodes:{
    type: Array
  },
  topics:{
    type: Array
  },
  resources:{
    type: Array
  }
});


/**
 * Statics
 */
BookSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('Book', BookSchema);
