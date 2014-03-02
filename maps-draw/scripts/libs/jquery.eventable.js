jQuery.eventable = function (obj) {
  // Allow use of Function.prototype for shorthanding the augmentation of classes
  obj = jQuery.isFunction(obj) ? obj.prototype : obj;
  // Augment the object (or prototype) with eventable methods
  return $.extend(obj, jQuery.eventable.prototype);
};

jQuery.eventable.prototype = {

  // The trigger event must be augmented separately because it requires a
  // new Event to prevent unexpected triggering of a method (and possibly
  // infinite recursion) when the event type matches the method name
  trigger: function (type, data) {
    var event = new jQuery.Event(type); 
    event.preventDefault();                
    jQuery.event.trigger(event, data, this);
    return this;
  }
};

// Augment the object with jQuery's event methods
jQuery.each(['bind', 'one', 'unbind', 'on', 'off'], function (i, method) {
  jQuery.eventable.prototype[method] = function (type, data, fn) {
    jQuery(this)[method](type, data, fn);
    return this;
  };
});