'use strict';

/* Variables:
 * 1) $scope: assign objects, arrays and function to $scope to access them from the view.
 */
 
$app.controller('homeController', function ($scope) {
  // defaulting the time on Angular's model variable.
  $scope.time = Date.now();

  setInterval(function(){
  	$scope.$apply(function(){
    	$scope.time = new Date().getTime();
  	});
  }, 1000);

});
