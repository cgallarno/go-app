'use strict';
document.addEventListener("deviceready", function(){
	document.addEventListener("showkeyboard", function() {
	    $('#main-footer').hide();
	    $('.content').css('bottom', '0');
	}, false);
	document.addEventListener("hidekeyboard", function() {
	    $('#main-footer').show();
	    $('.content').css('bottom', '75px');

	}, false);
});

$app.run(function($rootScope, plus){	
	// $rootScope.$on('$routeChangeStart', function(){
	// 	if(!plus.auth.isLoggedIn()){
	// 		$navigate.go('/login');
	// 	}
	// });

	$rootScope.$watch('tasks', function(newval){
		$rootScope.completed = _.where(newval, { completed : 1, approved : 0 });
	}, true);

	$rootScope.updateTasks = function(){
		if(!_.isUndefined(localStorage.children)){
			$rootScope.children = angular.fromJson(localStorage.children);
			var tasks = [];
			var length = $rootScope.children.length;
			_.each($rootScope.children, function(val, i){
				plus.collection.get('tasks', { filter : 'child_id', value: val.code}).then(function(data){
					_.each(data, function(val, i){
						val.name = _.findWhere($rootScope.children, { code : val.child_id }).name;
					});
					tasks = _.union(tasks, data);
					if(i === length - 1){
						$rootScope.tasks = tasks;

					}
				});
			});

		}
	}


	$rootScope.updateTasks();
});

$app.controller('loginController', function($scope, $navigate, $timeout){
	$scope.$on('authUpdated', function(event, data){
		if(data.loggedIn){
			goHome();
		}
	});

	if(plus.auth.isLoggedIn()){
		goHome();
	}

	function goHome(){
		$timeout(function(){
			$navigate.go('/home');
		}, 100);
	}

	$scope.login = function(){
		plus.auth.login('google', true);
	}
});

$app.controller('homeController', function ($scope) {
	$scope.updateTasks();
	//$scope.children = localStorage.children;

	$scope.photos = (_.isUndefined(localStorage.photos))?{}:angular.fromJson(localStorage.photos);

	$scope.delete = function(i){
		$scope.children.splice(i, 1);
		localStorage.children = angular.toJson($scope.children);
		console.log($scope.children);
	}

	$scope.toggleDelete = function(i){
		hideDelete(i);
		var ele = $('#delete-btn-' + i);

		if(ele.hasClass('animated')){
			hideDelete(i);
		}else{
			ele.addClass('animated fadeInRight');
			$('#arrow-btn-' + i).addClass('animated fadeOutRight');
		}
	}

	function hideDelete(i){
		var element = $('.delete.animated');
		element.addClass('fadeOutRight');

		var arrow = $('.arrow.animated');
			arrow.removeClass('fadeOutRight');
			arrow.addClass('fadeInRight');

		setTimeout(function(){
			element.removeClass('animated fadeOutRight');
			arrow.removeClass('animated fadeInRight');
		}, 800);
	}


});

$app.controller('addController', function($scope){
	$scope.child = {};
	if(_.isUndefined(localStorage.children)){
		$scope.children = [];
	}else{
		$scope.children = angular.fromJson(localStorage.children);
	}
	$scope.add = function(){
		$scope.children.push($scope.child);
		localStorage.children = angular.toJson($scope.children);
		$navigate.go('/home', 'slide', true);
	}


	var getNfc = setInterval(function(){
		if(!_.isUndefined(nfc)){
			clearInterval(getNfc);
			nfc.addNdefListener(function(nfcEvent){
				var some_value = nfcEvent.tag.ndefMessage[0]["payload"];
				var string_value = nfc.bytesToString(some_value);
        		var code = string_value.substr(3);
        		$scope.child.code = code;
        		if(!$scope.$$phase){
        			$scope.$apply();
        		}
			}, function(){ console.log('success')}, function(){console.log('failure')});
		}
	}, 1000);

});

$app.controller('settingsController', function($scope, $translate){
	$scope.currentLang = localStorage.lang;
	$scope.lang = function(key){
		$scope.currentLang = localStorage.lang = key;
		$translate.uses(key);
	}

});

$app.controller('childController', function($scope, $routeParams){
	$scope.updateTasks();
	$scope.code = $routeParams.code;
	$scope.child = _.findWhere(angular.fromJson(localStorage.children), { code : $routeParams.code});

	if(!_.isUndefined(localStorage.photos)){
		$scope.child.photo = angular.fromJson(localStorage.photos)[$routeParams.code];
	}

	//$scope.child.tasks = _.where($scope.tasks, {child_id : $routeParams.code, completed : 0});

	$scope.scrollable = {
		currPageX : ''
	};

	$scope.setNav = function(){
		document.querySelector('#indicator > li.active').className = '';
		document.querySelector('#indicator > li:nth-child(' + ($scope.scrollable.currPageX+1) + ')').className = 'active';
	}

	$scope.capturePhoto = function() {
		//$('#photo img').attr('src', 'data:image/jpeg;base64,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');
		$scope.child.photo = 'data:image/png;base64,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';
		// Take picture using device camera and retrieve image as base64-encoded string

		navigator.camera.getPicture(cameraCallback, onFail, { quality: 50,
		destinationType: navigator.camera.DestinationType.DATA_URL });
	}

	function onFail(data){
		console.log('failed becasue reasons');
	}


	function cameraCallback(imageData) {
		$scope.child.photo = "data:image/jpeg;base64," + imageData;

		var photos;
		if(_.isUndefined(localStorage.photos)){
			photos = {}
		}else{
			photos = angular.fromJson(localStorage.photos);
		}

		photos[$routeParams.code] = $scope.child.photo;

		localStorage.photos = angular.toJson(photos);

		if(!$scope.$$phase){
			$scope.$apply();
		}
	}
});

$app.controller('completedController', function($scope){
	$scope.updateTasks();
	$scope.approve = function(id, i){
		if($scope.completed[i].class != 'loading'){
			$scope.completed[i].class = "loading";
			plus.collection.update('tasks', id, { completed : 1, approved : 1}).then(function(){
				$scope.completed.splice(i, 1);
			}, function(){
				$scope.completed[i].class = '';
			});
		}
	}

});

$app.controller('addTaskController', function($scope, $routeParams){
	$scope.task = {
		child_id : $routeParams.code,
		title : '',
		points : '',
		assign : plus.auth.get('email')
	};

	$scope.add = function(){
		plus.collection.add('tasks', $scope.task).then(function(){
			$navigate.back();
		});
	}
});
