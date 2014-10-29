(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('autocomplete-item-view', ['underscore', 'backbone'], factory);
  } else if (typeof exports === 'object') {
    // Node.
    module.exports = factory(require('underscore'), require('backbone'));
  }

}(this, function (_, Backbone) {
  'use strict';

  var Item = Backbone.View.extend({
    template: _.template('<li <% if (data.isSelected) { %>class="is-selected"<% } %>><%= data.label %></li>'),

    render: function () {
      return this.setElement(this.template({data: this.model.attributes}));
    }
  });

  return Item;
}));
