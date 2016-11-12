/**
 * Created by shouliang on 2016/11/4.
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BookNodeListSchema = new Schema({
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    subjectId: {
        type: Number
    },
    subjectName: {
        type: String
    },
    stageId: {
        type: Number
    },
    stageName: {
        type: String
    },
    versionId: {
        type: Number
    },
    versionName: {
        type: String
    },
    bookId: {
        type: Number
    },
    bookName: {
        type: String
    },
    children: {
        type: Array
    }

});

BookNodeListSchema.statics.load = function (id, cb) {
    this.findOne({_id: id})
        .populate('user', 'name username')
        .exec(cb);
};

mongoose.model('BookNodeList', BookNodeListSchema);
