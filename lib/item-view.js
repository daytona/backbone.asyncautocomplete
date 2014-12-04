(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['underscore', 'backbone'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS.
    module.exports = factory(require('underscore'), require('backbone'));
  }

}(this, function (_, Backbone) {
  'use strict';

  var IS_SELECTED = {'isSelected': true};
  var IS_CANDIDATE = {'isCandidate': true};
  var NOT_SELECTED = {'isSelected': false};
  var NOT_CANDIDATE = {'isCandidate': false};
  var EVENT_MAP = {
    'touchstart.autocomplete': 'onTouchstart',
    'touchmove.autocomplete': 'onTouchmove',
    'touchend.autocomplete': 'onTouchend',
    'mousedown.autocomplete': 'onClick'
  };

  var Item = Backbone.View.extend({
    constructor: function (options) {
      // Merge events
      options.events = (_.result(options, 'events') || {});
      _.defaults(options.events, _.result(this, 'events'), EVENT_MAP);

      var touchLog = {};
      this.onTouchstart = _.partial(this.onTouchstart, _, touchLog);
      this.onTouchmove = _.partial(this.onTouchmove, _, touchLog);
      this.onTouchend = _.partial(this.onTouchend, _, touchLog);

      return Backbone.View.call(this, options);
    },

    onClick: function (event) {
      this.model.set(IS_SELECTED);
    },

    onTouchstart: function (event, log) {
      var touch = event.originalEvent.touches[0];

      log.isValid = true;
      log.time = new Date();
      log.startX = touch.clientX;
      log.startY = touch.clientY;

      this.model.set(IS_CANDIDATE);
    },

    onTouchmove: function (event, log) {
      var touch = event.originalEvent.touches[0];

      log.moveX = Math.abs(log.startX - touch.clientX);
      log.moveY = Math.abs(log.startY - touch.clientY);

      if ((log.moveX > 9) || (log.moveY > 9)) {
        log.isValid = false;
        this.model.set(NOT_CANDIDATE);
      }
    },

    onTouchend: function (event, log) {
      if (log.isValid && ((new Date() - log.time) <= 300)) {
        this.model.set(IS_SELECTED);
      }

      log.isValid = false;
    },

    template: _.template('<li><%= label %></li>'),

    render: function () {
      var attrs = this.model.attributes;
      var data = _.defaults({}, attrs, NOT_CANDIDATE, NOT_SELECTED);

      this.setElement(this.template(data));

      this.$el.attr('id', this.model.cid);

      return this;
    }
  });

  return Item;
}));
