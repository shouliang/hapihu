'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * PaperImage Schema
 */
var PaperImageSchema = new Schema({
    url: {
        type: String
    },
    path: {
        type: String
    },
    pageNum: {
        type:Number
    },
    book: {
        type: Schema.ObjectId,
        ref: 'Book'
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    width:{
        type:Number
    },
    height:{
        type:Number
    },
    size:{
        type:Number
    },
    mark:{
        type:Object
    },
    format:{
        type:Object
    },
    task:{
        type:Schema.ObjectId,
        ref:'Task'
    },
    executor:{
        type:Schema.ObjectId,
        ref:'User'
    },
    originalName:{
        type:String
    }
});


/**
 * Statics
 */
PaperImageSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name username').exec(cb);
};

PaperImageSchema.statics.findAndUpdate = function (id, options, cb) {
    this.update({_id: id} , options).exec(cb);
};
mongoose.model('PaperImage', PaperImageSchema);
