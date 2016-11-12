'use strict';

//Users service used for users REST endpoint
angular.module('mean.admin').factory('System', ['$resource',
    function($resource) {
        var formatZones=function (zones) {
            if(!zones){
                return {};
            }
            var fZones={};
            //level sort
            zones.sort(function(a,b){
                return a.level-b.level;
            })
            for(var i=0;i<zones.length;i++){
                if(zones[i].level==1){
                    fZones[zones[i].postcode]=zones[i];

                }else if(zones[i].level==2){
                    if(fZones[zones[i].parents[0]]){
                        if(!fZones[zones[i].parents[0]].sons) fZones[zones[i].parents[0]].sons={};
                        fZones[zones[i].parents[0]].sons[zones[i].postcode]=zones[i];
                    }
                }else if(zones[i].level==3){
                    if(fZones[zones[i].parents[0]] && fZones[zones[i].parents[0]].sons){
                        if(fZones[zones[i].parents[0]].sons[zones[i].parents[1]]){
                            if(!fZones[zones[i].parents[0]].sons[zones[i].parents[1]].sons) fZones[zones[i].parents[0]].sons[zones[i].parents[1]].sons={};
                            fZones[zones[i].parents[0]].sons[zones[i].parents[1]].sons[zones[i].postcode]=zones[i];
                        }

                    }
                }
            }
            return fZones;
        };
        return {
            initZones:$resource('/api/admin/initZones',{},{get:{method:'GET'}}),
            loadZones:$resource('/api/get-zones',{},{get:{method:'GET',cache:true}}),
            formatZones:formatZones,
            initSchools:$resource('/api/admin/initSchools'),
            loadSchools:$resource('/api/get-schools',{zone:'@zone',keyword:'@keyword',page:'@page',pageItem:'@pageItem',status:'@status'},{get:{method:'GET',cache:false}}),
            addSchool:$resource('/api/admin/addSchool',{},{add:{method:'POST',cache:false}}),
            saveSchool:$resource('/api/admin/saveSchool/:schoolId',{schoolId:'@schoolId'},{save:{method:'POST',cache:false},update:{method:'PUT'}}),
            loadSchool:$resource('/api/get-school',{id:'@id',name:'@name',all:'@all'},{get:{method:'GET',cache:false}}),
            deleteSchool:$resource('/api/admin/deleteSchool',{id:'@id'},{delete:{method:'DELETE',cache:false}}),
            adminCompanies:$resource('api/admin/companies/:companyId', {
                companyId: '@_id'
            }, {
                update: {
                    method: 'PUT'
                }
            }),
            adminVariables:$resource('api/admin/variables/:varName', {
                varName: '@_varName'
            }, {
                update: {
                    method: 'PUT'
                }
            })
        }
    }
]);
