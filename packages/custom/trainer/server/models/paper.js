/**
 * Created by shouliang on 2016/11/4.
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaperSchema = new Schema({
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
    title: {
        type: String
    },
    topics: [{
        type: Schema.ObjectId,
        ref: 'Topic'
    }],
    delFlag: {
        type: Number,  // 0:undeleted  1:deleted
        default: 0
    },
    property: {
        type: String, // private or public
        default: 'public'
    }
});

PaperSchema.statics.load = function (id, cb) {
    this.findOne({_id: id})
        .populate('user', 'name username')
        .populate('topics','questionId difficult questionOptions stem answer analysis')
        .exec(cb);
};

mongoose.model('Paper', PaperSchema);
