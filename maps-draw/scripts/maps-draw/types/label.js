define(
    ['gmaps'],
    function(gmaps) {

        // Define the overlay, derived from gmaps.OverlayView
        var label = function(options) {
            // Initialization
            this.setValues(options);

            var div = this.div_ = document.createElement('div');
            div.style.cssText = 'position: absolute; display: none; -webkit-transform: translateZ(0px); z-index:1000;';

            // Label specific
            var span = this.span_ = document.createElement('span');

            span.style.cssText = 'position: relative; left: -50%; top: -8px; display:block; filter:progid:DXImageTransform.Microsoft.Glow(Color=#333333, Strength=2); ' +
                'white-space: nowrap; border: none; color:' + this.get('color') + '; ' +
                'padding: 2px; z-index:1000; font-size:12px; ';

            if (this.get('shadowstyle') == undefined)
                span.style.cssText += 'text-shadow: -1px -1px 0px #111, 1px -1px 0px #111, -1px 1px 0px #111, 1px 1px 0px #111;';
            else
                span.style.cssText += this.get('shadowstyle');

            div.appendChild(span);
        };

        if (gmaps.OverlayView) {
            label.prototype = new gmaps.OverlayView();
        }

        // Implement onAdd
        label.prototype.onAdd = function() {
            var pane = this.getPanes().overlayLayer;
            pane.appendChild(this.div_);

            // Ensures the label is redrawn if the text or position is changed.
            var me = this;
            this.listeners_ = [
                gmaps.event.addListener(this, 'position_changed', function() { me.draw(); }),
                gmaps.event.addListener(this, 'text_changed', function() { me.draw(); })
            ];
        };

        // Implement onRemove
        label.prototype.onRemove = function() {
            this.div_.parentNode.removeChild(this.div_);

            // Label is removed from the map, stop updating its position/text.
            for (var i = 0, I = this.listeners_.length; i < I; ++i) {
                gmaps.event.removeListener(this.listeners_[i]);
            }
        };

        // Implement draw
        label.prototype.draw = function() {
            var projection = this.getProjection();
            var position = projection.fromLatLngToDivPixel(this.get('position'));
            var mapzoom = this.get('zoom');
            if (mapzoom == null) mapzoom = 16;

            var div = this.div_;

            if (mapzoom > 11) {
                div.style.left = position.x + 'px';
                div.style.top = position.y + 'px';
                div.style.display = 'block';
                this.span_.innerHTML = this.get('text').toString();
            } else {
                div.style.display = 'none';
            }
        };

        return label;
    }
);