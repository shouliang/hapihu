'use strict';

angular.module('mean.system')
  .run(['$rootScope','$state','$window','$location', function($rootScope,$state,$window,$location) {
      // $rootScope.$on('$stateChangeStart',function (event, toState, toParams, fromState, fromParams) {
      //     console.log('$stateChangeStart from:',fromState,toState);
      // });
      $rootScope.goBack=function (stateName) {
          if(!stateName){
              return  $window.history.back();
          }
          $state.go(stateName);
      };
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        // console.log(event,toState,toParams);
        $rootScope.stateName=toState.name;
        var toPath = $location.url();
        if(_hmt){
            _hmt.push(['_trackPageview', toPath]);
        }
      // toPath = toPath.replace(new RegExp('/', 'g'), '');
      // toPath = toPath.replace(new RegExp(':', 'g'),'-');
      // toPath = toPath.split(new RegExp('[?#]'))[0];
      // $rootScope.state = toPath;
      // if($rootScope.state === '' ) {
      //   $rootScope.state = 'firstPage';
      // }
    });
//       $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
//           console.log('$stateChangeStart to '+toState.to+'- fired when the transition begins. toState,toParams : \n',toState, toParams);
//       });
//       $rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams, error){
//           console.log('$stateChangeError - fired when an error occurs during transition.');
//           console.log(arguments);
//       });
//       $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
//           console.log('$stateChangeSuccess to '+toState.name+'- fired once the state transition is complete.');
//       });
// // $rootScope.$on('$viewContentLoading',function(event, viewConfig){
// //   // runs on individual scopes, so putting it in "run" doesn't work.
// //   console.log('$viewContentLoading - view begins loading - dom not rendered',viewConfig);
// // });
//       $rootScope.$on('$viewContentLoaded',function(event){
//           console.log('$viewContentLoaded - fired after dom rendered',event);
//       });
//       $rootScope.$on('$stateNotFound',function(event, unfoundState, fromState, fromParams){
//           console.log('$stateNotFound '+unfoundState.to+'  - fired when a state cannot be found by its name.');
//           console.log(unfoundState, fromState, fromParams);
//       });
  }]);
