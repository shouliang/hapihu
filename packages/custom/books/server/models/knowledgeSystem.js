'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * KnowledgeSystem Schema
 */
var KnowledgeSystemSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  grade:{
    type:String
  },
  subject:{
    type:String
  },
  edition:{
    type:String
  },
  // 导入时映射的id
  mapId:{
    type:Number
  },
  summary: {
    type: String,
    trim: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
  children:{  // 知识体系结构
    type:Array
  },
  zxxId:{
    type:Number
  },
  zxxkFlag:{ // 是否来自学科网
    type:Number,
    default:0
  }
});


/**
 * Statics
 */
KnowledgeSystemSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('KnowledgeSystem', KnowledgeSystemSchema);
