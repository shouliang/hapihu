/**
 * Created by Heidi on 2016/7/7.
 * homework or test task
 */
'use strict'

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TaskSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    from: {
        type: Object
    },
    to: {
        type: Array
    },
    title: {
        type: String
    },
    aim: {
        type: String
    },
    endDate: {
        type: Date
    },
    type: {
        type: String
    },
    content: {
        type: Object
    },
    status: { //已批改 or 待批改
        type: String
    },
    accepters: {
        type: Array
    },
    executed: [  //  任务交付
        {type: Schema.ObjectId, ref: 'TaskExe'}
    ],
    summary: {
        type: String
    },
    statistics: {
        type: Array
    },
    checkers: [{ //阅卷者
        userId:{
            type:Schema.ObjectId,ref:'User'
        } ,
        username: {
            type:String
        },
        name: {
            type: String
        },
        to: {
            type: Array
        },
        content: {
            type: Object
        },
        status: { //已批改 or 待批改
            type: String
        },
        accepters: {
            type: Array
        },
        executed: [  //  任务交付
            {type: Schema.ObjectId, ref: 'TaskExe'}
        ]
    }]

});

TaskSchema.statics.load = function (id, callback) {
    this.findOne({_id: id}).exec(callback)
};

mongoose.model('Task', TaskSchema);

