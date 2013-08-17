'use strict';

$app.run(function($rootScope){	
	$rootScope.$on('$routeChangeStart', function(){
		if(!plus.auth.isLoggedIn()){
			$navigate.go('/login');
		}
	});
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


});
