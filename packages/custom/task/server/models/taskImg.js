/**
 * Created by Heidi on 2016/7/7.
 * homework or test task
 */
'use strict'

var mongoose=require('mongoose'),
    Schema=mongoose.Schema;

var TaskImgSchema=new Schema({
    created:{
        type:Date,
        default:Date.now
    },
    task:{
        type:Schema.ObjectId,
        ref: 'Task',
        required: true
    },
    taskExe:{
        type:Schema.ObjectId,
        ref: 'TaskExe',
        required: true
    },
    user:{
        type:Schema.ObjectId,
        ref: 'User',
        required: true
    },
    originalImg:{
        type:String
    },
    originalImgPath:{
        type:String
    },
    pageNum:{
        type:Number
    },
    pageImg:{
        type:String
    },
    status:{
        type:String,
        default:'待处理'
    },
    correctImg:{
        type:String
    },
    correctImgPath:{
        type:String
    },
    recognizeOut:{
        type:Object
    },
    updated:{
        type:Date
    },
    costTime:{
        type:Number
    }
});
TaskImgSchema.statics.load=function (id,callback) {
    this.findOne({_id:id}).populate('taskExe').exec(callback)
};

mongoose.model('TaskImg',TaskImgSchema);

