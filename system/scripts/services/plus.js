'use strict';

$app.factory('plus', function(plusCollection, auth, geofence) { 
    var plus = {};
    plus.ui = {}; // need to add ui service (dialog, etc)
    plus.collection = plusCollection; // plus backend
    plus.auth = auth; // authentication
    plus.geo = { // plus backend based geofences
    	structure: function() { return plusCollection.structure('plus_geofences'); }, 
    	add: function(data) { return plusCollection.add('plus_geofences', data); }, 
    	update: function(id, data) { return plusCollection.update('plus_geofences', id, data); }, 
    	get: function(params) { 
            if(angular.isObject(params)) {
                var limit = params.hasOwnProperty('limit') ? params.limit : 1000;
                var offset = params.hasOwnProperty('offset') ? params.offset : 0;
                var filter = params.hasOwnProperty('filter') ? "&filter=" + params.filter : "";
                var value = params.hasOwnProperty('value') ? "&value=" + params.value : "";

                params.limit = limit;
                params.offset = offset;
                params.filter = filter;
                params.value = value;
            }    
                    
            return plusCollection.get('plus_geofences', params); 
        }, 
        getCached: function() { return geofence.getCached(); },
    	delete: function(id) { return plusCollection.delete('plus_geofences', id); },  

    	startMonitoring: function(triggered, error) { geofence.startMonitoring(triggered, error) },
    	stopMonitoring: function(success, error) { geofence.stopMonitoring(success, error) }
    }

    return plus;
});