define(
    ['jquery', 'gmaps', './shape'],
    function ($, gmaps, Shape) {

        function Rectangle(category, name) {
            Shape.call(this, "Rectangle", category, name); //call base constructor
        }

        //inherits from Shape
        Rectangle.prototype = new Shape;

        //override base implementations

        return Rectangle;
    }
);