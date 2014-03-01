/**
  *Author: Rowan Lewis
 * @Updated: 28/2/2014
 * @class: Google polyline extension methods
 */
/**
 * @name gmaps
 * @class The fundamental namespace for Google Maps V3 API 
 */
/**
 * @name gmaps.Polyline
 * @class Extends standard class gmaps.Polyline by methods runEdit() and
 *        stopEdit()
 */
define(
    ['gmaps'],
    function(gmaps) {
        if (typeof(gmaps.Polyline.prototype.runEdit) === "undefined") {
            /**
             * Starts editing the polyline. Optional parameter <code>flag</code>
             * indicates the use of ghost markers in the middle of each segment. By
             * default, the <code>flag</code> is true.
             * 
             * @param {}
             *            flag - (true) include additional points in the middle of each
             *            segment
             */
            

            gmaps.Polyline.prototype.runEdit = function (onFinish) {

                var self = this;
                var finishOnClickFirst = true;
                var minVertices = 4;
                
                //run base editing function
                this.setEditable(true);
                
                this.previewLine = new gmaps.Polyline({
                    strokeColor: this.strokeColor,
                    strokeOpacity: this.strokeOpacity / 2,
                    strokeWeight: this.strokeWeight,
                    clickable: false,
                    map: this.getMap()
                });

                var setOrInsertAt = function(e) {
                    var path = self.getPath();
                    if (e == path.getLength() - 1) {
                        var tempPath = self.previewLine.getPath();
                        tempPath.clear();
                        tempPath.push(path.getAt(e));
                        tempPath.push(path.getAt(e));
                    }
                };

                var mouseMove = function(e) {
                    var path = self.previewLine.getPath();
                    if (path.getLength() == 2) path.setAt(1, e.latLng);
                };

                var rightClickVertex = function(e) {
                    if (e.vertex !== undefined) {
                        var path = self.getPath();
                        if (path.length > 1) {
                            path.removeAt(e.vertex);
                        }

                        var tempPath = self.previewLine.getPath();
                        if (tempPath.getLength() == 2) tempPath.setAt(0, path.getAt(path.getLength() - 1));
                    }
                };

                var leftClickFirst = function(e) {
                    if (finishOnClickFirst && e.vertex !== undefined) {
                        if (e.vertex == 0) {

                            if (self.getPath().getLength() < minVertices) {
                                alert("Error: Minimum boundary points is " + minVertices);
                                return;
                            }

                            self.stopEdit();
                            if (onFinish) onFinish();                            
                        }
                    }
                };

                this.previewLine.mapMoveListener = gmaps.event.addListener(this.getMap(), "mousemove", mouseMove);
                gmaps.event.addListener(this, "click", leftClickFirst);
                gmaps.event.addListener(this, "rightclick", rightClickVertex);
                gmaps.event.addListener(this.getPath(), "insert_at", setOrInsertAt);
                gmaps.event.addListener(this.getPath(), "set_at", setOrInsertAt);

            };
        }
        if (typeof(gmaps.Polyline.prototype.stopEdit) === "undefined") {
            /**
             * Stops editing polyline
            */
            gmaps.Polyline.prototype.stopEdit = function () {
                this.setEditable(false);

                if (this.previewLine) {
                    if (this.previewLine.mapMoveListener) {
                        gmaps.event.removeListener(this.previewLine.mapMoveListener);
                    }
                    
                    this.previewLine.setMap(null);
                    this.previewLine = undefined;
                }
            };
        }
    }
);