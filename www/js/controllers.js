angular.module('starter.controllers', [])
    .controller('ScheduleCtrl', function ($scope, $http) {
        'use strict';
        $scope.redirect = window.location.href;
        $scope.data = [];
        $scope.spin = false;
        $scope.login = function () {
            var clientId = 'X3pxPFIacVjSBAHW';
            var redirectUri = $scope.redirect;
            window.open('https://www.arcgis.com/sharing/rest/oauth2/authorize?client_id=' + clientId + '&response_type=token&expiration=20160&redirect_uri=' + window.encodeURIComponent(redirectUri), 'oauth-window', 'height=400,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes');
        };
        $scope.timeChanged = function (assignment) {
            var features = [];
            var hr = assignment.dueDate.getHours();
            var mi = assignment.dueDate.getMinutes();
            assignment.origDate.setHours(hr);
            assignment.origDate.setMinutes(mi);
            assignment.dueDate = assignment.origDate;
            features.push({
                attributes: {
                    OBJECTID: assignment.oid,
                    dueDate: assignment.dueDate
                }
            });
            $http.post('https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/assignments_1542a408cfdd45f49da345d802197905/FeatureServer/0/updateFeatures', {
                f: 'json',
                features: JSON.stringify(features),
                token: $scope.token
            }, {
                headers: {
                    "Content-type": "application/x-www-form-urlencoded",
                    Accept: "text/plain"
                },
                transformRequest: function (obj) {
                    var str = [];

                    Object.keys(obj).forEach(function (p) {
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    });
                    return str.join("&");
                }
            }).then(function (response) {
                console.log(response);
            });
        };
        if (match) {
            $scope.spin = true;
            $scope.token = match[1];
            $scope.username = unescape(match.input.substr(match.input.indexOf('username')).split('=')[1]);
            $http.get('https://ral.maps.arcgis.com/sharing/rest/community/users/' + $scope.username + '?f=json&token=' + $scope.token).then(function (response) {
                if (response.data.error) {
                    $scope.error = response.data.error.message;
                    $scope.spin = false;
                } else {
                    $scope.user = response.data;
                }
            });
            $http.get('https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/workers_1542a408cfdd45f49da345d802197905/FeatureServer/0/query?f=json&where=userId=\'' + $scope.username + '\'&outFields=*&token=' + $scope.token).then(function (response) {
                if (response.data.features.length > 0) {
                    var oid = response.data.features[0].attributes.OBJECTID;
                    $http.get('https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/assignments_1542a408cfdd45f49da345d802197905/FeatureServer/0/query?f=json&orderByFields=location&where=workerId=\'' + oid + '\'&outFields=*&token=' + $scope.token).then(function (response) {

                        var item = null, i = 0;
                        $scope.navUrl = 'arcgis-navigator://?';
                        for (i = 0; i < response.data.features.length; i += 1) {
                            $scope.navUrl += 'stop=' + response.data.features[i].attributes.location + ',Raleigh,NC&';
                            item = {
                                oid: response.data.features[i].attributes.OBJECTID,
                                location: response.data.features[i].attributes.location,
                                notes: response.data.features[i].attributes.notes,
                                origDate: new Date(response.data.features[i].attributes.dueDate),
                                dueDate: new Date(response.data.features[i].attributes.dueDate)
                            };
                            $scope.data.push(item);
                        }
                        $scope.navUrl += 'optimize=true';
                        $scope.spin = false;
                        console.log($scope.data);
                    });
                } else {
                    $scope.error = 'No Assignments Scheduled';
                    $scope.spin = false;
                }
            });
        }
    });