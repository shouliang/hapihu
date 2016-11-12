/**
 * Created by Heidi on 2016/7/7.
 * homework or test task
 */
'use strict'

var mongoose=require('mongoose'),
    Schema=mongoose.Schema;

var TaskExeSchema=new Schema({
    created:{
        type:Date,
        default:Date.now
    },
    task:{
        type:Schema.ObjectId,
        ref: 'Task',
        required: true
    },
    user:{
        type:Schema.ObjectId,
        ref:'User',
        required: true
    },
    status:{
        type:String,
        default:'待批改'
    },
    score:{
        type:Number
    },
    submitOrder:{
        type:Number
    },
    statistics:{
        type:Object
    },
    exeImg:{  //上传的作业图片
        type:Array
    },
    type:{  //任务类型，默认；homework
        type:String,
        default:'homework'
    },
    topics:{
        type:Array,
    },
    myAnswers:[ //作业题目回答
        { type: Schema.ObjectId, ref: 'MyAnswer' }
    ],
    remark:{
        type:String
    },
    comments:{  //老师评语 或 家长 评语
        type:Array
    }


});
TaskExeSchema.statics.load=function (id,callback) {
    this.findOne({_id:id}).populate('task').populate('user',{_id:1,name:1,username:1}).exec(callback)
};

mongoose.model('TaskExe',TaskExeSchema);

