define(
    ['jquery', 'gmaps', './shape'],
    function ($, gmaps, Shape) {

        function Marker(category, name) {
            Shape.call(this, "Marker", category, name); //call base constructor
        }

        //inherits from Shape
        Marker.prototype = new Shape;

        //override base implementations

        return Marker;
    }
);