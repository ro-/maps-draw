//loads the elements into namespace for maps-draw
define(
    ['jquery', 'gmaps', './types/shapemanager',
        './types/polygon', './types/polyline',
        './types/rectangle', './types/circle',
        './types/marker', './types/label',
        './types/tooltip'],
    function ($, gmaps, ShapeManager, Polygon, Polyline, Rectangle, Circle, Marker, Label, Tooltip) {

        var module = {};

        //link types
        module.ShapeManager = ShapeManager;
        module.Polygon = Polygon;
        module.Polyline = Polyline;
        module.Rectangle = Rectangle;
        module.Circle = Circle;
        module.Marker = Marker;
        module.Label = Label;
        module.Tooltip = Tooltip;             

        return module;
    }
);