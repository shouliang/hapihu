(function () {
  'use strict';

  angular
    .module('mean.common')
      .constant('GRADES',[{label:'一年级',value:'一年级'},{label:'二年级',value:'二年级'},{label:'三年级',value:'三年级'},{label:'四年级',value:'四年级'},{label:'五年级',value:'五年级'},{label:'六年级',value:'六年级'},{label:'七年级',value:'七年级'},{label:'八年级',value:'八年级'},{label:'九年级',value:'九年级'},{label:'高一',value:'高一'},{label:'高二',value:'高二'},{label:'高三',value:'高三'}])
      .constant('ROLES',['student','teacher','vendor','parent','unioner','schooler','admin','trainee','trainer','organization'])
    .factory('Common', Common);

  Common.$inject = ['$http'];

  function Common($http) {
    return {
      name: 'common',
      //common functions
      addressToZone:function(address){
          var zoneLocation={
            zone:[],
            location:[]
          }
        if(address){
          if(address.province){
            zoneLocation.zone.push(address.province.id);
            zoneLocation.location.push(address.province.text);
            if(address.city){
              zoneLocation.zone.push(address.city.id);
              zoneLocation.location.push(address.city.text);
              if(address.district){
                zoneLocation.zone.push(address.district.id);
                zoneLocation.location.push(address.district.text);
              }
            }
          }
        }
        return zoneLocation;
      },
      zoneToAddress:function (zoneLocation) {
        var address={
          province:null,
          city:null,
          district:null
        }
        if(zoneLocation && zoneLocation.zone){
          if(zoneLocation.zone[0]){
            address.province={id:zoneLocation.zone[0],text:zoneLocation.location[0]};
            if(zoneLocation.zone[1]){
              address.city={id:zoneLocation.zone[1],text:zoneLocation.location[1]};
              if(zoneLocation.zone[2]){
                address.district={id:zoneLocation.zone[2],text:zoneLocation.location[2]};
              }
            }
          }
        }
        return address;
      },
      getSchool:function () {
        
      },
      // 把多行文本解析成数组
      parseTextToArray:function (text) {
        var nodes=[],nodeArray=[];
        if(!text) return nodes;
        var parseFun=function (line) {
          var reg=/^\s+$/;
          if(!line || reg.exec(line)) return;
          reg=/^\s+/;
          var preArray=reg.exec(line);
          if(!preArray || preArray[0].length===0){
            var node={
              s:0,
              title:line,
              nodes:[]
            };
            nodes.push(node);
            nodeArray.push(node);
          }else{
            var parent=nodes;
            if(nodeArray.length>0){
              if(preArray[0].length<=nodeArray[nodeArray.length-1].s){
                for (var i=nodeArray.length-1;i>=0;i--){
                  if(preArray[0].length>nodeArray[i].s){
                    parent=nodeArray[i];
                    break;
                  }
                }
              }else{
                parent=nodeArray[nodeArray.length-1];
              }
            }
            var node={
              s:preArray[0].length,
              title:line.replace(reg,''),
              nodes:[]
            };
            if(parent===nodes){
              parent.push(node);
            }else{
              parent.nodes.push(node);
            }
            nodeArray.push(node);
          }

        };
        var lineArray=text.split(/\n/);
        for(var i=0;i<lineArray.length;i++){
          parseFun(lineArray[i]);
        }
        return nodes;
      }
    };
  }
  angular
      .module('mean.common')
      .filter('gradeOrder',function () {
        return function (arr,att) {
          if(!arr && !angular.isArray(arr)) return arr;
          var grades=['一年级','二年级','三年级','四年级','五年级','六年级','七年级','初一','八年级','初二','九年级','初三','中考','十年级','高一','十一年级','高二','十二年级','高三','高考','大一','大二','大三'];
          arr.sort(function (a,b) {
            if(angular.isString(a)){
              var aIndex=grades.indexOf(a);
              var bIndex=grades.indexOf(b);
              if(aIndex>0 && bIndex<0) return -1;
              return aIndex-bIndex;
            }else{
              if(!att || !a[att] || !b[att]) return -1;
              var aIndex=grades.indexOf(a[att]);
              var bIndex=grades.indexOf(b[att]);
              if(aIndex>0 && bIndex<0) return -1;
              return aIndex-bIndex;
            }
          });
          return arr;
        }
      })
      .filter('trusted', ['$sce', function ($sce) {
        return function(url) {
          return $sce.trustAsResourceUrl(url);
        };
      }]);
})();
