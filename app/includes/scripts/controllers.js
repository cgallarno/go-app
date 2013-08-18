'use strict';

$app.run(function($rootScope){	
	// $rootScope.$on('$routeChangeStart', function(){
	// 	if(!plus.auth.isLoggedIn()){
	// 		$navigate.go('/login');
	// 	}
	// });
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

	//$scope.children = localStorage.children;

	if(_.isUndefined(localStorage.children)){
		//add Child

	}else{
		$scope.children = angular.fromJson(localStorage.children);
	}

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
});

$app.controller('settingsController', function($scope, $translate){
	$scope.currentLang = localStorage.lang;
	$scope.lang = function(key){
		$scope.currentLang = localStorage.lang = key;

		$translate.uses(key);
	}

});

$app.controller('childController', function($scope, $routeParams){
	plus.collection.get('tasks', { filter : 'child_id', value : $routeParams.code}).then(function(data){
		console.log(data);
	});
});
