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

getCharities();

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

"dojo/domReady!"
], function (
    Map, Search, Font, Point, SpatialReference, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol, Color, TextSymbol, registry, Button, parser, webMercatorUtils, Graphic, FeatureLayer, SimpleRenderer, TemporalRenderer,
TimeClassBreaksAger, SimpleLineSymbol, TimeExtent)

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
      console.log("map loaded", maploadEvent);

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
      console.log("shmap loaded", maploadEvent);

      var featureCollection = {
        layerDefinition: layerDefinition,
        featureSet: null
      };
      featureLayer = new FeatureLayer(featureCollection);

      console.log("shmap asdfadsfasdoaded", maploadEvent);
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

      console.log("maap loaddded", maploadEvent);
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

    function doSearchValue(vals) {

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
        
       for (var val in vals) {
           if (val.address != undefined) {
                s.search(val.address);
           }
       }
    }
    
    charityListeners.push(doSearchValue);
 }
);
