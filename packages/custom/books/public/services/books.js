(function () {
  'use strict';

  angular
    .module('mean.books')
    .factory('Books', Books);

  Books.$inject = ['$resource','$http'];

  function Books($resource,$http) {
    return {
      name: 'books',
      vendorBooks:$resource('api/vendor/books/:bookId', {
          bookId: '@_id'
        }, {
          update: {
            method: 'PUT'
          }
        }),
      vendorLatestUpdated:$resource('api/vendor/books/latestUpdated', {}),
      vendorBook:$resource('api/vendor/book/:bookId', {
        bookId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      adminBooks:$resource('api/admin/books/:bookId', {
        bookId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      adminEditions:$resource('api/admin/editions/:editionId', {
        editionId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      adminQuestions:$resource('api/vendor/topics/:topicId', {
        topicId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      vendorTopics:$resource('api/vendor/topics/:topicId', {
        topicId: '@_id'
      }, {
        update: {
          method: 'PUT'
        },
        search:{
          method:'POST'
        },
        remove:{
          method:"DELETE",
          inBook:'@inBook'
        }
      }),
      topics:$resource('api/topics/:topicId',{
        topicId:'@topicId'
      },{
        query:{
          method:'POST',
          isArray:false
        }
      }),
      answerTopic:$resource('api/answerTopic/:topicId',{
        topicId:'@topicId'
      }),
      myAnswer:$resource('api/myAnswer/:myAnswerId',{
        myAnswerId:'@myAnswerId'
      }),
      books:$resource('api/books/:bookId', {
        bookId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      book:$resource('api/book/:bookId', {
        bookId: '@_id'
      }),
      bookImage:$resource('api/vendor/bookImage/:id', {
        bookId: '@id'
      },{
        update:{
          method:'PUT'
        }
      }),
      bookImageUpload:$resource('api/vendor/bookImage/bulkCreate/:bookId', {
        bookId: '@bookId'
      }),
      teacherBook:$resource('api/tbook/:bookId', {
        bookId: '@bookId'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      studentBook:$resource('api/sbook/:bookId', {
        bookId: '@bookId',
        bookType:'@bookType'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      bookOrder:$resource('api/orderbook/:bookId', {
        bookId: '@bookId'
      }, {
        update: {
          method: 'PUT'
        }
      }),
      orderStatus:function(bookId){
        return $http({method:'GET',url:'api/orderstatus/'+bookId});
      },
      synchronize: function(bookId) {
        return $http({method:'GET',url:'api/vendor/synchronize/'+bookId});
      }
    };
  }
})();
