'use strict';
var mean = require('meanio'),
    mongoose = require('mongoose'),
    Zone = mongoose.model('Zone'),
    School = mongoose.model('School'),
    Company = mongoose.model('Company'),
    _ = require('lodash'),
    config = mean.loadConfig(),
    async = require('async'),
    fs = require('fs'),
    path = require('path'),
    imageSize = require('image-size');

 var sharp = require('sharp');



module.exports = function (System) {
    //base64 转二进制
    var decodeBase64Image = function (dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            result = {};

        if (matches.length !== 3) {
            return null;
        }

        result.type = matches[1];
        result.data = new Buffer(matches[2], 'base64');
        return result;
    };
    // 同步建立多层文件夹
    var mkdirsSync = function (dirpath, mode) {

        if (!fs.existsSync(dirpath)) {
            var pathtmp;
            dirpath.split(/[\///]/).forEach(function (dirname, key) {
                if (!dirname && key === 0) {
                    pathtmp = '/';
                    return;
                }
                ;
                if (pathtmp) {
                    pathtmp = path.join(pathtmp, dirname);
                }
                else {
                    pathtmp = dirname;
                }
                if (!fs.existsSync(pathtmp)) {
                    if (!fs.mkdirSync(pathtmp, mode)) {
                        return false;
                    }
                }
            });
        }
        return true;
    };
  return {
    upload:function (req,res,next) {
      req.file('file').upload({
        dirname:config.root+'/'+config.dataDir+'/uploads'
      },function (err, uploadedFiles){
        if (err) return res.send(500, err);
        var result=[];
        for(var i=0;i<uploadedFiles.length;i++){
          var name=uploadedFiles[i].fd.split(/[\/\\]/);
          name=name[name.length-1];
          result.push({
            name:name,
            url:'/uploads/'+name,
            size:uploadedFiles[i].size,
            type:uploadedFiles[i].type
          });
        }
        return res.json(result);
      });
    },
    /**
     *
     * @param src uploaded address ,exclude datadir
     * @param dest destination dirctory exclude datadir
     * @param callback callback function
       * @returns {*}
       */
    moveUpload:function (src,destDir,callback) {
      // console.log("move Upload:",src,destDir);
      var pathRoot=config.root+'/'+config.dataDir;
      var srcPath=pathRoot+src;
      var statInfo=fs.existsSync(srcPath);
      if(!statInfo){
        return callback('文件不存在:'+src);
      }

            if (destDir.substr(-1, 1) !== "/") destDir = destDir + "/";
            var srcArray = src.split("/");
            var dest = destDir + srcArray[srcArray.length - 1];
            var destPathArray = dest.split('/');
            var destPath = config.root + '/' + config.dataDir;
            var tasks = [];
            _.forEach(destPathArray, function (item, key) {
                if (!item) return;
                if (key === destPathArray.length - 1) {

                    tasks.push(function (callback) {
                        destPath = destPath + '/' + item;
                        fs.rename(srcPath, destPath, function (err) {
                            if (err) return callback("文件移动失败");
                            callback(null, 'ok')
                        });

                    });
                } else {

                    tasks.push(function (callback) {
                        destPath = destPath + '/' + item;
                        var statInfo = fs.existsSync(destPath);
                        if (!statInfo) {
                            fs.mkdir(destPath, function (err) {
                                if (err) {
                                    return callback('文件夹创建失败：' + destPath);
                                }
                                return callback(null, 'ok')
                            })
                        } else {
                            callback(null, 'ok');
                        }

                    });
                }
            });
            async.series(tasks, function (err, results) {
                if (err) {
                    return callback(err)
                }
                var postfix = destPath.split('.');
                postfix = postfix[postfix.length - 1];
                var width, height;
                if (postfix && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'tiff'].indexOf(postfix.toLowerCase()) !== -1) {
                    var size = imageSize(destPath);
                    width = size.width;
                    height = size.height;
                }

                return callback(null, {local: destPath, url: dest, width: width, height: height});
            });
        },
      // 图片move，destFile,srcFile 都是绝对地址
      moveFile:function (destDir,srcFile,next) {
          console.log("moveFile:",destDir,srcFile);
          if(!srcFile || !fs.existsSync(srcFile)) {
              console.log("moveFile err srcFile not exist:",srcFile);
              return next('图片不存在');
          }
          if(destDir.substr(-1,1)!=='/') destDir=destDir+'/';
          if(mkdirsSync(destDir)){
              var fileName=srcFile.split('/');
              fileName=fileName[fileName.length-1];
              var destFile=destDir+fileName;
              fs.rename(srcFile, destFile, function(err) {
                  if (err) return next("文件移动失败");
                  return next(null,{local:destFile,fileName:fileName});
              });
          }else{
              next('创建目录失败');
          }


      },
        // 把base64格式的图片保存到本地
        getPngFileFromBase64:function (dataString,destDir,next) {
          if(!dataString) return next('图片不存在');
          var imageBuffer = decodeBase64Image(dataString);
          var destPath=config.root+'/'+config.dataDir;
          if(destDir.substr(0,1)!=='/') destDir='/'+destDir;
          if(destDir.substr(-1,1)!=='/') destDir=destDir+'/';
          destPath=destPath+destDir;
          if(mkdirsSync(destPath)){
            var fileName=Date.now()+'.png';
            var filePath=destPath+fileName;
            fs.writeFile(filePath, imageBuffer.data, function(err) {
              if(err) return next('创建图片失败');
              var size=imageSize(filePath);
              var width=size.width;
              var height=size.height;
              return next(null,{local:filePath,fileName:fileName,url:destDir+fileName,width:width,height:height});
            });
          }else{
            next('创建目录失败');
          }


        },
        //切割图片
        imageCrop:function (destDir,src,x,y,width,height,next) {
            console.log("cropImg:",destDir,src);
            if(!src || !fs.existsSync(src)) return next('图片不存在');
            if(destDir.substr(-1,1)!=='/') destDir=destDir+'/';
            if(mkdirsSync(destDir)){
                var fileName=src.split('/');
                fileName=fileName[fileName.length-1];
                var destFile=destDir+fileName;
                sharp(src)
                    .extract({ left: x, top: y, width: width, height: height })
                    .quality(100)
                    .toFile(destFile,function (err) {
                        if(err) {
                            console.log("cropImg err:",err);
                            return next('截取失败');
                        }
                        next(null,{local:destFile,width:width,height:height});
                    });
            }else{
                next('创建目录失败');
            }
        },
      //格式化图片 dest : dest file ,src:src file
        imageResize:function (dest,src,width,height,next) {
            console.log("imageResize:",dest,src);
            if(!src || !fs.existsSync(src)) return next('图片不存在');
            var destDir=dest.lastIndexOf('/');
            if(destDir===-1){
                destDir=dest.lastIndexOf('\\');
            }
            destDir=dest.substring(0,destDir+1);
            if(mkdirsSync(destDir)){
                var fileName=src.split('/');
                fileName=fileName[fileName.length-1];
                sharp(src)
                    .resize(width,height)
                    .flatten()
                    .toFile(dest,function (err,info) {
                        if(err) {
                            console.log("imageResize err:",err);
                            return next('图片尺寸变换失败');
                        }
                        // console.log("info:",info);
                        next(null,{local:dest,width:info.width,height:info.height,size:info.size});
                    });
            }else{
                next('创建目录失败');
            }

        },
        // 锐化图片 dest : dest file ,src:src file
        imageSharpen:function (dest,src,next) {
          console.log("imageSharpen:",dest,src);
          if(!src || !fs.existsSync(src)) return next('图片不存在');
          var destDir=dest.lastIndexOf('/');
          if(destDir===-1){
              destDir=dest.lastIndexOf('\\');
          }
          destDir=dest.substring(0,destDir+1);
          if(mkdirsSync(destDir)){
              var fileName=src.split('/');
              fileName=fileName[fileName.length-1];
              var img=sharp(src);
              img.metadata()
                  .then(function (metadata) {
                      if(metadata.width>2400){
                          var formatWidth=2200;
                          return img.resize(formatWidth);
                      }
                      return img;
                  })
                  .then(function (data) {
                      img.flatten()
                          .sharpen()
                          .toFile(dest,function (err,info) {
                              if(err) {
                                  console.log("imageSharpen err:",err);
                                  return next('图片锐化失败');
                              }
                              // console.log("info:",info);
                              next(null,{local:dest,width:info.width,height:info.height,size:info.size});
                          });
                  });
          }else{
              next('创建目录失败');
          }

        },
        getSchool: function (req, res, next) {
            var conditions = {};
            if (req.query.id) {
                conditions = {_id: req.query.id};
            }
            if (req.query.name) {
                conditions.name = req.query.name;
            }
            School.findOne(conditions, function (err, result) {
                // console.log("get school from db:",err,result);
                if (err) {
                    return res.status(400).json({status: 400, result: 0, data: "系统错误，请稍候重新尝试"});
                }
                return res.json({status: 200, result: 1, data: result});
            });
        },
        searchSchools: function (req, res, next) {
            var query = {};
            if (req.query.zone) {
                query.zone = req.query.zone;
            }
            if (req.query.status === 'all') {
                // query.status=null;
            } else {
                query.status = req.query.status;
            }
            if (req.query.keyword) {
                query.keyword = req.query.keyword;
            } else {
                if (!req.query.status) {
                    query.status = 'confirmed';
                }
            }

            if (req.query.page) {
                query.page = parseInt(req.query.page);
            } else {
                query.page = 1;
            }

            var ItemInPage = 20;
            ItemInPage = parseInt(req.query.pageItem) ? parseInt(req.query.pageItem) : ItemInPage;
            if (query.keyword) {
                var keywords = query.keyword.replace(/\s+/g, '[\\s\\S]*');
                var reg = new RegExp(keywords, 'g');
            }
            async.parallel([function (callback) {
                //query count
                var conditions = {};

                if (query.keyword) {
                    conditions = {name: reg};
                }
                if (query.status) {
                    conditions.status = query.status;
                }
                if (query.zone) {
                    conditions.postcode = {$all: query.zone};
                }

                School.count(conditions, function (err, result) {
                    callback(err, result);
                })
            }, function (callback) {
                //query results
                var q = School.find();
                if (query.keyword) {
                    q = School.find({name: reg});
                }
                if (query.zone) {
                    q.where('postcode').all(query.zone);
                }
                if (query.status) {
                    q.where('status').equals(query.status);
                }
                q.skip((query.page - 1) * ItemInPage).sort('created').limit(ItemInPage).exec(function (err, results) {
                    callback(err, results);
                });
            }], function (err, results) {
                // console.log("searchSchools from db:",err,results);

                if (err) {
                    res.status(400).json({status: 400, result: 0, data: {}});
                } else {
                    res.json({
                        status: 200,
                        result: 1,
                        data: {count: results[0], list: results[1], page: query.page, pageItem: ItemInPage}
                    });
                }
            });
            // var q=School.find();
            // if(query.keyword){
            //   q=School.find({name:{$regex:query.keyword}});
            // }
            // if(query.zone){
            //   q.where('postcode').all(query.zone);
            // }
            // q.skip(query.page*ItemInPage).limit(ItemInPage).exec(function (err,data) {
            //
            //   var status=200,result=1;
            //   if(err){
            //     console.log("searchSchools from db error:",err,data);
            //     status=400;
            //     result=0;
            //     res.status(400).json({status:status,result:result,data:{}});
            //   }else{
            //     res.json({status:status,result:result,data:data});
            //   }
            // });
            // res.json({status:200,count:1,results:[{value:"第一中学"}]});

        },
        getZones: function (req, res, next) {
            // console.log('get zones:');
            Zone.find(function (err, data) {
                // console.log("getZones:",data);
                var status = 200;
                if (err) {
                    status = 400;
                    res.status(400).send("出错了");
                } else {
                    res.json({status: status, result: 1, data: data});
                }

            })
        },
        getAdvices: function (rightRate) {
            var advices=[
                {
                    min:0,
                    max:60,
                    mark:'较差',
                    content:'此知识点还未能掌握，请继续学习'
                },
                {
                    min:60,
                    max:70,
                    mark:'一般',
                    content:'此知识点基本一般，建议继续学习'
                },
                {
                    min:70,
                    max:85,
                    mark:'良好',
                    content:'此知识点基本掌握'
                },
                {
                    min:75,
                    max:101,
                    mark:'很好',
                    content:'此知识点很好的掌握了'
                }
            ];

            for (var i = 0; i < advices.length; i++) {
                if (rightRate >= advices[i].min && rightRate < advices[i].max) {
                    return advices[i];
                }
            }

            return {};
        }
    };
};


//移动图片
exports.moveUpload = function () {

}