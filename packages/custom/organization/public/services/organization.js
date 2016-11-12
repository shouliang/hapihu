angular
    .module('mean.organization')
    .factory('Organization', function ($resource,$http) {
        return{
            organization:$resource('/api/organization/:schoolId',{},{
                add:{method:'POST'},
            }),
            trainer:$resource('/api/organization/trainer/:schoolId',{},{
                add:{method:'POST'},
                update:{method:'POST'}
            }),
            trainee:$resource('/api/organization/trainee/:schoolId',{},{
                add:{method:'POST'},
                update:{method:'POST'}
            }),
            klass:$resource('/api/organization/klass/:schoolId',{},{
                add:{method:'POST'},
                update:{method:'POST'}
            }),
            orgGetUserById:$resource('/api/users/userId',{},{}),
            trainerToKlass:function(classId,data){
                return $http({url:'/api/organization/klassManager/'+classId,method:'POST',data :data});
            },
            traineeToKlass:function(classId,data){
                return $http({url:'/api/organization/klassMember/'+classId,method:'POST',data :data});
            },
            traineeProducts:function(schoolId,data){
                return $http({url:'/api/organization/traineeProducts/'+schoolId,method:'POST',data :data});
            }
        }
    });
