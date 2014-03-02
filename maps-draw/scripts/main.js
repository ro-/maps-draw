require.config({
    // relative url from where modules will load
    baseUrl: "/scripts/",
    waitSeconds: 200,
    paths: {
        "jquery": "libs/jquery-1.9.1.min",
        "jquery-ui": "libs/jquery-ui-1.10.3.min",        
        "tinypubsub": "libs/jquery.tinypubsub",
        "eventable": "libs/jquery.eventable",
    },

    shim: {
        "jquery-ui": ["jquery"],        
        "tinypubsub": ["jquery"],
        "eventable": ["jquery"]
    }
});

// convert Google Maps into an AMD module
define("gmaps", ["async!http://maps.google.com/maps/api/js?v=3&sensor=false&libraries=drawing"],
function () {
    // return the gmaps namespace for brevity
    return window.google.maps;
});

//load standard modules across all pages
require(["jquery"],
function ($) {    
    // create url helper
    $.url = function (url) {
        var _applicationRoot = "/";

        if (url.toLowerCase() == "images") {
            url = "assets/" + url;
        }

        return _applicationRoot + url;
    };
    
    return $;
});

//configure demo

require(["usercontrols/maps-controller", "jquery", "tinypubsub"],
    function (maps, $) {
        //load maps draw
        var canvas = document.getElementById("canvas");
        maps.Init(canvas);

        $.publish("/editor/start");
    }
);


