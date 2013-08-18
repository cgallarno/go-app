'use strict';

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
						console.log(tasks);
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

	$scope.child = _.findWhere(angular.fromJson(localStorage.children), { code : $routeParams.code});

	$scope.child.tasks = _.where($scope.tasks, {child_id : $routeParams.code, completed : 0});

	$scope.scrollable = {
		currPageX : ''
	};

	$scope.setNav = function(){
		document.querySelector('#indicator > li.active').className = '';
		document.querySelector('#indicator > li:nth-child(' + ($scope.scrollable.currPageX+1) + ')').className = 'active';
	}
});

$app.controller('completedController', function($scope){
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
