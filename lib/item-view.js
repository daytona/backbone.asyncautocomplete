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

  var NOT_SELECTED = {'isSelected': false};
  var NOT_CANDIDATE = {'isCandidate': false};
  var EVENT_MAP = {
    'mousedown.autocomplete': 'onClick'
  };

  var Item = Backbone.View.extend({
    constructor: function (options) {
      // Merge events
      options.events = (_.result(options, 'events') || {});
      _.defaults(options.events, _.result(this, 'events'), EVENT_MAP);

      return Backbone.View.call(this, options);
    },

    onClick: function (event) {
      this.model.set('isSelected', true);
    },

    template: _.template('<li><%= label %></li>'),

    render: function () {
      var attrs = this.model.attributes;
      var data = _.defaults({}, attrs, NOT_CANDIDATE, NOT_SELECTED);

      return this.setElement(this.template(data));
    }
  });

  return Item;
}));
