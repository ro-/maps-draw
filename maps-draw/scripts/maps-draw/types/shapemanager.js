//ShapeManager: manages a collction of shapes

//events
//modechange: [@string: mode]
define(
    ['jquery', 'gmaps', './eventable'],
    function ($, gmaps, Eventable) {
        
        //modes the shape manager can be in
        var modes = {
            ready: "ready",
            select: "select",
            create: "create",
            edit: "edit"
        };

        function ShapeManager(map) {
            this.shapes = new Array();
            this._selectedShape = null;
            this._editable = false;
            this._map = map;
        }        

        //add event handling
        ShapeManager.prototype = new Eventable;

        ShapeManager.prototype.SetEditable = function (on) {
            this._editable = on;
            if (on) {
                this.DeselectCurrent();
                this._setMode(modes.ready);
            }
        };

        ShapeManager.prototype.Add = function (shape, setSelected) {

            var index = this.IndexOf(shape);

            if (index == -1) {
                this.shapes.push(shape);

                //inject map reference
                shape.SetOptions({ map: this._map });

                var self = this;
                shape.addEventListener("click", function () {
                    self._trySetSelected(shape);                    
                });

                shape.addEventListener("complete", function () {
                    //edit shape
                    self.EditCurrent();
                });

                shape.Render();

                if (setSelected) {
                    this._trySetSelected(shape);
                }
            }
        };

        ShapeManager.prototype.Remove = function (shape) {
            var index = this.IndexOf(shape);

            if (index !== -1) {
                if (this._selectedShape === shape) {
                    this._selectedShape = null;
                    this._setMode(modes.ready);
                }

                shape.Delete();
                this.shapes.splice(index, 1);
            }
        };

        ShapeManager.prototype.IndexOf = function (shape) {
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
                    this._trySetSelected(this.shapes[i]);
                }
            }

            return this._selectedShape;
        };

        ShapeManager.prototype.GetSelected = function () {
            return this._selectedShape;
        };

        ShapeManager.prototype.GetBounds = function () {
            var bounds = new gmaps.LatLngBounds(),
                i = 0,
                len = this.shapes.length
            ;

            for (; i < len; i++) {
                var b = this.shapes[i].GetBounds();
                if (this.shapes[i].GetBounds()) bounds.union(b);
            }

            return len == 0 ? null : bounds;
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
                if (this.shapes[i]._options.category == category) {
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
        ShapeManager.prototype.CanAddNewShape = function () {
            if (this._editable && !this._selectedShape) {
                return true;
            }

            return false;
        };

        ShapeManager.prototype.DeselectCurrent = function () {
            if (this._selectedShape) {
                this._selectedShape.SetSelected(false);
                this._selectedShape = null;
                this._setMode(modes.ready);
            }
        };

        //returns success
        ShapeManager.prototype.EditCurrent = function () {

            if (!this._editable || !this._selectedShape) return false;

            this._selectedShape.SetEditable(true);

            if (!this._selectedShape.IsCompleted()) {
                this._setMode(modes.create);
            } else {
                this._setMode(modes.edit);
            }

            //ignore clicks on the other shapes
            this._setShapesClickable(false);

            return true;
        };

        //returns success
        ShapeManager.prototype.FinishEditCurrent = function () {

            if (this._editable && this._selectedShape) {
                if (!this._selectedShape.IsCompleted()) {
                    this.Remove(this._selectedShape);
                } else {
                    this._selectedShape.SetEditable(false);
                    this._selectedShape.RevertToSaved();
                    this.DeselectCurrent();
                }

                this._setMode(modes.ready);
                this._setShapesClickable(true);
            }

        };     

        ShapeManager.prototype._setShapesClickable = function (clickable) {

            if (!this._editable) return;

            clickable = clickable || false;

            //set all shapes to non clickable
            var i = 0,
                len = this.shapes.length;

            for (; i < len; i++) {
                if (!this._selectedShape || this._selectedShape !== this.shapes[i]) {
                    if (this.shapes[i].shape) this.shapes[i].shape.setOptions({ clickable: clickable });
                }
            }
        };

        ShapeManager.prototype._trySetSelected = function(shape) {

            //deselect current
            if (this._selectedShape) {
                if (this._selectedShape.IsEditing()) {
                    return; //ignore click event
                } else if (this._selectedShape === shape) {
                    this.DeselectCurrent();
                    return;
                } else {
                    this._selectedShape.SetSelected(false);
                }
            }

            shape.SetSelected(true);
            this._selectedShape = shape;

            //start editing
            if (this._editable) {
                this.EditCurrent();
            } else { 
                this._setMode(modes.select);
            } 
        }        

        ShapeManager.prototype._setMode = function(mode) {
            switch (mode) {
                case modes.ready:

                    this.fireEvent("modechange", ["ready"]);
                    break;

                case modes.select:

                    this.fireEvent("modechange", ["select", this._selectedShape]);
                    break;

                case modes.create:

                    this.fireEvent("modechange", ["create", this._selectedShape]);
                    break;

                case modes.edit:

                    this.fireEvent("modechange", ["edit", this._selectedShape]);
                    break;
            }
        };
             
        return ShapeManager;
    }
);
