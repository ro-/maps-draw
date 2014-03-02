define(
    ['jquery', 'gmaps', './shape'],
    function ($, gmaps, Shape) {

        function Polyline(category, name) {
            Shape.call(this, "Polyline", category, name); //call base constructor
        }

        //inherits from Shape
        Polyline.prototype = new Shape;

        //override base implementations

        return Polyline;
    }
);