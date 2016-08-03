angular.module('starter.controllers', [])

.controller('ScheduleCtrl', function($scope, $http) {
  $scope.redirect = window.location.href;
  var lastLocation = null;
  $scope.data = [];
  $scope.login = function () {
    var clientId = 'X3pxPFIacVjSBAHW';
    var redirectUri = $scope.redirect;
    window.open('https://www.arcgis.com/sharing/rest/oauth2/authorize?client_id='+clientId+'&response_type=token&expiration=20160&redirect_uri=' + window.encodeURIComponent(redirectUri), 'oauth-window', 'height=400,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes');
  }
  $scope.times = [
    {label: '8:00 AM', hour: 8, minute: 0}, 
    {label: '8:30 AM', hour: 8, minute: 30},  
    {label: '9:00 AM', hour: 9, minute: 30},        
    {label: '9:30 AM', hour: 9, minute: 30}, 
    {label: '10:00 AM', hour: 10, minute: 0}, 
    {label: '10:30 AM', hour: 10, minute: 30}, 
    {label: '11:00 AM', hour: 11, minute: 0}, 
    {label: '11:30 AM', hour: 11, minute: 30}, 
    {label: '12:00 PM', hour: 12, minute: 0}, 
    {label: '12:30 PM', hour: 12, minute: 30}, 
    {label: '1:00 PM', hour: 13, minute: 0}, 
    {label: '1:30 PM', hour: 13, minute: 30}, 
    {label: '2:00 PM', hour: 14, minute: 0}, 
    {label: '2:30 PM', hour: 14, minute: 30}, 
    {label: '3:00 PM', hour: 15, minute: 0}, 
    {label: '3:30 PM', hour: 15, minute: 30}, 
    {label: '4:00 PM', hour: 16, minute: 0}  
    ];
    $scope.selectedTime = $scope.times[5];
  $scope.timeChanged = function (assignment) {
    time = assignment.dueTime;
    console.log(time.label);
    console.log(assignment);
    var dueDate = new Date(assignment.dueDate);
    dueDate.setHours(time.hour);
    dueDate.setMinutes(time.minute);
    assignment.dueDate = dueDate.getTime();
    var features = []
    for (var i = 0; i < assignment.work.length; i++) {
      features.push({attributes: {OBJECTID: assignment.work[i].oid, dueDate: assignment.dueDate}});
    }
    $http.post('http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/assignments_68ce0efa1dbe41e688fa53865e4be017/FeatureServer/0/updateFeatures',
      {f: 'json', features: JSON.stringify(features), token: $scope.token},
      {headers: {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"},
          transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
      },}).then(function (response) {
        console.log(response);
      });
  }
  if (match) {
    $scope.token = match[1];
    $scope.username = unescape(match.input.substr(match.input.indexOf('username')).split('=')[1]);
    $http.get('https://ral.maps.arcgis.com/sharing/rest/community/users/'+$scope.username+'?f=json&token=' + $scope.token).then(function (response) {
      $scope.user = response.data;
    });
    $http.get('http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/workers_68ce0efa1dbe41e688fa53865e4be017/FeatureServer/0/query?f=json&where=userId=\'' +$scope.username + '\'&outFields=*&token=' + $scope.token).then(function (response) {
      if (response.data.features.length > 0) {
        var oid = response.data.features[0].attributes.OBJECTID;
        $http.get('http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/assignments_68ce0efa1dbe41e688fa53865e4be017/FeatureServer/0/query?f=json&orderByFields=location&where=workerId=\'' + oid + '\'&outFields=*&token=' + $scope.token).then(function (response) {
          var d, h, m, dueTime, ampm = null;
          var item = null;
          for (var i = 0; i < response.data.features.length; i++) {
            d = new Date(response.data.features[i].attributes.dueDate);
            h = d.getHours() > 12 ? d.getHours() - 12 : d.getHours();
            m = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
            ampm = d.getHours() < 12 ? 'AM' : 'PM';
            dueTime = {
              label: h.toString() + ':' + m.toString() + ' ' + ampm,
              hour: h,
              minute: m
            };
            response.data.features[i].attributes.dueTime = dueTime;
            response.data.features[i] = response.data.features[i];
            if (response.data.features[i].attributes.location === lastLocation) {
              item.work.push({oid: response.data.features[i].attributes.OBJECTID, permit: response.data.features[i].attributes.workOrderId, code: response.data.features[i].attributes.code});
            } else {
              if (item) {
                $scope.data.push(item);
              }
              item = {location: response.data.features[i].attributes.location, notes: response.data.features[i].attributes.notes,dueDate: response.data.features[i].attributes.dueDate, dueTime: dueTime, work: [{oid: response.data.features[i].attributes.OBJECTID, permit: response.data.features[i].attributes.workOrderId, code: response.data.features[i].attributes.code}]}
            }
            if (i === response.data.features.length - 1) {
              $scope.data.push(item);
            }            
            lastLocation = response.data.features[i].attributes.location;
          }
          console.log($scope.data);
        });
      }
    });
  }
});
