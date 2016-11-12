'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    KnowledgeSystem = mongoose.model('KnowledgeSystem'),
    Knowledge = mongoose.model('Knowledge'),
    config = require('meanio').loadConfig(),
    _ = require('lodash'),
    async = require('async');

// 递归生成知识点
function getNodes(parentNode, allNode) {
    for (var i = 0; i < parentNode.length; i++) {
        var parentNode_id = parentNode[i]._id;
        var childNode = _.orderBy(_.filter(allNode, {parent: parentNode_id}), ['orderIndex'], ['asc']);
        getNodes(childNode, allNode);
        parentNode[i].children = childNode;
    }

    return parentNode;
}

// 递归将知识点树生成数组
function setNodesToArray(nodeArray, nodes, parent) {
    var orderIndex = 0;
    for (var i = 0; i < nodes.length; i++) {
        var nodeObj = nodes[i];
        orderIndex = orderIndex + 1;
        var childrenParent = new mongoose.Types.ObjectId;
        var tempNodeObj = {
            _id: nodeObj._id || childrenParent,
            title: nodeObj.title,
            level: nodeObj.level,
            parent: nodeObj.parent || parent,
            systemId: nodeObj.systemId,
            orderIndex: orderIndex,
            flag: nodeObj.flag
        }
        nodeArray.push(tempNodeObj);
        if (nodeObj && nodeObj.children && nodeObj.children.length > 0) {
            setNodesToArray(nodeArray, nodeObj.children, childrenParent);
        }
    }

    return nodeArray;
}

module.exports = function () {
    return {
        /**
         * Find Knowledge by id
         */
        knowledge: function (req, res, next, id) {
            Knowledge.load(id, function (err, knowledge) {
                if (err) return next(err);
                if (!knowledge) return next(new Error('Failed to load Knowledge ' + id));
                req.knowledge = knowledge;
                next();
            });
        },
        // 添加知识点
        create:function (req,res) {
            var knowledge=new Knowledge(req.body);
            knowledge.parent=mongoose.Types.ObjectId(knowledge.parent);
            knowledge.systemId=mongoose.Types.ObjectId(knowledge.systemId);
            knowledge.user=req.user._id;
            knowledge.save(function (err,result) {
               if(err) return res.status(500).send('数据库访问错误');
                res.json(result);
            });
        },
        // 添加知识点
        destroy:function (req,res) {
            var knowledge = req.knowledge;
            knowledge.remove(function (err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the Knowledge'
                    });
                }
                res.json(knowledge);
            });
        },
        /**
         * add delete update an Knowledge
         */
        // update: function (req, res) {
        //     if (req.body.nodes) {
        //         var nodes = req.body.nodes;
        //     }
        //
        //     // var nodes = [
        //     //     {
        //     //         "_id": "57b5622e2697708462bd8359",
        //     //         "title": "代数111",
        //     //         "level": 1,
        //     //         "parent": "57b5622d2697708462bd8343",
        //     //         "systemId": "57b5622d2697708462bd8343",
        //     //         "orderIndex": 1,
        //     //         "children": [
        //     //             {
        //     //                 "_id": "57b5622e2697708462bd83d0",
        //     //                 "title": "集合111",
        //     //                 "level": 2,
        //     //                 "parent": "57b5622e2697708462bd8359",
        //     //                 "systemId": "57b5622d2697708462bd8343",
        //     //                 "orderIndex": 1,
        //     //                 "children": [
        //     //                     {
        //     //                         "_id": "57b5622e2697708462bd8a35",
        //     //                         "title": "集合的含义111",
        //     //                         "level": 3,
        //     //                         "parent": "57b5622e2697708462bd83d0",
        //     //                         "systemId": "57b5622d2697708462bd8343",
        //     //                         "orderIndex": 1,
        //     //                         "children": []
        //     //                     },
        //     //                     {
        //     //                         "_id": "57b5622e2697708462bd8a36",
        //     //                         "title": "元素与集合关系的判断",
        //     //                         "level": 3,
        //     //                         "parent": "57b5622e2697708462bd83d0",
        //     //                         "systemId": "57b5622d2697708462bd8343",
        //     //                         "orderIndex": 2,
        //     //                         "children": [],
        //     //                         "flag": "delete"
        //     //                     },
        //     //                     {
        //     //                         "_id": "57b5622e2697708462bd8a37",
        //     //                         "title": "集合的确定性、互异性、无序性",
        //     //                         "level": 3,
        //     //                         "parent": "57b5622e2697708462bd83d0",
        //     //                         "systemId": "57b5622d2697708462bd8343",
        //     //                         "orderIndex": 3,
        //     //                         "children": []
        //     //                     },
        //     //                     {
        //     //                         "_id": "57b5622e2697708462bd8a38",
        //     //                         "title": "集合的分类",
        //     //                         "level": 3,
        //     //                         "parent": "57b5622e2697708462bd83d0",
        //     //                         "systemId": "57b5622d2697708462bd8343",
        //     //                         "orderIndex": 4,
        //     //                         "children": []
        //     //                     }, {
        //     //                         "title": "add集合的分类add",
        //     //                         "level": 3,
        //     //                         "parent": "57b5622e2697708462bd83d0",
        //     //                         "systemId": "57b5622d2697708462bd8343",
        //     //                         "children": [],
        //     //                         "flag": "add"
        //     //                     }
        //     //
        //     //                 ]
        //     //             }
        //     //         ]
        //     //     },
        //     //     {
        //     //         "title": "代数222",
        //     //         "level": 1,
        //     //         "parent": "57b5622d2697708462bd8343",
        //     //         "systemId": "57b5622d2697708462bd8343",
        //     //         "flag": "add"
        //     //     }
        //     // ];
        //
        //     var nodeArray = [];
        //
        //     setNodesToArray(nodeArray, nodes);
        //
        //     var tasks = [];
        //
        //     for (var i = 0; i < nodeArray.length; i++) {
        //         tasks.push(
        //             (function (node) {
        //                 switch (node.flag) {
        //                     case "add":
        //                         return function (callback) {
        //                             var knowledge = new Knowledge(node);
        //                             knowledge.user = req.user._id;
        //                             knowledge.save(callback);
        //                         };
        //                         break;
        //                     case "delete":
        //                         return function (callback) {
        //                             Knowledge.removeById(node._id, callback);
        //                         };
        //                         break;
        //                     default :
        //                         return function (callback) {
        //                             Knowledge.findAndUpdate(node._id, {
        //                                 title: node.title,
        //                                 orderIndex: node.orderIndex
        //                             }, callback);
        //                         };
        //                 }
        //             })(nodeArray[i])
        //         );
        //     }
        //
        //     async.parallel(tasks, function (err, results) {
        //         if (err) {
        //             return res.status(500).json({
        //                 error: 'Cannot delete the Knowledge'
        //             });
        //         }
        //         res.status(200).json({success: 1});
        //     });
        //
        //
        // },
        //更新知识点
        update:function (req,res) {
            var knowledge = req.knowledge;
            knowledge=_.extend(knowledge,req.body);
            knowledge.save(function (err) {
                if (err) {
                    return res.status(500).json('访问数据库失败');
                }
                res.json(knowledge);
            });
        },
        /**
         * List of Knowledges
         */
        all: function (req, res) {
            var conditions = {};
            // TODO 测试数据 待删除
            // req.query.systemId = ("57b5622d2697708462bd8343");

            // 根据知识体系查询
            if (req.query.systemId) {
                conditions.systemId = req.query.systemId;
            }

            var parentContions = {};

            // TODO 测试数据 待删除
            //req.query.title = new RegExp('数学');//模糊查询参数

            // 根据知识点名称模糊查询
            if (req.query.title) {
                conditions.title = new RegExp(req.query.title);
            } else {
                // 非知识点名称查询时 level模式为1
                parentContions.level = 1;
            }

            // 查询特定知识点的所有子知识点
            // TODO 测试数据 待删除
            // req.query.knowledgeId = '57b5622e2697708462bd8a37';

            if (req.query.knowledgeId) {
                parentContions._id = req.query.knowledgeId;
            }

            Knowledge.find(conditions).sort('sortIndex').exec(function (err, results) {
                if (err) {
                    return res.status(500).json({
                        error: 'query Knowledge is err'
                    });
                }
                var allKnowledgeByConditions = [];
                for (var i = 0; i < results.length; i++) {
                    allKnowledgeByConditions.push({
                        _id: results[i]._id,
                        title: results[i].title,
                        level: results[i].level,
                        parent: results[i].parent,
                        systemId: results[i].systemId,
                        orderIndex: results[i].orderIndex,
                        children: []
                    });
                }

                // 查询特定知识点时手动过滤 lodash通过id过滤貌似有点问题
                var parentNodes = [];
                if (req.query.knowledgeId) {
                    for (var i = 0; i < allKnowledgeByConditions.length; i++) {
                        if (allKnowledgeByConditions[i]._id == parentContions._id) {
                            parentNodes.push(allKnowledgeByConditions[i]);
                        }
                    }
                } else {
                    parentNodes = _.orderBy(_.filter(allKnowledgeByConditions, parentContions), ['orderIndex'], ['asc']);
                }

                var jsonData = getNodes(parentNodes, allKnowledgeByConditions);
                res.json({result:1,data:{count:jsonData.length,list:jsonData}});
            });
        },

        // 获取level=1的知识点 或者 根据parent获得第一层级的子知识点
        getFirstChildrens: function (req, res) {
            var conditions = {};

            if (req.query.systemId) {
                conditions.systemId = req.query.systemId;
            }

            if (req.query.level) {
                conditions.level = req.query.level;
            }

            if (req.query.parent) {
                conditions.parent = req.query.parent;
            }

            Knowledge.find(conditions).sort('sortIndex').exec(function (err, results) {
                if (err) {
                    return res.status(500).json({
                        error: 'query Knowledge is err'
                    });
                }
                var allKnowledge = [];
                for (var i = 0; i < results.length; i++) {
                    allKnowledge.push({
                        _id: results[i]._id,
                        title: results[i].title,
                        orderIndex: results[i].orderIndex
                    });
                }

                var firstChildrens = _.orderBy(_.filter(allKnowledge, {}), ['orderIndex'], ['asc']);

                res.json(firstChildrens);
            });
        }
    };
}

