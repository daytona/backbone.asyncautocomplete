(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('backbone.asyncautocomplete-item', ['underscore', 'backbone'], factory);
  } else if (typeof exports === 'object') {
    // Node.
    module.exports = factory(require('underscore'), require('backbone'));
  }

}(this, function (_, Backbone) {
  'use strict';

  var EVENT_MAP = {
    'mousedown.autocomplete': 'onClick'
  };

  var Item = Backbone.View.extend({
    constructor: function (options) {
      _.bindAll(this, 'onSelect');

      // Merge events
      options.events = (_.result(options, 'events') || {});
      _.defaults(options.events, _.result(this, 'events'), EVENT_MAP);

      this.listenTo(options.model, 'change:isSelected', this.onSelect);

      return Backbone.View.call(this, options);
    },

    onClick: function (event) {
      this.model.set('isSelected', true);
    },

    onSelect: function (model, value, options) {
      this.$el.toggleClass('is-selected', value);
    },

    template: _.template('<li <% if (data.isSelected) { %>class="is-selected"<% } %>><%= data.label %></li>'),

    render: function () {
      return this.setElement(this.template({data: this.model.attributes}));
    }
  });

  return Item;
}));
