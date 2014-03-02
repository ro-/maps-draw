define(
    ['jquery', 'gmaps', './shape', './polyline.ext', './polygon.ext'],
    function ($, gmaps, Shape) {
        
        function Polygon(options) {
            
            var defaults = {
                type: "Polygon"
            };

            $.extend(defaults, options);
            Shape.call(this, defaults); //call base constructor

            this._polyline = null;
        }

        //inherits from Shape
        Polygon.prototype = new Shape;

        Polygon.prototype.RevertToSaved = function () {
            if (this._options.geometry) {
                this.shape.setPath(this._options.geometry);
            }
        };

        //override base implementations
        Polygon.prototype.Render = function () {

            if (this._options.geometry == null) {
                return;
            }
            
            this.shape = new gmaps.Polygon({
                strokeColor: this._options.colour,
                strokeOpacity: this._options.strokeOpacity,
                strokeWeight: this._options.strokeWeight,
                fillColor: this._options.colour,
                fillOpacity: this._options.fillOpacity,
                map: this._options.map,
                paths: this._options.geometry
            });
            
            var self = this;

            gmaps.event.addListener(this.shape, "click", function() {
                self.fireEvent("click", [self]);
            });

            gmaps.event.addListener(this.shape, "rightclick", function (e) {
                if (self._editing) {
                    if (e.vertex !== undefined) {
                        var path = self.shape.getPaths().getAt(e.path);

                        if (path.length <= 4) {
                            alert("Cannot have less than 4 points.");
                        } else {
                            path.removeAt(e.vertex);
                        }
                    }
                }
            });

            Shape.prototype.Render.call(this);
        };

        //gets polygon center
        Polygon.prototype.GetCenter = function () {
            return this.shape.getBounds().getCenter(); //uses extension method
        };
        
        //gets polygon bounds
        Polygon.prototype.GetBounds = function () {
            return this.shape.getBounds();
        };
        
        Polygon.prototype.Delete = function () {

            _cleanupDraw(this);
            
            Shape.prototype.Delete.call(this);
        };
        
        Polygon.prototype.SetEditable = function (turnon) {
            
            if (this.shape) {
                if (turnon) {
                    this.shape.setEditable(true);
                    this._options.map.fitBounds(this.shape.getBounds()); //zoom to shape
                    this._editing = true;
                    this.RemoveName();
                    this.SetSelected(true);
                } else {
                    this.shape.setEditable(false);
                    this.SetName(this.name); //updates name
                    this._editing = false;
                }
            } else {
                if (turnon) {
                    if (!this._editing) { //triggers drawing mode
                        this._editing = true;
                        _drawPolygon(this);
                    }
                } else {
                    _cleanupDraw(this);
                }
            }
        };
        
        function _cleanupDraw(self) {
            if (self._polyline) {
                self._polyline.stopEdit();
                self._polyline.setMap(null);
            }
            if(self._createEvent) gmaps.event.removeListener(self._createEvent);
            self._options.map.setOptions({ draggableCursor: null });
        }
        
        function _drawPolygon(self) {
            
            //no shape so draw polyline first
            self._polyline = new gmaps.Polyline({
                strokeColor: self._options.selectedColour, //"#ff1e1e",
                strokeOpacity: self._options.strokeOpacity,
                strokeWeight: self._options.strokeWeight,
                map: self._options.map
            });

            //function exists only if included polyline js extension
            self._polyline.runEdit(function() {
                _cleanupDraw(self);
                self.SetGeometry(self._polyline.getPath());
                self.Render();
                self.fireEvent("complete", [self]);
            });
            self.editing = true;

            self._options.map.setOptions({ draggableCursor: "url(" + $.url("Images") + "/crosshairs.cur), pointer" });
            
            self._createEvent = gmaps.event.addListener(self._options.map, "click", function (event) {

                self._VertexCreateHandler(event, function() {
                    var path = self._polyline.getPath();
                    path.insertAt(path.getLength(), event.latLng);
                });
            });
        }
        
        return Polygon;
    }
);