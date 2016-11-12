/**
 * Created by shouliang on 2016/11/4.
 */
'use strict';


var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SubjectSchema = new Schema({
        subjectId: {  // 学科 例如：初中数学
            type: Number
        },
        subjectName: {
            type: String
        },
        stageId: { // 学段 1：小学；2：初中；3：高中
            type: Number
        },
        stageName: {
            type: String
        },
        questionTypes: { // 试题类型 例如：选择题
            type: Array
        },
        // versions:      // 版本信息  例如：人教版
        //     [
        //         {
        //             Id: {type: Number},
        //             versionName: {type: String},
        //             books: [                        // 教材册别 例如：七年级上册
        //                 {
        //                     id: {type: Number},
        //                     bookName: {type: String},
        //                     childrens: {type: Array} // 教材章节
        //                 }
        //             ]
        //         }
        //     ]
        // ,
        versions: {
            type: Array
        },
        created: {
            type: Date,
            default: Date.now()
        }
        ,
        updated: {
            type: Date,
            default: Date.now()
        }
        ,
        user: {   // TODO
            type: Schema.ObjectId,
            ref: 'User'
        },

    })
    ;

SubjectSchema.statics.load = function (id, cb) {
    this.findOne({_id: id})
        .populate('user', 'name username')
        .exec(cb);
};

mongoose.model('Subject', SubjectSchema);
