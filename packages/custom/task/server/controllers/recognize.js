/**
 * Created by Heidi on 2016/7/7.
 */
var kue=require("kue");
var ref = require('ref');
var ffi = require('ffi');
var sanitizeHtml = require('sanitize-html');
var meanio = require('meanio'),
    app=meanio.app,
    _ = require('lodash'),
    async = require('async'),
    mongoose = require('mongoose'),
    Task = mongoose.model('Task'),
    TaskExe = mongoose.model('TaskExe'),
    MyAnswer = mongoose.model('MyAnswer'),
    Topic=mongoose.model('Topic'),
    TaskImg=mongoose.model('TaskImg'),
    fs = require('fs'),
    path = require('path');
var common = require("../../../common/server/controllers/index")();
var config=meanio.loadConfig();
var cluster = require('cluster');
var getRecognize=function (data_json,last) {
    var buf=new Buffer(8192);
    buf.writeCString('');
    // param (jsonString,outString,sharpen,hession),sharpen=0 disabled ;1 enabled ;hession=600 default;300 600 900 1600,
    var recongnize = ffi.Library('libRecognize', {
        "Recognize": ['int', ['string','string','string','int','int'] ]
    });
    var trainData='abcde.xml';
    var sharpen=last?1:0;
    console.log("++++++++++++++++++++++++++++++++++++++++call Recognize .sharpen:",sharpen);
    // console.log('input data_json:',data_json);
    recongnize.Recognize(data_json,trainData,buf,sharpen,900);
    var outString=buf.readCString();
    // console.log("outString:",outString);
    try{
        var outJson=JSON.parse(outString);
    }catch (err){
        return {result:0,data:'图像识别结果无法解析'};
    }
    // console.log('outJson:',outJson);
    //handle result
    if(outJson.status_r===-4 && !last){
        return getRecognize(data_json,true);
    }else if(outJson.status_r<0 && outJson.status_r!==-5){  //-5 表示文字识别错误
        console.log("图像识别失败：",outJson);
        var errMsg='图像识别失败:'+outJson.message_r;
        switch (outJson.status_r){
            case -10:
                errMsg="输入json格式错误";
                break;
            case -2:
                errMsg="图片不存在";
                break;
            case -3:
                errMsg="图片的长或宽小于600px";
                break;
            case -4:
                errMsg="照片无法识别";
                break;
            case -6:
                errMsg="题目回答区越界";
                break;
            default:
                errMsg='图像识别错误:'+outJson.message_r;

        }
        // console.log("errMsg:",errMsg);
        return {result:0,data:errMsg};;
    }
    return {result:1,data:outJson};
};
var positionScale=function (postion,iscale,maxWidth,maxHeight) {
    var newPostion=[];
    _.forEach(postion,function (item,key) {
        var p=Math.ceil(item*iscale);
        if(p<0){
            p=0;
        }else if(key%2===0 && p>maxWidth){
            p=maxWidth;
        }else if(key%2===1 && p>maxHeight){
            p=maxHeight;
        }
        newPostion.push(p);
    });
    return newPostion;
};
    //图像识别
    console.log("recognizeService start");
    var queue=kue.createQueue();
    queue.on( 'error', function( err ) {
        console.log( 'recognize queue err ', err );
    });
    var onFailed=function(job, doneErr){
        // Job failed with reason err!
        console.log('抱歉，照片识别失败:',doneErr);
        if(doneErr!=='paused'){
            var taskImg=job.data.taskImg;
            TaskImg.findOne({_id:taskImg._id},function (err,result) {
                if(err) return console.log("失败处理：数据库访问失败");
                if(result){
                    result.status='识别失败';
                    result.recognizeOut=doneErr;
                    result.save(function (err) {
                        if(err) return console.log("保存失败：数据库访问失败");
                    });
                }
            });
            TaskExe.findOne({_id:taskImg.taskExe},function (err,result) {
                if(err) return console.log("失败处理：数据库访问失败");
                if(result){
                    result.status='系统批改失败_'+doneErr;
                    result.save(function (err) {
                        if(err) return console.log("保存失败：数据库访问失败");
                    });
                }
            });
        }
    };
    queue.process('recognizeImg',function(job, done){
        if(process.env.REDIS_PAUSE){
            console.log("REDIS_PAUSE");
            return done('paused');
        }
        var beginTime=Date.now();
        var taskImg=job.data.taskImg;
        var data_json={
            "rand":taskImg._id,
            "status_r":0 ,
            "message_r":"",
            "originalImg":taskImg.originalImgPath,
            "correctImg":"",
            "stardardImg":"",
            "standardImg_width":0,
            "standardImg_height":0,
            "matchImg_postion":[0,0,0,0],
            "sections":[]
        };
        var scale=1;
        async.series([
                //format original img
                function (cb) {
                    var nameIndex=taskImg.originalImgPath.lastIndexOf('/');
                    if(nameIndex===-1){
                        nameIndex=taskImg.originalImgPath.lastIndexOf('\\');
                    }
                    var fileName=taskImg.originalImgPath.substring(nameIndex+1);
                    var destName=fileName.replace('.','_sharpen.');
                    var dest=taskImg.originalImgPath.substring(0,nameIndex+1)+destName;
                    common.imageSharpen(dest,taskImg.originalImgPath,function (err,rest) {
                        if(err){
                            console.log('图片预处理失败：',taskImg.originalImgPath)
                        }else{
                            data_json.originalImg=dest;
                        }
                        cb(null,'ok');
                    });
                },
                //get taskImg
                function (cb) {
                    TaskImg.findOne({_id:taskImg._id}).populate('task').exec(function (err,result) {
                        if(err) return cb("taskImg 查询失败");
                        taskImg=result;
                        cb(null,taskImg);
                    });
                },
                //get standimg path
                function (cb) {
                    var BookImage=mongoose.model('BookImage');
                    BookImage.findOne({url:taskImg.pageImg,pageNum:taskImg.pageNum},function (err,result) {
                        if(err) return cb("书页查询失败");
                        if(!result) return cb("未找到对应书页");
                        // data_json.rand=result._id.toString();
                        if(result.format && result.format.path){
                            data_json.stardardImg=result.format.path;
                            data_json.standardImg_width=result.format.width;
                            data_json.standardImg_height=result.format.height;
                            scale=result.format.scale;
                            if(result.mark && result.mark.postion){
                                // data_json.matchImg=result.mark.imgPath;
                                data_json.matchImg_postion=positionScale(result.mark.postion,scale,data_json.standardImg_width,data_json.standardImg_height);
                            }
                            cb(null,'ok');
                        }else if(result.width<=1280 && result.height<=1737){
                            data_json.stardardImg=result.path;
                            data_json.standardImg_width=result.width;
                            data_json.standardImg_height=result.height;
                            if(result.mark && result.mark.postion){
                                // data_json.matchImg=result.mark.imgPath;
                                data_json.matchImg_postion=result.mark.postion;
                            }
                            cb(null,'ok');
                        }else{
                            var nameIndex=result.path.lastIndexOf('/');
                            if(nameIndex===-1){
                                nameIndex=result.path.lastIndexOf('\\');
                            }
                            var fileName=result.path.substring(nameIndex+1);
                            var destName=fileName.replace('.','_format.');
                            var dest=result.path.substring(0,nameIndex+1)+destName;
                            var width=0;
                            if(result.width>=result.height){
                                width=1920;
                                scale=1920/result.width;
                            }else{
                                width=1280;
                                scale=1280/result.width;
                            }
                            common.imageResize(dest,result.path,width,null,function (err,rest) {
                                if(err) return cb(err);
                                data_json.stardardImg=rest.local;
                                data_json.standardImg_width=rest.width;
                                data_json.standardImg_height=rest.height;
                                if(result.mark && result.mark.postion){
                                    // data_json.matchImg=result.mark.imgPath;
                                    data_json.matchImg_postion=positionScale(result.mark.postion,scale,data_json.standardImg_width, data_json.standardImg_height);
                                }
                                //save format info
                                result.format={
                                    path:rest.local,
                                    width:rest.width,
                                    height:rest.height,
                                    size:rest.size,
                                    scale:scale
                                }
                                result.markModified('format');
                                result.save(function (err) {
                                    if(err) console.log('save bookimg format err',err);
                                });
                                cb(null,'ok');
                            });
                        }

                    });
                },
                //get answerblock
                function (cb) {
                    var TaskModel=mongoose.model('Task');
                    TaskModel.findOne({_id:taskImg.task},function (err,result) {
                        if(err || !result) return cb('没有找到对应任务');
                        var topics=result.content.topics;
                        if(!topics || topics.length===0) return cb('没有找到题目');
                        var Topic=mongoose.model("Topic");
                        Topic.find({_id:{$in:topics},'image.answerBlock.page':taskImg.pageNum.toString()}).select("_id type image answer").exec(function (err,results) {
                            if(err || results.length===0) return cb('没有符合条件的题目');
                            _.each(results,function (item) {
                                var topicId=item._id.toString();
                                var type=['其他','选择题','判断题','填空题','解答题','多选题'].indexOf(item.type);
                                if(type===-1) type=4;
                                if(type===1){
                                    var answer=sanitizeHtml(item.answer,{
                                        allowedTags: [],
                                        allowedAttributes: []
                                    });
                                    answer=_.trim(answer);
                                    if(answer.length>1){
                                        type=5;
                                    }
                                }

                                _.each(item.image.answerBlock,function (jtem,key) {
                                    var position=_.isArray(jtem.position)?jtem.position:null;
                                    if(!jtem.page || jtem.page!==taskImg.pageNum.toString()) return;
                                    if(!position) return;
                                    data_json.sections.push({
                                        sectionId:topicId+"_"+key,
                                        topicId:topicId,
                                        type:type,
                                        position:positionScale(position,scale,data_json.standardImg_width,data_json.standardImg_height),
                                        subImg_position_r:[0,0,0,0],
                                        text_r:''
                                    });
                                });
                                data_json.section_count=data_json.sections.length;
                            });
                            return cb(null,results);
                        })
                    });
                }
            ],
            function (err,results) {
                if(err){
                    // console.log('err:',err);
                    return done('生成任务失败');
                }
                data_json=JSON.stringify(data_json);
                //call recognize function of c lib
                var recognizeResult=getRecognize(data_json);

                var endTime=Date.now();
                var outJson;
                if(!recognizeResult.result){
                    return done(recognizeResult.data);

                }else{
                    outJson=recognizeResult.data;
                }
                var funcs=[];
                var saveTaskImg=function(cb){
                    var correctImg=outJson.correctImg.split('/');
                    correctImg=correctImg[correctImg.length-1];
                    var srcFile=config.recognizeDir+correctImg;
                    if(!fs.existsSync(srcFile)) return cb('saveTaskImg 图片不存在:'+srcFile);
                    var destPath = '/' + taskImg.user.toString() + '/';
                    var destDir=config.root+'/'+config.dataDir+destPath;
                    common.moveFile(destDir,srcFile,function (err,result) {
                        if(err) return cb("correctImg 图片保存失败:"+err);
                        taskImg.correctImg=destPath+result.filename;
                        taskImg.correctImgPath=result.local;
                        taskImg.updated=beginTime;
                        taskImg.costTime=endTime-beginTime;
                        taskImg.recognizeOut=outJson;
                        taskImg.status='处理成功';
                        taskImg.save(function (err) {
                            if(err) return cb("taskImg 保存失败");
                            cb(null,taskImg);
                        });
                    });

                };
                funcs.push(saveTaskImg);
                if(outJson.status_r && outJson.status_r>0){
                    _.each(outJson.sections,function (item) {
                        funcs.push(function (cb) {
                           //set myanswer
                            item.task=taskImg.task;
                            item.user=taskImg.user;
                            item.taskExe=taskImg.taskExe;
                            var jtem=_.extend({
                                rand:outJson.rand,
                                taskImg:taskImg,
                                task:taskImg.task,
                                user:taskImg.user,
                                taskExe:taskImg.taskExe,
                                originalImg:taskImg.originalImg,
                                correctImg:outJson.correctImg
                            },item);
                            saveMyAnswer(jtem,config,function (err,myAnswer) {
                               if(err) return cb(err);
                                cb(null,myAnswer);
                            });
                        });
                    });
                }
                async.series(funcs,
                    function (handelErr,results) {
                        if(handelErr){
                            return done(handelErr);
                        }
                        //get new myAnswer
                        // console.log("results---:",results);
                        results.unshift();
                        var newAnswers=[];
                        _.each(results,function (item) {
                            if(item){
                                newAnswers.push(item);
                            }
                        });
                        TaskExe
                            .findOne({ _id: taskImg.taskExe })
                            .populate('myAnswers', '_id mark')
                            .exec(function (err, result) {
                                if (err) {
                                    return done('数据库访问失败');
                                }
                                var taskExe = result;
                                if (taskExe) {
                                    var topicsLength = taskExe.topics.length;
                                    var myAnswers = taskExe.myAnswers;
                                    myAnswers=_.concat(myAnswers,newAnswers);
                                    var rightNum = _.filter(myAnswers, { mark: '对' }).length || 0;
                                    var myAnswerIds = [];
                                    var mark=0;
                                    _.each(myAnswers, function (item) {
                                        myAnswerIds.push(item._id);
                                        if(item.mark){
                                            mark++;
                                        }
                                    });
                                    taskExe.myAnswers = myAnswerIds;
                                    if (!taskExe.statistics) {
                                        taskExe.statistics = {
                                            total: taskExe.topics.length,
                                            time: Date.now(),
                                            mark: 0,
                                            right: 0,
                                            rightRate: 0
                                        };
                                    }
                                    taskExe.statistics.mark = mark;
                                    var rightRate = Math.round(rightNum / topicsLength * 100);
                                    taskExe.statistics.time = Date.now();
                                    taskExe.statistics.right = rightNum;
                                    taskExe.statistics.rightRate = rightRate;
                                    taskExe.markModified('myAnswers');
                                    taskExe.markModified('statistics');
                                    taskExe.status='系统批改完成';
                                    taskExe.save(function (err) {
                                        if (err) {
                                            return done('数据库访问失败');
                                        }
                                        console.log("------------ 系统批改完成 ---------------------taskExe:",taskExe._id);
                                        done();
                                    })
                                }
                            });

                    });

            });

    });
// }
    var imgRecognizeQueue={};
    imgRecognizeQueue.add=function (data) {
       var job=queue.create('recognizeImg',data)
           .attempts(1)
           .ttl(300*1000)   //单张图片最大处理时间5分钟
           .save();
        job.on('failed',function (errMessage) {
            onFailed(job,errMessage);
        });
    };
    app.set('imgRecognizeQueue',imgRecognizeQueue);
// };
//查询是否已经回答过 topicIds ; id or ids array
var checkTopicAnswer = function (topicIds, userId, next) {
    if (!_.isArray(topicIds)) {
        topicIds = [topicIds];
    }
    _.each(topicIds, function (item) {
        if (typeof (item) === 'string') {
            item = mongoose.Types.ObjectId(item);
        }
    });
    if (typeof (userId) === 'string') {
        userId = mongoose.Types.ObjectId(userId);
    }
    MyAnswer.find({ topic: { $in: topicIds }, user: userId }, function (err, results) {
        next(err, results);
    });
};
var saveMyAnswer = function (data, config,next) {
    var myAnswer = new MyAnswer();
    async.waterfall([
        function (callback) {
            //检查是否已经回答过
            checkTopicAnswer(data.topicId, data.user, function (err, results) {
                if (err) return callback(err);
                if (results && results.length > 0) {
                    myAnswer = results[0];
                    return callback(null, 'exist');
                } else {
                    myAnswer.user = data.user;
                    myAnswer.topic = mongoose.Types.ObjectId(data.topicId);
                    return callback(null, 'ok');
                }

            });
        },
        function (result, callback) {
            //回答所处位置
            var location = myAnswer.location || {};
            if (data.task) {
                location.taskId = data.task._id.toString();
                location.bookId = data.task.content?data.task.content.bookId:'';
            }
            myAnswer.location = location;
            return callback(null, 'ok');
        },
        function (result, callback) {
            // 识别图片处理
            var sectionImg=data.rand+data.sectionId+'.jpg';
            sectionImg=config.recognizeDir+sectionImg;
            var destPath = '/' + data.user.toString() + '/';
            var destDir=config.root+'/'+config.dataDir+destPath;
            //crop img
            // common.imageCrop(destDir,data.taskImg.correctImgPath,data.subImg_position_r[0],data.subImg_position_r[1],data.subImg_position_r[2]-data.subImg_position_r[0],data.subImg_position_r[3]-data.subImg_position_r[1],function (err,result) {
            common.moveFile(destDir, sectionImg, function (err, result) {
                if (err) return callback(err);
                var index=data.sectionId.split('_');
                index=index[index.length-1];
                // myAnswer.myAnswerImg[index]={
                //     url:destPath+result.fileName,
                //     path:destDir+result.fileName,
                //     taskImg:data.taskImg._id,
                //     originalImg:data.originalImg,
                //     position:data.position,
                //     text:data.text_r
                // };
                myAnswer.myAnswerImg[index]=destPath+result.fileName;
                callback(null,'ok');
            });
        }, function (result, callback) {
            //题目批阅
            if (data.type === 1 && data.text_r) { //选择题自动识别
                Topic.findOne({_id:data.topicId},function (err,result) {
                    if(err) return callback('Topic 数据库访问失败:'+data.topicId);
                    if(!result) return callback('Topic 题目没有找到'+data.topicId);
                    var answer=result.answer;
                    answer=sanitizeHtml(answer,{
                        allowedTags: [],
                        allowedAttributes: []
                    });
                    answer=_.trim(answer.toUpperCase());
                    myAnswer.status = '已批改';

                    if(data.text_r.toUpperCase()===answer){
                        myAnswer.mark = '对';
                    }else{
                        myAnswer.mark = '错';
                    }
                    return callback(null, '已批改');
                });
            } else {
                myAnswer.status = '待批改';
                return callback(null, '待批改');
            }
        }, function (result, callback) {
            var isNew=myAnswer.isNew;
            if(!isNew){
                myAnswer.markModified('myAnswerImg');
            }
            myAnswer.save(function (err) {
                if (err) return callback("myAnswer 数据库操作错误");
                callback(null,isNew);
            });
        }],
        function (err, result) {
            if(err) return next(err);
            if(result){
                next(null,myAnswer);
            }else{
                next();
            }

    })
};