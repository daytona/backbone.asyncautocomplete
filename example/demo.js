var Backbone = require('backbone');
var _ = require('underscore');
var data = require('./data.json');
Backbone.$ = require('jquery');

var Autocomplete = require('../main');

(function () {
  'use strict';

  var AsyncCollection = Backbone.Collection.extend({
    url: 'http://jsonplaceholder.typicode.com/users'
  });

  var MyItem = Autocomplete.Item.extend({
    initialize: function () {
      _.bindAll(this, 'onSelect', 'whenCandidate');

      this.listenTo(this.model, {
        'change:isSelected': this.onSelect,
        'change:isCandidate': this.whenCandidate
      });
    },

    onSelect: function (model, value, options) {
      this.$el.toggleClass('is-selected', value);
    },

    whenCandidate: function (model, value, options) {
      this.$el.toggleClass('is-candidate', value);
    },

    template: _.template('<li class="Autocomplete-item<% if (isSelected) { %> is-selected<% } if (isCandidate) { %> is-candidate<% } %>"><%= name %> <em>(<%= username %>)</em></li>')
  });

  var Names = Autocomplete.define({
    Item: MyItem,
    filterAttr: 'name',
  }).extend({
    template: _.template('<ul class="Autocomplete" />')
  });

  var Usernames = Autocomplete.define({
    Item: MyItem,
    searchAttr: 'username',
    filterAttr: 'username',
    wait: 400
  }).extend({
    template: _.template('<ul class="Autocomplete" />')
  });

  new Names({
    el: Backbone.$('#input_static'),
    collection: new Backbone.Collection(data)
  });

  new Usernames({
    el: Backbone.$('#input_async'),
    collection: new AsyncCollection()
  });
}());
