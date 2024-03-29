$app.factory('auth', ['$http', 'plusCollection', '$location', '$rootScope', function($http, plusCollection, $location, $rootScope) {

	if (window.addEventListener) {
	  window.addEventListener("storage", handle_storage, false);
	} else {
	  window.attachEvent("onstorage", handle_storage);
	};

	function handle_storage(e) {
	  if (!e) { e = window.event; }

	  if(e.key == 'user'){
	  	broadcastUserData();
	  }
	}

	function broadcastUserData(){
		userInfo = angular.fromJson(getUserSession());
	  	$rootScope.$broadcast('authUpdated', userInfo);
	}

	function getUserSession(){
		return angular.fromJson(localStorage.getItem('user')) || {};
	}

	function setUserSession(details, toUpdate){
		var userData = getUserSession();

		if(toUpdate){
			_.extend(userData, details);
		}else{
			userData = details;
		}
		localStorage.setItem('user', angular.toJson(userData));
		return userData;
	}

	function runTheVerify(data){
		functions.verify(data.access_token);
	}

	var functions = {
		login : function(method, forceUpdate){

			switch(method){
				case 'facebook':
				    //Config Plugin
				    var config = {
				        app_id      : settings.app.facebook_id,
				        secret      : settings.app.facebook_secrect,
				        scope       : 'email,' + settings.app.facebook_scope,
				        host        : settings.app.facebook_host, //App Domain ( Facebook Developer ).
				        onLogin     : _onLogin,
				        onLogout    : _onLogout
				    };
				    
				    //Login Facebook
				    $(document).FaceGap(config);
				    //Logout Facebook
				    //$(document).FaceGap('logout');
				    
				    //Callback Login
				    function _onLogin( event ){  
				    	event.data.method = 'facebook';
				    	setUserSession(event.data);
				    	broadcastUserData(); // Only fires on the phone
				    }
				    
				    //Callback Logout
				    function _onLogout( event ){
				        // logging out of facebook
				    }   
					break;
				case 'google':

					var config = {
						google_id : settings.app.google_id,
						scope : "https://www.googleapis.com/auth/userinfo.email " + settings.app.google_scope,
						redirect_uri : settings.app.google_redirect,
						email : (functions.isLoggedIn())?functions.get('email'):((!_.isUndefined(functions.get('hint')))?functions.get('hint'):'')
					}

					if(!_.isUndefined(this.get('expires')) && this.get('expires') > new Date().getTime() && forceUpdate !== true){
						var now = new Date().getTime();
						var remainder = ((this.get('expires') - now) / 1000) / 60;

						console.log('no need to check for antoher ' + remainder + ' minutes');
						return true;
					}

					var response;

		    		var authWindow = window.open(sprintf('https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=%(google_id)s&scope=%(scope)s&redirect_uri=%(redirect_uri)s&login_hint=%(email)s', config), '_blank', 'location=no');
		    		
		    		authWindow.addEventListener('loadstart', function(event) {
		    			if(event.url.search('access_token') >= 0){
		    				response = event.url;
		    				authWindow.close();

		    				hash = response.split('#')[1];

		    				parts = hash.split('&');
		    				pairs = {};
		    				angular.forEach(parts, function(value, key){
		    					peices = value.split('=');
		    					pairs[peices[0]] = peices[1];
		    				});

		    				runTheVerify(pairs);
		    			}
		    		});
					break;
				default:
					console.log('undefined or incorrect method provided');
			}


		},
		verify : function(access_token){
			//console.log(access_token);
			$http.get('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + access_token).success(function(data){
				userInfo = data;
				_.extend(userInfo, {
					loggedIn : true,
					expires : new Date().getTime() + (data.expires_in * 1000),
					time : new Date().getTime().toString(),
					access_token : access_token
				});

				userInfo.method = 'google';
				setUserSession(userInfo);
				plusCollection.get('users').then(function(data){
					var toUpdate = false;
					angular.forEach(data, function(value, key){
						if(value.user_id === userInfo.user_id){
							//update
							toUpdate = true;
							plusCollection.update('users', value.id, _.pick(data, 'email', 'user_id', 'verified_email', 'time'));
							
							setTimeout(function(){
								window.close()
							}, 500);
						}
					});

					if(!toUpdate){
						newUser = _.omit(_.extend(userInfo, {join_date : new Date().getTime()}), 'expires', 'loggedIn');

						plusCollection.add('users', newUser).then(function(){
							window.close;
						});
					}

					broadcastUserData(); // Only fires on the phone
				});
			}).error(function(data){
				console.log('error', data);
			});
		},
		logout : function(){
			// if(this.get('method') == 'facebook'){
			// 	alert('logging out of facebook');
			// 	$(document).FaceGap('logout');
			// }
			setUserSession({loggedIn : false, hint : this.get('email')}, false);
			broadcastUserData()
			return this.isLoggedIn();
		},
		isLoggedIn : function(){
			return getUserSession().loggedIn;
		},
		get : function(key){
			if(!_.isUndefined(key)) {return getUserSession()[key];}

			return getUserSession();
		},
		isTokenValid : function(){
			return this.get('expires') > new Date().getTime();
		}
	}

	return functions;
}]);