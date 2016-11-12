'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * BookImage Schema
 */
var BookImageSchema = new Schema({
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
        ref: 'Book',
        required: true
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
    }
});


/**
 * Statics
 */
BookImageSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name username').populate('book','_id name path').exec(cb);
};

BookImageSchema.statics.findAndUpdate = function (id, options, cb) {
    this.update({_id: id} , options).exec(cb);
};
mongoose.model('BookImage', BookImageSchema);
