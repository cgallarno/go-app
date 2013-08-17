'use strict';

$app.run(function($rootScope, $navigate){
	$rootScope.$on('$routeChangeStart', function(){
		if(!plus.auth.isLoggedIn()){
			$navigate.go('/login');
		}
	});
});

$app.controller('loginController', function($scope, $navigate){
	if(plus.auth.isLoggedIn()){
		$navigate.go('/home');
	}

	$scope.login = function(){
		plus.auth.login('google', true);
	}

	$scope.$on('authUpdated', function(event, data){
	  if(plus.auth.isLoggedIn()){
	  	alert('loggedIn');
	  	$navigate.go('/home');
	  }
	});
});

$app.controller('homeController', function ($scope) {


});
