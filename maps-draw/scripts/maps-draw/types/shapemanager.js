//ShapeManager: manages a collction of shapes
define(
    ['jquery', 'gmaps', 'tinypubsub'],
    function ($, gmaps) {
        
        function ShapeManager(map) {
            this.shapes = new Array();
            this._selectedShape = null;
            this._editable = false;
            this._map = map;
            
            var self = this;
            
            //handle shape events
            $.subscribe("/shape/click", function (e, shape) {
                console.log("Shape clicked: " + shape.name);
                if (self._editable) { //ignoring if not editing for now
                    _trySetSelected(self, shape);
                }
            });
        }
        
        ShapeManager.prototype.SetEditable = function (on) {
            this._editable = on;
            if (on) {
                this.DeselectCurrent();
                $.publish("/editor/modeChanged", ["ready"]);
            }
        };
        
        ShapeManager.prototype.Add = function (shape, setSelected) {
            
            var index = this.IndexOf(shape);

            if (index == -1) {
                this.shapes.push(shape);
                
                //inject map reference
                shape.SetOptions({ map: this._map });
                
                shape.ShapeComplete = function() {
                    $.publish("/editor/shapeCompleted", [shape]);
                };
                
                shape.Render();
                
                if (setSelected) {
                    _trySetSelected(this, shape);
                }
            }
        };
        
        ShapeManager.prototype.Remove = function (shape) {
            var index = this.IndexOf(shape);
            
            if (index !== -1) {
                if (this._selectedShape === shape) {
                    this._selectedShape = null;
                    $.publish("/editor/modeChanged", ["ready"]);
                }
                
                shape.Delete();
                this.shapes.splice(index, 1);
            }
        };

        ShapeManager.prototype.IndexOf = function(shape) {
            var i = 0,
                len = this.shapes.length
            ;
            
            for (; i < len; i++) {
                if (i in this.shapes && this.shapes[i] === shape) {
                    return i;
                }
            }
            return -1;
        };

        ShapeManager.prototype.SetSelected = function (id, category) {
            var i = 0,
                len = this.shapes.length
            ;

            for (; i < len; i++) {
                if (this.shapes[i].id == id && this.shapes[i].category == category) {
                    _trySetSelected(this, this.shapes[i]);
                }
            }
            
            return this._selectedShape;
        };
        
        ShapeManager.prototype.GetSelected = function() {
            return this._selectedShape;
        };
        
        ShapeManager.prototype.GetBounds = function() {
            var bounds = new gmaps.LatLngBounds(),
                i = 0,
                len = this.shapes.length
            ;
            
            for (; i < len; i++) {
                var b = this.shapes[i].GetBounds();
                if(this.shapes[i].GetBounds()) bounds.union(b);
            }
            
            return bounds;
        };
        
        ShapeManager.prototype.Render = function (map) {
            var i = 0,
                len = this.shapes.length
            ;

            for (; i < len; i++) {
                this.shapes[i].Render(map);
            }
        };
        
        ShapeManager.prototype.ToggleCategoryVisible = function (category) {
            if (!this._editable) return;
            
            var i = 0,
                len = this.shapes.length
            ;

            for (; i < len; i++) {
                if (this.shapes[i].category == category) {
                    this.shapes[i].ToggleVisible();
                }
            }
        };
        
        ShapeManager.prototype.Clear = function () {
            while (this.shapes.length > 0) {
                this.Remove(this.shapes[0]);
            }
        };

        //tests to see if new shape can be added
        ShapeManager.prototype.CanAddNewShape = function() {
            if (this._editable && !this._selectedShape) {
                return true;
            }

            return false;
        };

        ShapeManager.prototype.DeselectCurrent = function() {
            if (this._selectedShape) {
                this._selectedShape.SetSelected(false);
                this._selectedShape = null;
                if (this._editable) $.publish("/editor/modeChanged", ["ready"]);
            }
        };

        //returns success
        ShapeManager.prototype.EditCurrent = function() {

            if (!this._editable || !this._selectedShape) return false;
            
            this._selectedShape.SetEditable(true);
            $.publish("/editor/modeChanged", ["edit", this._selectedShape]);
            
            _setShapesClickable(this, false);

            return true;
        };
        
        //returns success
        ShapeManager.prototype.FinishEditCurrent = function () {

            if (this._editable && this._selectedShape) {
                this._selectedShape.SetEditable(false);
                $.publish("/editor/modeChanged", ["select"]);

                _setShapesClickable(this, true);
                
                return true;
            }

            return false;
        };
        
        //returns success
        ShapeManager.prototype.CancelEditCurrent = function () {
            
            if (this._editable && this._selectedShape) {
                
                //if shape is completed then revert back to previous state
                //if not, just delete the shape completely
                if (!this._selectedShape.IsCompleted()) {
                    this.Remove(this._selectedShape);
                } else {
                    this._selectedShape.SetEditable(false);
                    this._selectedShape.RevertToSaved();
                    this.DeselectCurrent();
                }
                _setShapesClickable(this, true);
                $.publish("/editor/modeChanged", ["ready"]);
            }

            return true;
        };
        
        function _setShapesClickable(self, clickable) {

            if (!self._editable) return;
            
            clickable = clickable || false;
            
            //set all shapes to non clickable
            var i = 0,
                len = self.shapes.length;

            for (; i < len; i++) {
                if (!self._selectedShape || self._selectedShape !== self.shapes[i]) {
                    if(self.shapes[i].shape) self.shapes[i].shape.setOptions({ clickable: clickable });
                }
            }
        }


        function _trySetSelected(self, shape) {
            if (self._selectedShape) {
                if (self._selectedShape.IsEditing()) {
                    return; //ignore click event
                } else if (self._selectedShape === shape) {
                    self.DeselectCurrent();
                    return;
                } else {
                    self._selectedShape.SetSelected(false);
                }
            }

            shape.SetSelected(true);
            self._selectedShape = shape;
            //$.publish("/shape/selected", [self.id, paddockId]);
            if (self._editable) $.publish("/editor/modeChanged", ["select"]);
            
            //skip directly to editing
            self.EditCurrent();
        }

        return ShapeManager;
    }
);
