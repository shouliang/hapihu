(function () {
  'use strict';

  angular
    .module('mean.books')
    .config(books);

  books.$inject = ['$stateProvider'];

  function books($stateProvider) {
    $stateProvider.state('all books', {
      url: '/books?:grade&subject',
      templateUrl: 'books/views/index.html'
    })
    .state('admin books', {
      url: '/admin/books',
      templateUrl: 'books/views/admin/books.html'
    })
    .state('book editions', {
      url: '/admin/books/editions',
      templateUrl: 'books/views/admin/editions.html'
    })
    .state('vendor books', {
      url: '/vendor/books?:grade&subject',
      templateUrl: 'books/views/vendor/books.html'
    })
    .state('create book', {
      url: '/vendor/books/create',
      templateUrl: 'books/views/vendor/create.html'
    })
    .state('edit book', {
      url: '/vendor/books/edit/:bookId',
      templateUrl: 'books/views/vendor/create.html'
    })
    .state('book catalogue', {
      url: '/vendor/book/catalogue/:bookId',
      templateUrl: 'books/views/vendor/catalogue.html'
    })
    .state('book images', {
      url: '/vendor/book/images/:bookId',
      templateUrl: 'books/views/vendor/images.html'
    })
    .state('vendor book', {
      url: '/vendor/book/:bookId?catalogue',
      templateUrl: 'books/views/vendor/book.html'
    })
    .state('admin questions', {
      url: '/admin/questions',
      templateUrl: 'books/views/admin/questions.html'
    })
    .state('admin knowledgeSystem list', {
      url: '/admin/knowledgeSystems',
      templateUrl: 'books/views/admin/knowledge-system-list.html'
    })
    .state('admin knowledgeSystem', {
      url: '/admin/knowledgeSystem/:knowledgeSystemId',
      templateUrl: 'books/views/admin/knowledge-system.html'
    })
    .state('create knowledgeSystem', {
      url: '/admin/knowledgeSystem-create',
      templateUrl: 'books/views/admin/knowledge-system-create.html'
    })
    .state('create question',{
      url:'/question/create?bookId&path',
      templateUrl: 'books/views/question/create.html'
    })
    .state('edit question',{
      url:'/question/edit/:topicId',
      params:{
        question:null
      },
      templateUrl: 'books/views/question/create.html'
    })
    .state('save resource', {
      url: '/resource/save/:resourceId',
      templateUrl: 'books/views/resource/save.html'
    })
    .state('resources', {
      url: '/resources?page&pageItem&subject&grade',
      templateUrl: 'books/views/resource/index.html'
    })
    .state('admin resources', {
      url: '/admin/resources?page&pageItem&subject&grade&status&title',
      templateUrl: 'books/views/admin/resources.html'
    })
    .state('teacher book', {
      url: '/teacher/book?bookId&path',
      templateUrl: 'books/views/teacher/book.html'
    })
    .state('teacher books', {
      url: '/teacher/books',
      templateUrl: 'books/views/teacher/books.html'
    })
    .state('teacher bookstore', {
      url: '/teacher/bookstore',
      templateUrl: 'books/views/teacher/bookstore.html'
    })
    .state('student book', {
      url: '/student/book?bookId&bookType&path',
      templateUrl: 'books/views/student/book.html'
    })
    .state('student books', {
      url: '/student/books',
      templateUrl: 'books/views/student/books.html'
    })
    .state('student bookstore', {
      url: '/student/bookstore',
      templateUrl: 'books/views/student/bookstore.html'
    })
    .state('book', {
      url: '/book/:bookId',
      templateUrl: 'books/views/book.html'
    })
    .state('create knowledge', {
      url: '/admin/knowledgeSystem/create',
      templateUrl: 'books/views/admin/knowledgeSystem-create.html'
    })
        .state('paper preview', {
          url: '/paper/preview',
          templateUrl: 'books/views/admin/paper-preview.html'
        })
    ;
  }

})();
