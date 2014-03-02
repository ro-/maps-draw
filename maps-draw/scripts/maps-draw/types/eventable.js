//Shape: base class
define(
    [],
    function () {

        function Eventable() {
            var _this = this;
            _this.events = {};

            Eventable.prototype.addEventListener = function (name, handler) {
                if (_this.events.hasOwnProperty(name))
                    _this.events[name].push(handler);
                else
                    _this.events[name] = [handler];
            };

            Eventable.prototype.removeEventListener = function (name, handler) {
                /* This is a bit tricky, because how would you identify functions?
                   This simple solution should work if you pass THE SAME handler. */
                if (!_this.events.hasOwnProperty(name))
                    return;

                var index = _this.events[name].indexOf(handler);
                if (index != -1)
                    _this.events[name].splice(index, 1);
            };

            Eventable.prototype.fireEvent = function (name, args) {
                if (!_this.events.hasOwnProperty(name))
                    return;

                if (!args || !args.length)
                    args = [];

                var evs = _this.events[name], l = evs.length;
                for (var i = 0; i < l; i++) {
                    evs[i].apply(null, args);
                }
            };
        }

        return Eventable;
    }
);