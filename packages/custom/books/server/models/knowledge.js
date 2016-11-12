'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;



/**
 * Knowledge Schema
 */
var KnowledgeSchema = new Schema({
    title: {
        type: String
    },
    level: {
        type: Number
    },
    parent: {
        type: Schema.ObjectId
    },
    systemId: {
        type: Schema.ObjectId,
        ref: 'knowledgeSystem'
    },
    orderIndex: {
        type: Number
    },
    mapId:{
       type:Number
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
    }
});

/**
 * Statics
 */
KnowledgeSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name username').exec(cb);
};

KnowledgeSchema.statics.findAndUpdate = function (id, options, cb) {
    this.update({_id: id} , options).exec(cb);
};

KnowledgeSchema.statics.removeById = function (id, cb) {
    this.remove({_id: id}).exec(cb);
};

mongoose.model('Knowledge', KnowledgeSchema);
