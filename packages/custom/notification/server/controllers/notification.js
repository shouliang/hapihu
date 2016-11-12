'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Notification = mongoose.model('Notification'),
    User = mongoose.model('User'),
    _ = require('lodash'),
    async = require('async');


// 创建一个新消息
function createNotification(noti, callback) {
    var Notification = mongoose.model('Notification');
    var notification = new Notification(noti);
    if (!notification.from) {
        notification.from = {name: '系统'};
    }
    if (!notification.status) {
        notification.status = "未读";
    }

    notification.save(function (err, result) {
        if (err) {
            if (callback) {
                return callback("创建通知失败");
            } else {
                return;
            }
        }
        User.findOne({
            _id: notification.to
        }, function (err, user) {
            if (err) {
                if (callback) {
                    return callback("通知失败");
                } else {
                    return;
                }
            }
            user.notifications = user.notifications || [];
            user.notifications.push(notification._id.toString());
            user.save(function (err) {
                if (err) {
                    if (callback) {
                        return callback("通知失败");
                    } else {
                        return;
                    }
                }
                if (callback) {
                    callback(null, notification);
                }
            });

        });
    });
}

// 站内信(教师和家长互发消息)
function sendMsg(req, res) {
    var to = req.body.to;
    var title = req.body.title || req.body.content;
    var content = req.body.content || '';

    var notification = {
        title: title,
        content: content,
        from: {
            name: req.user.name,
            userId: req.user._id.toString()
        },
        to: to
    };

    createNotification(notification, function (err, noti) {
        if (err) {
            return res.json({result: 0, data: err});
        }
        res.json({result: 1, data: noti});
    })

}

module.exports = function (Notifications) {
    var notification_single = function (noti, callback) {
        if (!noti.to) {
            if (callback) {
                return callback("缺少被通知人");
            } else {
                return;
            }
        }
        var notification = new Notification(noti);
        if (!notification.from) {
            notification.from = {name: '系统'};
        }
        if (!notification.status) {
            notification.status = "未读";
        }
        notification.save(function (err, result) {
            if (err) {
                if (callback) {
                    return callback("创建通知失败");
                } else {
                    return;
                }
            }
            User.findOne({
                _id: notification.to
            }, function (err, user) {
                if (err) {
                    if (callback) {
                        return callback("通知失败");
                    } else {
                        return;
                    }
                }
                user.notifications = user.notifications || [];
                user.notifications.push(notification._id.toString());
                user.save(function (err) {
                    if (err) {
                        if (callback) {
                            return callback("通知失败");
                        } else {
                            return;
                        }
                    }
                    if (callback) {
                        callback(null, notification);
                    }
                });

            });
        });

    };

    return {
        /**
         * Find notification by id
         */
        notification: function (req, res, next, id) {
            Notification.load(id, function (err, notification) {
                if (err) return next(err);
                if (!notification) return next(new Error('Failed to load notification ' + id));
                req.notification = notification;
                next();
            });
        },

        /**
         * Create an notification
         */
        create: function (req, res) {
            var notification = new Notification();
            notification.title = req.body.title || "问题反馈";
            notification.content = req.body.content || "反馈意见";

            notification.from = {
                userId: req.body.userId || '',
                name: req.body.name || '',
                email: req.body.email || '',
                mobile: req.body.mobile || ''
            };

            notification.to = req.body.to || "系统";
            notification.status = "未读";
            notification.markModified('from');

            notification.save(function (err, result) {
                if (err) {
                    res.json({result: 0, data: err});
                }
                res.json({result: 1, data: notification});
            });
        },

        /**
         * Update an notification
         */
        update: function (req, res) {

        },
        /**
         * Delete an notification
         */
        destroy: function (req, res) {
            var notification = req.notification;

            notification.remove(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the notification'
                    });
                }

                res.json(notification);
            });
        },
        /**
         * Show an notification
         */
        show: function (req, res) {
            res.json(req.notification);
        },
        /**
         * List of Notifications
         */
        all: function (req, res) {


        },
        /**
         * 获取user notication
         * @param req
         * @param res
         */
        myNotification: function (req, res) {
            if (!req.user) return res.status(401).send("尚未登录");
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var item = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            async.parallel([
                function (callback) {
                    Notification.count({to: req.user._id.toString()}, function (err, result) {
                        callback(err, result);
                    });
                },
                function (callback) {
                    Notification.find({to: req.user._id.toString()})
                        .sort({created: -1})
                        .skip((page - 1) * item)
                        .limit(item)
                        .exec(function (err, results) {
                            callback(err, results);
                        });
                }
            ], function (err, results) {
                if (err) return res.status(500).send("获取数据失败");
                return res.json({result: 1, data: {count: results[0], list: results[1], page: page, pageItem: item}});
            });

        },

        // 按照from.userId来分组 获取最新的一条消息
        groupByFrom: function (req, res) {
            if (!req.user) return res.status(401).send("尚未登录");
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var item = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            async.parallel([
                function (callback) {
                    Notification.count({to: req.user._id.toString()}, function (err, result) {
                        callback(err, result);
                    });
                },
                function (callback) {
                    Notification.find({to: req.user._id.toString()})
                        .sort({created: -1})                              // 按时间倒序
                        .skip((page - 1) * item)
                        .limit(item)
                        .exec(function (err, results) {
                            callback(err, results);
                        });
                }
            ], function (err, results) {
                if (err) return res.status(500).send("获取数据失败");
                var notifications = _.groupBy(results[1], "from.userId");  // 按from.userId分组

                var userIds = [];
                for (var key_userId in notifications) {
                    if (key_userId && key_userId!=='undefined') {
                        userIds.push(mongoose.Types.ObjectId(key_userId));
                    }

                }
                User.find({_id: {$in: userIds}})
                    .select({_id: 1, username:1,name:1, head:1, profile: 1})
                    .exec()
                    .then(function (users) {
                        var newNotifications = [];
                        for (var key_userId in notifications) {
                            var newNoti = notifications[key_userId][0];// 只取最新的一条

                            if (key_userId && key_userId!=='undefined') {
                                var user = _.find(users, {_id: mongoose.Types.ObjectId(key_userId)});
                                if (user) {
                                    newNoti.from = user;
                                }
                            }

                            newNotifications.push(newNoti);
                        }

                        return res.json({
                            result: 1,
                            data: {count: newNotifications.length, list: newNotifications, page: page, pageItem: item}
                        });
                    })
                    .then(null,function (err) {
                        res.json({result: 0, data: err || err.message})
                    })

            });

        },

        myNotificationWithOne: function (req, res) {
            if (!req.user) return res.status(401).send("尚未登录");
            var page = req.query.page ? parseInt(req.query.page) : 1;
            var item = req.query.pageItem ? parseInt(req.query.pageItem) : 20;
            var to = req.query.to;
            async.parallel([
                function (callback) {
                    Notification.count({
                            $or: [{'from.userId': req.user._id.toString(), to: to},
                                {'from.userId': to, to: req.user._id}]
                        },
                        function (err, result) {
                            callback(err, result);
                        });
                },
                function (callback) {
                    Notification
                        .find({
                            $or: [{'from.userId': req.user._id.toString(), to: to},
                                {'from.userId': to, to: req.user._id}]
                        })
                        .sort({created: -1})
                        .skip((page - 1) * item)
                        .limit(item)
                        .exec(function (err, results) {
                            callback(err, results);
                        });
                }
            ], function (err, results) {
                if (err) return res.status(500).send("获取数据失败");
                return res.json({result: 1, data: {count: results[0], list: results[1], page: page, pageItem: item}});
            });

        },

        /**
         * notified single user
         */
        single: notification_single,
        /**
         * notified multiple user
         */
        multiple: function (noti, callback) {
            if (!noti || !noti.to) {
                if (callback) return callback('缺少参数');
            }

            if (_.isArray(noti.to)) {
                _.each(noti.to, function (item) {
                    if (item) {
                        var newNoti = _.extend({}, noti);
                        newNoti.to = item;
                        notification_single(newNoti, callback);
                    }
                })
            } else {
                notification_single(noti, callback);
            }
        },


        /***
         * get user new nNotification
         */
        newNotification: function (req, res, next) {
            if (!req.user) return res.status(400).send("尚未登陆");
            var notificationIds = req.user.notifications;
            if (!notificationIds || notificationIds.length === 0) {
                return res.json({result: 0, data: null});
            }
            Notification.find({_id: {$in: notificationIds}}, function (err, results) {
                if (err) return res.status(400).send("查询失败");
                return res.json({result: 1, data: results});
            });
        },
        /***
         * clear user new nNotification
         */
        clearNewNotification: function (req, res, next) {
            if (!req.user) return res.status(400).send("尚未登陆");
            var notificationIds = req.user.notifications;
            if (!notificationIds || notificationIds.length === 0) {
                return res.json({result: 1, data: null});
            }
            var user = req.user;
            user.notifications = [];
            user.save(function (err) {
                if (err) return res.status(400).send("出错了");
                Notification.update({_id: {$in: notificationIds}}, {$set: {status: '已读'}}, function (err, results) {
                    if (err) return res.status(400).send("出错了");
                    return res.json({result: 1, data: results});
                });
            });

        },

        sendMsg: sendMsg
    };
};