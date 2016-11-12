'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var Book=mongoose.model('Book');



/**
 * StudentBook Schema
 */
var StudentBookSchema = new Schema({
  bookId:{
    type:String
  },
  teacherBookId:{
    type:String
  },
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  verificationCode:{
    type:String,
  },
  grade:{
    type:String
  },
  session:{
    type:String
  },
  subject:{
    type:String
  },
  edition:{
    type:String,
  },
  cover:{
    type:String,
  },
  tags:{
    type:Array
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updated: {
    type: Array,
  },
  myAnswers:{ //放置已经回答的问题
    type: Array
  },
  photos:{
    type:Array
  }
});


/**
 * Statics
 */
StudentBookSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(function (err,studentBook) {
    if(err) return cb(err);
    if(!studentBook) return cb(err,studentBook);
    if(studentBook.teacherBookId){
      var  TeacherBook=mongoose.model('TeacherBook');
      TeacherBook.load(studentBook.teacherBookId,function (err,book) {
        if(err) return cb(err);
        studentBook._doc.book=book; // 为model 增加属性， model._doc.xxx
        return cb(null,studentBook);
      });
    }else{
      Book.load(studentBook.bookId,function (err,book) {
        if(err) return cb(err);
        studentBook._doc.book=book; // 为model 增加属性， model._doc.xxx
        return cb(null,studentBook);
      });
    }


  });
};

mongoose.model('StudentBook', StudentBookSchema);
