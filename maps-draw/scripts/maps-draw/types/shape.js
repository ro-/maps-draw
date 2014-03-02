//Shape: base class
define(
    ['jquery', 'gmaps', './label', './eventable'],
    function ($, gmaps, Label, Eventable) {
        
        function Shape(options) {
            
            this._options = {
                type: "Shape",
                category: "",
                geometry: null,
                colour: "#aaaaa",
                selectedColour: "#eeeeee",
                name: "",
                map: null,
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillOpacity: 0.35,
            };
            
            if (options) $.extend(this._options, options);

            this.shape = null;
            this._label = null;
            this._selected = false;
            this._editing = false;
            
            //event hooks
            this._createEvent = null;
            this._beforeVertexCreateEvents = null;
        }

        //add event handling
        Shape.prototype = new Eventable; //$.eventable(Shape.prototype);

        //declare base functions
        Shape.prototype.SetOptions = function (options) {
            if (options) $.extend(this._options, options);
            
            if (options.name) {
                this.SetName();
            }
        };
        
        Shape.prototype.GetOptions = function () {
            return this._options;
        };
        
        Shape.prototype.SetGeometry = function (geometry) {
            this._options.geometry = geometry;
        };
       
        Shape.prototype.IsSelected = function () {
            return this._selected;
        };

        Shape.prototype.IsEditing = function () {
            return this._editing;
        };
        
        Shape.prototype.IsCompleted = function () {
            return true;
        };

        Shape.prototype.ToggleVisible = function() {
            if (this.shape) {
                var isVisible = this.shape.getVisible();
                this.shape.setVisible(!isVisible);
                this._label.setMap(!isVisible ? this._options.map : null);
            }
        };
        
        //Create takes the map reference and a path to render
        Shape.prototype.Render = function () {
            this.SetName(this._options.name);
        };

        //returns a google lat long representing the center
        Shape.prototype.GetCenter = function() {};

        //returns bounds of shape
        Shape.prototype.GetBounds = function() {};

        Shape.prototype.SetName = function (name) {
           
            //label
            this._options.name = name || this._options.name;

            if (this._options.name != null) {
                if (this._label != null) this._label.setMap(null);
                this._label = new Label({ map: this._options.map, text: this._options.name, position: this.GetCenter(), color: this._options.colour });
                this._label.bindTo("zoom", this._options.map, "zoom");
            }
        };

        Shape.prototype.RemoveName = function () {
            //label
            if (this._label != null) this._label.setMap(null);
        };
        
        Shape.prototype.Delete = function() {
            //remove from map
            if (this.shape != null) {
                this.shape.setMap(null);
            }

            if (this.shape) {
                gmaps.event.clearListeners(this.shape, "click");
                gmaps.event.clearListeners(this.shape, "rightclick");
            }
            
            //remove listeners
            if (this._createEvent) {
                gmaps.event.removeListener(this._createEvent);
            }
            
            //remove cursor
            this._options.map.setOptions({ draggableCursor: null });
            
            if (this._label) this._label.setMap(null);
        };

        //selects shape
        Shape.prototype.SetSelected = function(selected) {
            this.selected = selected;
            
            if (selected) {
                if (this.shape) {
                    this.shape.setOptions({ fillColor: this._options.selectedColour, strokeColor: this._options.selectedColour });
                }
            } else {
                if (this.shape) this.shape.setOptions({ fillColor: this._options.colour, strokeColor: this._options.colour });
            }
        };
        
        Shape.prototype.IsCompleted = function () {
            return this.shape != null;
        };
        
        Shape.prototype.AddVertexCreateHandler = function (handler) {
            if (typeof handler == 'function') {
                this._beforeVertexCreateEvents = handler;
            } else {
                console.error("Shape.prototype.AddVertexCreateHandler only accepts a function");
            }
        };

        Shape.prototype._VertexCreateHandler = function(event, onSuccess) {
            if (this._beforeVertexCreateEvents) {
                this._beforeVertexCreateEvents(this, event, onSuccess);
            } else {
                onSuccess();
            }
        };
        
        return Shape;
    }
);
