//creates a grouping namespace for types
define(
    ['jquery', 'gmaps', './shapemanager', './polygon', './polyline', './rectangle', './circle', './marker', './label', './tooltip'],
    function ($, gmaps, ShapeManager, Polygon, Polyline, Rectangle, Circle, Marker, Label, Tooltip) {

        var base = {};

        base.ShapeManager = ShapeManager;
        base.Polygon = Polygon;
        base.Polyline = Polyline;
        base.Rectangle = Rectangle;
        base.Circle = Circle;
        base.Marker = Marker;
        base.Label = Label;
        base.Tooltip = Tooltip;

        return base;
    }
);