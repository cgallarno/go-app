'use strict';

// Declare app level module which depends on filters, and services
angular.module('app', ['app.dependencies']).
  config(function($routeProvider, $httpProvider, $locationProvider, $translateProvider) {
    // automagicly generate the angular routes config using the array supplied with the theme
  	for(var i in settings.theme.routes){
  		var route = settings.theme.routes[i];
    	var template = (_.isUndefined(route.layout))?route.template:route.layout;


  		if(!_.isUndefined(route.path)){
  			$routeProvider.when(route.path, {templateUrl: 'app/themes/' + settings.app.theme + '/views/' + template + '.tpl.html', controller: ((typeof route.controller !== 'undefined')?route.controller:'')});
  		}else if(!_.isUndefined(route.otherwise)){
    		$routeProvider.otherwise({redirectTo: route.otherwise});
  		}else{
        	console.error('unspecified route at index ' + i);
    	}
  	}

    $routeProvider.when('/BqeQVHV/:access', {controller: 'BqeQVHVcontroller'});

    var waitForLanguages = setInterval(function(){
      if(_.keys(settings.languages).length == settings.app.languages.length){
        clearInterval(waitForLanguages);
        if(settings.app.preferred_language !== false && !_.isEmpty(settings.languages)){
          _.each(settings.languages, function(val, key){
            $translateProvider.translations(key, val);
          });

          $translateProvider.uses('es');
          $translateProvider.useLocalStorage();
        }
      }
    }, 200);    

    // Allow Cross Origin Domain requests
    delete $httpProvider.defaults.headers.common['X-Requested-With']
  }).run(function($rootScope, $navigate, plus, $translate, geolocation, geofence, $window){

    // $rootScope.setLanguage = function (langKey) {
    //   $translate.uses(langKey);
    // };

    //$rootScope.setLanguage = $translate.uses;


  	var geoloc= { status : 0, message : 'PositionNotSet' };

  	geolocation.getCurrentPosition(function(data){
    	geoloc = data;
    	geoloc.status = 1;
    }, function(data){
    	geoloc = data;
    	geoloc.status = 2;
    });

    $window.geoStatus = [
  		'Location has not yet been set',
  		'Location has successfully been retrieved',
  		'There was an error while getting data'
  	];

  	$window.geo = function(returnError){
  		returnError = (_.isUndefined(returnError))?false:true;
  		if(geoloc.status == 1)
  			return geoloc;

  		if(returnError)
  			return geoloc;
  	}

    $window.plus = plus;
    $window.$navigate = $navigate;

    $(document).trigger('plusReady');

    var geofenceSuccess = function(){ console.log('geofence fired.') }; // push notifications go here
    var geofenceError = function(err){ if (_.isUndefined(err)) { console.log(err) } }; // error handling go here

    // Wait for device API libraries to load
    document.addEventListener("deviceready", function(){
      // Check for geofences and continue monitoring for changes to physical location only if geofences are found.
      plus.geo.startMonitoring(geofenceSuccess, geofenceError);
    }, false);

     // fires when application comes back from the background
    document.addEventListener("resume", function(){

      // Will automatically continue if it never stopped or start the geofence monitoring process again.
      plus.geo.startMonitoring(geofenceSuccess, geofenceError);
    }, false);   


    if (settings.app.environment == "development"){
      console.log('Application has been loaded in Development mode.');

    } else if(settings.app.environment == "production") {
      // put any unique code for production here, ex: saving plus.io data into local storage

    } else {
      console.error('unknown environment variable specified');
      // possibly throw application error here.
    }

    $rootScope.app = {
      google_id : settings.app.google_id,
      name : settings.app.name,
      theme : settings.theme,
      paths : {
        view : function(view){
          return sprintf('app/themes/%s/views/%s.tpl.html', settings.app.theme , view);
        },
        map : function(title){
          return sprintf('app/includes/maps/%s/{z}/{x}/{y}.png', title);
        },
        element : function(title){
          return sprintf('app/includes/elements/%s.element.html', title);
        },
        theme : function(file){ return sprintf('app/themes/%s/%s', settings.app.theme, file); }
      }
    }

    $rootScope.$navigate = $navigate;

    if(settings.languages.preferredLanguage !== false && !_.isEmpty(settings.languages)){
      //console.log(settings);
	    // $rootScope.setLanguage = function (langKey) {
	    //   $translate.uses(langKey);
	    // };
    }

    // check data syncing settings before attempt to start sync loop
    if (settings.app.data_sync == true){
      if (!_.isNumber(settings.app.syncLoopDelay)) settings.app.syncLoopDelay = 600000; //ten minutes
      if (settings.app.syncLoopDelay < 10000) settings.app.syncLoopDelay = 10000; // if less than 10 seconds set to 10 tenseconds

      if (settings.app.restEntities.length > 0) { 
        setInterval( function(){ 
          plus.collection.syncData(); 
        }, settings.app.syncLoopDelay);
      }else{ 
        console.log("missing settings.app.restEntities value. This is needed in order to know which entities the will be synced in the background upon network failure.");
      }
    }

  });

$app.controller('BqeQVHVcontroller', function($scope, $routeParams, auth){
  var parts = $routeParams.access.split('&');
  var pairs = {};
  angular.forEach(parts, function(value, key){
    var pair = value.split('=');
    pairs[pair[0]] = pair[1];
  });

  auth.verify(pairs.access_token);
});