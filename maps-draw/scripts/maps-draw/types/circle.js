define(
    ['jquery', 'gmaps', './shape'],
    function ($, gmaps, Shape) {
        
        function Circle(options) {

            var defaults = {
                type : "Circle",
                radius : 1000
            };
            
            $.extend(defaults, options);
            Shape.call(this, defaults); //call base constructor
        }

        //inherits from Shape
        Circle.prototype = new Shape;
        
        Circle.prototype.GetCenter = function () {
            return this.shape.getCenter();
        };

        Circle.prototype.GetBounds = function () {
            return this.shape.getBounds();
        };

        Circle.prototype.RevertToSaved = function () {
            if (this._options.geometry) {
                this.shape.setCenter(this._options.geometry);
                this.shape.setRadius(this._options.radius);
                //this._saved = true;
            }
        };
        
        //override base implementations
        //map: googlemap element 
        //position: google latlng of element
        Circle.prototype.Render = function () {
            
            if (this._options.geometry == null) {
                //this._saved = false;
                return;
            }
            
            this.shape = new gmaps.Circle({
                center: this._options.geometry,
                radius: this._options.radius,
                strokeColor: this._options.colour,
                strokeOpacity: this._options.strokeOpacity,
                strokeWeight: this._options.strokeWeight,
                fillColor: this._options.colour,
                fillOpacity: this._options.fillOpacity,
                map: this._options.map
            });
            
            var self = this;
            gmaps.event.addListener(this.shape, "click", function () {
                $.publish("/shape/click", [self]);
            });
            
            Shape.prototype.Render.call(this);
        };
        

        Circle.prototype.Delete = function () {

            _cleanupDraw(this);

            Shape.prototype.Delete.call(this);
        };
        
        Circle.prototype.SetEditable = function (turnon) {

            if (this.shape) {
                if (turnon) {
                    this.shape.setEditable(true);
                    this._editing = true;
                    this.RemoveName();
                } else {
                    this.shape.setEditable(false);
                    this.SetName(this.name); //updates name
                    this._editing = false;
                    //this._saved = false;
                }
            } else {
                if (turnon) {
                    if (!this._editing) { //triggers drawing mode
                        this._editing = true;
                        _drawCircle(this);
                    }
                } else {
                    _cleanupDraw(this);
                }
            }
        };
        
        function _cleanupDraw(self) {
            if (self._createEvent) gmaps.event.removeListener(self._createEvent);
            self._options.map.setOptions({ draggableCursor: null });
        }

        function _drawCircle(self) {
            
            self._options.map.setOptions({ draggableCursor: "url(" + $.url("Images") + "/crosshairs.cur), pointer" });

            self._createEvent = gmaps.event.addListener(self._options.map, "click", function (event) {
                
                self._VertexCreateHandler(event, function () {
                    _cleanupDraw(self);
                    self.SetGeometry(event.latLng);
                    self.Render();
                    self.SetSelected(true);
                    self.SetEditable(true);
                });
            });
        }
        
        
        return Circle;
    }
);