charityListeners = [];

function getCharities() {
    var ref = new Firebase("https://menehi.firebaseio.com/charities/");
    
    ref.on("value", function(snapshot) {
      var val = snapshot.val();
      for (var i in charityListeners) {
          charityListeners[i](val);
      }
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
}

$(function() {
    console.log("gettin charitable");
    getCharities();
});

var currentLoc = {x:0,y:0};

require([
"esri/map",
"esri/dijit/Search",
"esri/symbols/Font",
"esri/geometry/Point",
"esri/SpatialReference",
 "esri/symbols/SimpleMarkerSymbol",
"esri/symbols/PictureMarkerSymbol",
 "esri/symbols/SimpleLineSymbol",
"esri/Color",
"esri/symbols/TextSymbol",

"dijit/registry",
"dijit/form/Button",
"dojo/parser",
"esri/geometry/webMercatorUtils",
"esri/graphic",
"esri/layers/FeatureLayer",
"esri/renderers/SimpleRenderer",
"esri/renderers/TemporalRenderer",
"esri/renderers/TimeClassBreaksAger",
"esri/symbols/SimpleLineSymbol",
"esri/TimeExtent",

"esri/tasks/locator",
"esri/SpatialReference",
"esri/geometry/Extent",
"dojo/_base/array",

"dojo/domReady!"
], function (
    Map, Search, Font, Point, SpatialReference, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol, Color, TextSymbol, registry, Button, parser, webMercatorUtils, Graphic, FeatureLayer, SimpleRenderer, TemporalRenderer,
TimeClassBreaksAger, SimpleLineSymbol, TimeExtent, Locator, SpatialReference, Extent, arrayUtils)

 {
    parser.parse();

    var map, featureLayer;
    var OBJECTID_COUNTER = 1000;
    var TRACKID_COUNTER = 1;
    //onorientationchange doesn't always fire in a timely manner in Android so check for both orientationchange and resize
    var supportsOrientationChange = "onorientationchange" in window, orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

    window.addEventListener(orientationEvent, function (){
      orientationChanged();
    }, false);


    map = new Map("map", {
       basemap: "gray",
       center: [-100, 39], // lon, lat
       zoom: 5
    });
    map.on("load", mapLoadedHandler);

    //Do not provide a srcNode dom for the Search widget as the UI is not displayed. 


    function mapLoadedHandler(maploadEvent){

      //create a layer definition for the gps points
       var layerDefinition = {
          "objectIdField": "OBJECTID",
          "trackIdField": "TrackID",
          "geometryType": "esriGeometryPoint",
          "timeInfo": {
            "startTimeField": "DATETIME",
            "endTimeField": null,
            "timeExtent": [1277412330365],
            "timeInterval": 1,
            "timeIntervalUnits": "esriTimeUnitsMinutes"
          },
          "fields": [
            {
              "name": "OBJECTID",
              "type": "esriFieldTypeOID",
              "alias": "OBJECTID",
              "sqlType": "sqlTypeOther"
            },
            {
              "name": "TrackID",
              "type": "esriFieldTypeInteger",
              "alias": "TrackID"
            },
            {
              "name": "DATETIME",
              "type": "esriFieldTypeDate",
              "alias": "DATETIME"
            }
          ]
        };

      var featureCollection = {
        layerDefinition: layerDefinition,
        featureSet: null
      };
      featureLayer = new FeatureLayer(featureCollection);

      //setup a temporal renderer
      var sms = new SimpleMarkerSymbol().setColor(new Color([255, 0, 0])).setSize(8);
      var observationRenderer = new SimpleRenderer(sms);
      var latestObservationRenderer = new SimpleRenderer(new SimpleMarkerSymbol());
      var infos = [
        {
          minAge: 0,
          maxAge: 1,
          color: new Color([255, 0, 0])
        }, {
          minAge: 1,
          maxAge: 5,
          color: new Color([255, 153, 0])
        }, {
          minAge: 5,
          maxAge: 10,
          color: new Color([255, 204, 0])
        }, {
          minAge: 10,
          maxAge: Infinity,
          color: new Color([0, 0, 0, 0])
        }
      ];

      var ager = new TimeClassBreaksAger(infos, TimeClassBreaksAger.UNIT_MINUTES);
      var sls = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
        new Color([255, 0, 0]), 3);
      var trackRenderer = new SimpleRenderer(sls);
      var renderer = new TemporalRenderer(observationRenderer, latestObservationRenderer,
        trackRenderer, ager);
      featureLayer.setRenderer(renderer);
      map.addLayer(featureLayer);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
        navigator.geolocation.watchPosition(showLocation, locationError);
        console.log("geolocation!");
      } else {
          console.log("No geolocation.");
      }
    }

    function locationError(error){
      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert("Location not provided");
          break;

        case error.POSITION_UNAVAILABLE:
          alert("Current location not available");
          break;

        case error.TIMEOUT:
          alert("Timeout");
          break;

        default:
          alert("unknown error");
          break;
      }
    }

    function zoomToLocation(location){
      var pt = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude,
        location.coords.latitude));
      map.centerAndZoom(pt, 16);
    }

    function showLocation(location){
      if (location.coords.accuracy <= 500) {
        var now = new Date();
        var attributes = {};
        attributes.OBJECTID = OBJECTID_COUNTER;
        attributes.DATETIME = now.getTime();
        attributes.TrackID = TRACKID_COUNTER;

        OBJECTID_COUNTER++;
        TRACKID_COUNTER++;

        var pt = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude,
          location.coords.latitude));
        currentLoc = pt;
        var graphic = new Graphic(new Point(pt, map.spatialReference), null, attributes);

        featureLayer.applyEdits([graphic], null, null, function (adds){
          map.setTimeExtent(new TimeExtent(null, new Date()));
          map.centerAt(graphic.geometry);
        });
      }
      else {
        console.warn("Point not added due to low accuracy: " + location.coords.accuracy);
      }
    }

    function orientationChanged(){
      if (map) {
        map.reposition();
        map.resize();
      }
    }

    var s = new Search({
       enableLabel: true,
       enableInfoWindow: false,
       map: map
    }, "");

    s.startup();
    
    
    locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");

    var geocodeResults = [];
    var locs = [];
    
    var closest = undefined;
    
    locator.on("address-to-locations-complete", function(evt) {
          geocodeResults.push(evt.addresses[0]);
          for (var key in locs) {
                  /**********************************************************/
              if (evt.addresses[0].address.substring(0,evt.addresses[0].address.indexOf(" "))
                    === locs[key].Address.substring(0,locs[key].Address.indexOf(" "))) {
                  // NO NO NO NO NO NO NO NO NO NO NO PLEASE CHANGE THIS
                  /*
                  *
                  *
                  *
                  *
                  *
                  **********************************************************/
                  evt.addresses[0].charity_name = locs[key].Name;
                  
                  if (locs[key].stripeID != undefined) {
                     var merc = webMercatorUtils.geographicToWebMercator(evt.addresses[0].location);
                      
                      if (closest === undefined || (merc.x - currentLoc.x) * (merc.x - currentLoc.x) + (merc.y - currentLoc.y) * (merc.y - currentLoc.y) <
                          (closest.x - currentLoc.x) * (closest.x - currentLoc.x) + (closest.y - currentLoc.y) * (closest.y - currentLoc.y)) {
                          closest = locs[key];
                          closest.x = merc.x;
                          closest.y = merc.y;
                      }
                      
                  }
              }
          }
        
          if (closest !== undefined) {
              $("#closestStripeID").val(closest.stripeID);
              $("#closestName").val(closest.Name);
          }
        
          map.graphics.clear();
          console.log("cleared graphics");
        
          console.log(geocodeResults.length);
          for (var i = 0; i < geocodeResults.length; i++) {
              var geocodeResult = geocodeResults[i];
            //create a random color for the text and marker symbol
            var r = Math.floor(Math.random() * 250);
            var g = Math.floor(Math.random() * 100);
            var b = Math.floor(Math.random() * 100);

            var symbol = new SimpleMarkerSymbol(
              SimpleMarkerSymbol.STYLE_CIRCLE, 
              20, 
              new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID, 
                new Color([r, g, b, 0.5]), 
                10
              ), new Color([r, g, b, 0.9]));
            var pointMeters = webMercatorUtils.geographicToWebMercator(geocodeResult.location);
            var locationGraphic = new Graphic(pointMeters, symbol);

              
              
            var font = new Font().setSize("12pt").setWeight(Font.WEIGHT_BOLD);
            var textSymbol = new TextSymbol(
              geocodeResult.charity_name, 
              font, 
              new Color([r, g, b, 0.8])
            ).setOffset(5, 15);
            //add the location graphic and text with the address to the map 
            map.graphics.add(locationGraphic);
            console.log("adding graphic");
            map.graphics.add(new Graphic(pointMeters, textSymbol));
          }

          var ptAttr = evt.addresses[0].attributes;
          var minx = parseFloat(ptAttr.Xmin);
          var maxx = parseFloat(ptAttr.Xmax);
          var miny = parseFloat(ptAttr.Ymin);
          var maxy = parseFloat(ptAttr.Ymax);

          var esriExtent = new Extent(minx, miny, maxx, maxy, new SpatialReference({wkid:4326}));
          map.setExtent(webMercatorUtils.geographicToWebMercator(esriExtent));

          //showResults(evt.addresses);
        });
    
    function doSearchValue(vals) {
        locs = vals;
        console.log("HAWEREAR");
        addresses = [];
        var i = 1;
        
        locator.outSpatialReference = map.spatialReference;
        for (key in vals) {
            /*addresses.push({attributes:{
                OBJECTID: i,
                SingleLine: vals[key].Address.replace("\n","")
            }});
            i++;*/
            
            
            var options = {
              address: {SingleLine: vals[key].Address.replace("\n","")},
                outFields:['*']
            };
            
            locator.addressToLocations(options);
        }
        //console.log(addresses);
        
        //locator.addressesToLocations(addresses);
        /*
        $.getJSON("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/geocodeAddresses",
                  data={addresses:JSON.stringify(addresses),
                       token:"T_Bd_XY5oi-WE6Gv4zratpWEE2jspnMbSjzloAQwShMLJHNU0wXFQvx4FCzA4sU6WoDzASL37P-EfegrWXPhZ0BCEssosukB7T-_wzI_WMZpMe0yBv1eiL-LCb6Zi9D8xfPfKCsZxVqTgSuSqBUAsw..",
                       f:"pjson"},
                  success=function(data)
                  {
                    console.log(data);
                    for (loc in data.locations) {
                        console.log(loc.location);
                    }
                  });
        

       //highlight symbol
       var sms = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
             new Color([255, 0, 0]), 0.8),
          new Color([0, 0, 0, 0.35]));

       //label text symbol
       var ls = new TextSymbol().setColor(new Color([0, 0, 0, 0.9])).setFont(new Font("16px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLD, "Arial")).setOffset(15, -5).setAlign(TextSymbol.ALIGN_START);

       s.sources[0].highlightSymbol = sms; //set the symbol for the highlighted symbol
       s.sources[0].labelSymbol = ls; //set the text symbol for the label

       //If multiple results are found, it will default and select the first.
        
       for (var key in vals) {
           var val = vals[key]
           console.log(val);
           if (val.Address != undefined) {
                s.search(val.Address);
           } else {
               console.log("Undefined?");
           }
       } */
    }
    
    charityListeners.push(doSearchValue);
 }
);
