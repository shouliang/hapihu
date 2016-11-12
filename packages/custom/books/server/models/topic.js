'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Topic Schema
 */
var TopicSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    title:{             //题目标识，一般用于题号
        type:String
    },
    type: {
        type: String
    },
    stem: {
        type: String,
        trim: true
    },
    questionId:{
        type:Number
    },
    difficult: {
      type:Number
    },
    questionOptions:{
        type:Object
    },
    answer: {
        type: String,
    },
    analysis: {
        type: String,
    },
    subject: {
        type: String
    },
    image: { //存储书籍中题目相关的图片，位置，属性：page(number),stem(array),answerBlock,answer(array),analysis(object), object包括 dataUrl，position 属性
        type: Object
    },
    online: {
        type: String,
        default: 'unOnline'
    },
    score:{
        type:Number,
        default:0
    },
    summary: {
        type: String,
        trim: true
    },
    tags: {
        type: Array
    },
    level: { //难易度
        type: String
    },
    // 所属知识点
    knowledge: [
        {
            type: Schema.ObjectId,
            ref: 'Knowledge'
        }
    ],
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    permissions: {
        type: Array
    },
    updated: {
        type: Array
    },
    resources: {
        type: Array
    },
    book: {
        type: Schema.ObjectId,
        ref: 'Book'
    },
    from: {
        type: Object
    },
    to: {
        type: Array
    },
    submitters: { //回答用户
        type: Array
    },
    statistics: {
        rightRate: {
            type: Number, // 正确率
            default:0
        }
    },
    profile:{
        type:String // 公用public、私用private
    }

});


/**
 * Statics
 */
TopicSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name username').populate('knowledge', '_id title').exec(cb);
};

mongoose.model('Topic', TopicSchema);
