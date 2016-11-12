'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//
// // demo TODO 待删除
// var resourceObj = {
//     name: '',
//     url: 'http://hapihu.com/book1/1234.jpg',        // 外链的地址或者相对路径的地址
//     path: '',                                       // 绝对地址
//     knowledgeIds: [],                               // 所属知识点
//     delFlag:0                                       // 删除标志
// };

/**
 * Resource Schema
 */
var ResourceSchema = new Schema({
    name: {
        type: String
    },
    title:{
        type:String,
        required: true,
        trim: true
    },
    url: {
        type: String
    },
    path: {
        type: String
    },
    size:{
      type:Number
    },
    type:{
        type:String
    },
    // 所属知识点
    knowledge:[
        {
            type: Schema.ObjectId,
            ref: 'Knowledge'
        }
    ],
    delFlag:{
      type:Number,
      default:0
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
    summary:{
        type:String,
    },
    grade:{
        type:String,
    },
    subject:{
        type:String,
    },
    tag:{
        type:Array
    },
    permissions: {
        type: Array
    },
    status:{  //是否发布
        type:String
    }
});


/**
 * Statics
 */
ResourceSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name username').populate('knowledge','_id title').exec(cb);
};

ResourceSchema.statics.findAndUpdate = function (id, options, cb) {
    this.update({_id: id} , options).exec(cb);
};

mongoose.model('Resource', ResourceSchema);
