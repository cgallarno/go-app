'use strict';

$app.factory('geofence', ['plusCollection', function (plusCollection) { 
    var watchId = null;
    var geofenceTriggerredCallback;
    var geofenceErrorCallback;

    var saveLastKnownPosition = function(position) { localStorage.lastKnownPosition = position; }

    var geofences = function(data){ 
      // get geofences
      if(_.isUndefined(data)){ return angular.fromJson(localStorage.geofences);  }
      
      // set geofences
      localStorage.geofences = angular.toJson(data);
    };  
    var triggeredOutsideGeofences = function(data){ 
      // get triggeredOutsideGeofences
      if(_.isUndefined(data)){ return angular.fromJson(localStorage.triggeredOutsideGeofences);  }
      
      // set triggeredOutsideGeofences
      localStorage.triggeredOutsideGeofences = angular.toJson(data);
    };  
    var triggeredInsideGeofence = function(data){ 
      // get triggeredInsideGeofence
      if(_.isUndefined(data)){ return angular.fromJson(localStorage.triggeredInsideGeofence);  }
      
      // set triggeredInsideGeofence
      localStorage.triggeredInsideGeofence = angular.toJson(data);
    };  

    var processGeofenceEnterEvent = function(currentPoint){
      // find all regions you are in, mark as "inside" in new collection
      var insideRegions = _.filter(geofences(), function(region){ 
        var regionPoint = new L.LatLng(region.lat, region.lng);
        var distance = regionPoint.distanceTo(currentPoint);
        var geoEvent = "";

        if (_.isUndefined(distance) == false) {
          region.distance = distance;
          if (distance < region.radius){
            region.status = "inside"; 

            //inside
            return true;          
          }

          // outside
          return false;
        }

        // distance unknown
        return false;
      });

      // Check "inside" collection for which you are nearest.
      // Building a list of 'inside regions' is necessary in order to determine what geofence you are in, if there are nested geofences.
      // The correct answer is that you are in the geofence where the distance between you're current position and region lat/long is the smallest.  
      if (_.isUndefined(insideRegions) == false && insideRegions.length > 0){
        var enterEvents = _.filter(insideRegions, function(region){ return region.direction = "enter"; });
        var nearestEnterEventRegion = _.min(enterEvents, function(region){ return region.distance; });   
        
        // make sure your don't fire a enter geofence notification again
        var previouslyInsideGeofence = triggeredInsideGeofence();
        if (_.isUndefined(previouslyInsideGeofence) == false) {  
          if (nearestEnterEventRegion.direction == previouslyInsideGeofence.direction && 
            nearestEnterEventRegion.lat == previouslyInsideGeofence.lat &&
            nearestEnterEventRegion.lng == previouslyInsideGeofence.lng)

          return;
        }

        // Update stored inside geofence region. There is only 1 because you can only be in 1 place at a time.
        // Even within nest geofences we only care about the one you're closest to (smallest region)
        triggeredInsideGeofence(nearestEnterEventRegion);

        // Allow for situations where a "leave" can be fired multiple times. 
        // For example, leave a region, enter a region, then leave again.
        var nearestInsideRegion = _.min(insideRegions, function(region){ return region.distance; }); 
        var previouslyOutsideRegions = triggeredOutsideGeofences();

        if (_.isUndefined(previouslyOutsideRegions) == false) { 
          var matches = _.reject(previouslyOutsideRegions, {lat: nearestInsideRegion.lat, lng: nearestInsideRegion.lng, direction: nearestInsideRegion.direction });
          if (_.isUndefined(matches) == false && matches.length > 0){
            triggeredOutsideGeofences(matches);
          }  
        }      

        // actually trigger geofence
        if (_.isUndefined(geofenceTriggerredCallback) == false){
          geofenceTriggerredCallback();
        }
      }
    }; 

    var processGeofenceLeaveEvent = function(currentPoint){
      // find all regions you are in, mark as "outside" in new collection
      var currentlyOutsideRegions = _.filter(geofences(), function(region){ 
        var regionPoint = new L.LatLng(region.lat, region.lng);
        var distance = regionPoint.distanceTo(currentPoint);
        var geoEvent = "";

        if (_.isUndefined(distance) == false) {
          region.distance = distance;
          if (distance > region.radius){
            region.status = "outside"; 

            //outside
            return true;          
          }

          // inside
          return false;
        }

        // distance unknown, seems like an error to me
        return false;
      });

      // trigger geofences if applicable for current position
      if (_.isUndefined(currentlyOutsideRegions) == false && currentlyOutsideRegions.length > 0){
        // make sure your don't fire a leave geofence notification again
        var previouslyOutsideRegions = triggeredOutsideGeofences();
        
        // add current "leave" geofence notification to list of previously fired leaves.
        if (_.isUndefined(previouslyOutsideRegions)){ 
          previouslyOutsideRegions = []; 
        }

        _.each(currentlyOutsideRegions, function(outsideRegion){
          // make sure your don't fire a leave geofence notification again
          if (outsideRegion.direction == "leave"){
            var match = _.findWhere(previouslyOutsideRegions, {lat: outsideRegion.lat, lng: outsideRegion.lng, direction: outsideRegion.direction });
            if (_.isUndefined(match) == false && match.length > 0){
              return;
            }

            // ok, first time, so store it & trigger notification
            previouslyOutsideRegions.push(outsideRegion);
            
            // actually trigger geofence
            if (_.isUndefined(geofenceTriggerredCallback) == false){
              geofenceTriggerredCallback();
            }
          }
        });

        // store for later usage
        triggeredOutsideGeofences(previouslyOutsideRegions);
      }
    };     

    var throttledPositionUpdated = _.throttle( function(position){
      console.log("watching for position updates, current position: ", angular.toJson(position));

      if (_.isUndefined(position) == false){
        // Saving last known position
        saveLastKnownPosition(angular.toJson({ lat: position.coords.latitude, lng: position.coords.longitude }));
        
        var currentPoint = new L.LatLng(position.coords.latitude, position.coords.longitude);
        var localRegions = geofences();

        // enter events
        processGeofenceEnterEvent(currentPoint);

        // leave events
        processGeofenceLeaveEvent(currentPoint);

        // updated geofences in localstorage
        geofences(localRegions);  
      }
    }, 5000);            

    // stops geofence monitoring
    var endMonitoring = function(){
      // stop watching
      navigator.geolocation.clearWatch(watchId);

      if (_.isUndefined(geofenceTriggerredCallback) == false){
        geofenceTriggerredCallback();
      }         
    }; 

    // starts geofence monitoring
    var beginMonitoring = function(backendGeofences){
       //insert records from backend into localstorage if none are present
       var existingRegions = geofences();
       var noBackendGeofences = (_.isUndefined(backendGeofences) || backendGeofences.length == 0);
       var geofencesOutOfSync = ((_.isUndefined(existingRegions) == false && existingRegions.length != backendGeofences.length) || 
                                 (_.isUndefined(existingRegions)) && (backendGeofences.length > 0));

       // no point of continuing if there are no geofences.
       if(noBackendGeofences){ return; }       

       // ensure local storage geofences match the backend geofences (just without the id properties so deep compare later works fine.)
       var updatedBackendGeofences = [];
       _.each(backendGeofences, function(region){
        updatedBackendGeofences.push(_.omit(region, 'id'));
       });
       geofences(updatedBackendGeofences);
     
      // if previously monitoring, restart the monitoring process in order to handle different resuming outcomes between iOS & Android.
      if (watchId != null){ endMonitoring(); }    

      // start monitoring geofences
      watchId = navigator.geolocation.watchPosition(_.bind(throttledPositionUpdated, this), 
                                                    _.bind(function(err){ geofenceErrorCallback(err); }, this), 
                                                    { maximumAge: settings.app.geo_position_cache_limit, 
                                                      timeout: settings.app.geo_watch_timeout, 
                                                      enableHighAccuracy: settings.app.geo_enable_high_accuracy });  
    }; 

    return {
      startMonitoring: function(triggered, error, params){
        try
        {
          geofenceTriggerredCallback = triggered;
          geofenceErrorCallback = error;

          if (Boolean(navigator.geolocation)){
            plus.geo.get(params).then(function(geofenceData) {
              beginMonitoring(geofenceData);
            });
          }
        }
        catch(err)
        {
          if (_.isUndefined(geofenceErrorCallback) == false) {
            geofenceErrorCallback(err);
          }    
        }    
      },
      stopMonitoring: function(success, error){ 
        try
        { 
          // set geofence callbacks
          geofenceTriggerredCallback = success;
          geofenceErrorCallback = error;

          endMonitoring(); 
        }
        catch(err)
        {
          if (_.isUndefined(geofenceErrorCallback)){
            geofenceErrorCallback(err);
          }
        }
      },
      getCached: function(){ return geofences(); }
    };
  }]);