define(
    ['jquery', 'gmaps', './shape'],
    function ($, gmaps, Shape) {

        function Marker(options) {

            var defaults = {
                type : "Marker"
            };
            
            $.extend(defaults, options);
            Shape.call(this, defaults); //call base constructor
        }     
        

        //inherits from Shape
        Marker.prototype = new Shape;

        //override base implementations
        Marker.prototype.GetCenter = function () {
            return this.shape.getPosition();
        };

        Marker.prototype.GetBounds = function () {
           //return this.shape.getBounds();
        };

        Marker.prototype.RevertToSaved = function () {
            if (this._options.geometry) {
                this.shape.setPosition(this._options.geometry);
                //this._saved = true;
            }
        };

        //override base implementations
        //map: googlemap element 
        //position: google latlng of element
        Marker.prototype.Render = function () {

            if (this._options.geometry == null) {
                //this._saved = false;
                return;
            }

            this.shape = new gmaps.Marker({
                position: this._options.geometry,  
                map: this._options.map
            });

            var self = this;
            gmaps.event.addListener(this.shape, "click", function () {
                self.fireEvent("click", [self]);
            });

            Shape.prototype.Render.call(this);
        };


        Marker.prototype.Delete = function () {

            _cleanupDraw(this);

            Shape.prototype.Delete.call(this);
        };

        Marker.prototype.SetEditable = function (turnon) {

            if (this.shape) {
                if (turnon) {
                    this.shape.setEditable(true);
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
                        _drawShape(this);
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

        function _drawShape(self) {

            self._options.map.setOptions({ draggableCursor: "url(" + $.url("Images") + "/crosshairs.cur), pointer" });

            self._createEvent = gmaps.event.addListener(self._options.map, "click", function (event) {

                self._VertexCreateHandler(event, function () {
                    _cleanupDraw(self);
                    self.SetGeometry(event.latLng);
                    self.Render();
                    self.fireEvent("complete", [self]);
                });
            });
        }

        return Marker;
    }
);