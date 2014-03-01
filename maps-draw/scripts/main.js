require.config({
    // relative url from where modules will load
    baseUrl: "/scripts/",
    waitSeconds: 200,
    paths: {
        "jquery": "libs/jquery-1.9.1.min",
        "jquery-ui": "libs/jquery-ui-1.10.3.min",        
        "tinypubsub": "libs/jquery.tinypubsub", 
    },

    shim: {
        "jquery-ui": ["jquery"],        
        "tinypubsub": ["jquery"]        
    }
});

// convert Google Maps into an AMD module
define("gmaps", ["async!http://maps.google.com/maps/api/js?v=3&sensor=false&libraries=drawing"],
function () {
    // return the gmaps namespace for brevity
    return window.google.maps;
});

//load standard modules across all pages
define("url", ["jquery", "libs/utilities/helpballoon", "libs/utilities/loader"],
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

require(["maps-draw/base", "jquery", "tinypubsub"],
    function (md, $) {
        //load maps draw
        var canvas = document.getElementById("canvas");
        md.Init(canvas);

        $.publish("/editor/start");
    }
);


