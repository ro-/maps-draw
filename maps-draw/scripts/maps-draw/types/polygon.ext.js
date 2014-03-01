/**
  *@Author: Rowan Lewis
 * @Updated: 28/2/2014
 * @class: Google polygon extension methods 
 */
/**
 * @name gmaps.Polygon
 * @class Extends standard class gmaps.Polygon with helper methods 
 *        
 */

define(
    ['gmaps'],
    function(gmaps) {
        if (!gmaps.Polygon.prototype.getBounds) {
            gmaps.Polygon.prototype.getBounds = function() {
                var bounds = new gmaps.LatLngBounds();
                var paths = this.getPaths();
                var path;
                for (var p = 0; p < paths.getLength(); p++) {
                    path = paths.getAt(p);
                    for (var i = 0; i < path.getLength(); i++) {
                        bounds.extend(path.getAt(i));
                    }
                }
                return bounds;
            }
        }
        if (!gmaps.Polygon.prototype.contains) {
            gmaps.Polygon.prototype.contains = function(point) {
                var j = 0;
                var oddNodes = false;
                var x = point.lng();
                var y = point.lat();

                var paths = this.getPath();

                for (var i = 0; i < paths.getLength(); i++) {
                    j++;
                    if (j == paths.getLength()) {
                        j = 0;
                    }
                    if (((paths.getAt(i).lat() < y) && (paths.getAt(j).lat() >= y))
                        || ((paths.getAt(j).lat() < y) && (paths.getAt(i).lat() >= y))) {
                        if (paths.getAt(i).lng() + (y - paths.getAt(i).lat())
                            / (paths.getAt(j).lat() - paths.getAt(i).lat())
                            * (paths.getAt(j).lng() - paths.getAt(i).lng()) < x) {
                            oddNodes = !oddNodes;
                        }
                    }
                }
                return oddNodes;
            };
        }
        if (!gmaps.Polygon.prototype.getNorthMost) {
            gmaps.Polygon.prototype.getNorthMost = function() {

                var paths = this.getPaths();
                var path, northMost;

                for (var p = 0; p < paths.getLength(); p++) {
                    path = paths.getAt(p);
                    northMost = path.getAt(0);

                    for (var i = 0; i < path.getLength(); i++) {

                        if (path.getAt(i).lat() > northMost.lat()) {
                            northMost = path.getAt(i);
                        }
                    }
                }
                return northMost;
            };
        }

        if (!gmaps.Polygon.prototype.getEastMost) {
            gmaps.Polygon.prototype.getEastMost = function() {

                var paths = this.getPaths();
                var path, eastMost, lastDif;
                var result;

                var bounds = this.getBounds();
                var cen = bounds.getCenter();
                var ne = bounds.getNorthEast();

                for (var p = 0; p < paths.getLength(); p++) {
                    path = paths.getAt(p);
                    lastDif = 0;
                    result = path.getAt(0); //set to first point in case no better found

                    for (var i = 0; i < path.getLength(); i++) {

                        var xDif = (ne.lng() - cen.lng()) / (path.getAt(i).lng() - cen.lng());
                        var yDif = (ne.lat() - cen.lat()) / (path.getAt(i).lat() - cen.lat());

                        if ((xDif > 0) && (yDif > 0)) {

                            var dif = xDif * yDif;

                            if (dif > lastDif) {
                                result = path.getAt(i);
                            }
                        }
                    }
                }
                return result;
            };
        }
    }
);