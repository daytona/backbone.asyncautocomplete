var Backbone = require('backbone');
var _ = require('underscore');
var data = require('./data.json');
Backbone.$ = $; // loading jquery via cdnjs,but could do it via browserify too

var Autocomplete = require('../index');

var Collection = Backbone.Collection.extend({
  // url: 'http://jsonplaceholder.typicode.com/users'
});

var MyItem = Autocomplete.Item.extend({
  foo: 'bar',
  template: _.template('<li <% if (data.isSelected) { %>class="is-selected"<% } %>><%= data.name %></li>')
});

var MyAutocomplete = Autocomplete.define({
  ItemView: MyItem,
  searchAttr: 'name',
  filterAttr: 'name',
  wait: 5000
}).extend({
  initialize: function () {
    'use strict';

    console.log(this.cid);
  }
});

new MyAutocomplete({
  el: Backbone.$('#input'),
  collection: new Collection(data)
});
