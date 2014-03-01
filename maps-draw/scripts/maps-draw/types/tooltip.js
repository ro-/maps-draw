define(
    function() {
        var tooltip = function(parent) {
            this.tt = null;
            this.moveHandler = null;
        };

        tooltip.prototype.Show = function(v) {
            var self = this;

            if (this.tt == null) {
                this.tt = $("<div />");
                this.tt.attr('class', 'map-tooltip');
                $("body").append(this.tt);

                this.tt.hide();

                this.moveHandler = function(e) {
                    self.tt.css("top", (e.pageY - self.tt.outerHeight() - 3) + 'px');
                    self.tt.css("left", (e.pageX + 3) + 'px');
                };
                $(document).bind("mousemove.tooltip", this.moveHandler);
            }
            this.tt.html(v);
            this.tt.stop(true, true);
            this.tt.fadeIn("200");
        };

        tooltip.prototype.Destroy = function() {
            if (this.tt != null) this.tt.remove();
            if (this.moveHandler != null) $(document).unbind('mousemove.tooltip', this.moveHandler);
        };

        tooltip.prototype.Hide = function() {
            if (this.tt != null) {
                this.tt.fadeOut("200");
            }
        };

        return tooltip;
    }
);