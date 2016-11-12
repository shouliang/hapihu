/* globals require */
(function() {
  'use strict';
  var fs=require("fs"),
      path=require('path'),
      FileStreamRotator = require('file-stream-rotator');
  module.exports = function(app, config) {
    var format, options;

    if (config !== false) {
      config = config || {};
      var dir=config.path || '../../logs';
      //single file
      // var accessLogStream = fs.createWriteStream(path.join(__dirname,dir, 'access.log'), {flags: 'a'});
      // file rotation
      var accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: path.join(__dirname,dir, 'access-%DATE%.log'),
        frequency: 'daily',
        verbose: false
      });
      format  = config.format || 'dev';
      options = config.options || {stream:accessLogStream};

      app.use(require('morgan')(format, options));
    }
  };

})();