# Backbone.AsyncAutocomplete

A fairly straight forward autocomplete based on Backbone. Sure, this might be the millionths autocomplete out there but it does have some features that puts it apart from your run-of-mill-jQuery plugin. Primarily it exposes both the autocomplete list itself for you to extend upon, add methods and foremost define your very own template method. It also exposes the autocomplete item view for you to extend on (and ofc. also apply a custom template method). By exposing these two views you have complete control over what goes on in the DOM and also gives you full power to manipulate and listen to it's internal events and state changes. Also, as the name implies, it's built with asynchronous autocomplete in mind, *but in no way required*.

## Getting started

To create your very own view class with options and a custom view for the list items you define it using the class's custom class property `define`. The default item view is also exposed as a class property of AsyncAutocomplete.

The view takes an input element as it's `el`, or pretty much anything that answers to jQuery's `val` method.

### Define

The view comes with the custom class property `define`. `define` is a method that takes a special hash of options and returns a class with those options scoped within itself. As so, these options will not be exposed in any way to the outside scope.

```javascript
var AsyncAutocomplete = require('backbone.asyncautocomplete');

var MyAutocomplete = AsyncAutocomplete.define({
  wait: 400,
  filterAttr: 'label',
  searchAttr: 'search'
}).extend({
  template: _.template('<ul class="MyAutocomplete" />')
});

new MyAutocomplete({
  el: $('input#someNode'),
  collection: someCollection
});
```

### The Item view

Exposed on the view is another class property called Item. This view is there for you to extend upon, assign your very own template method and then use when defining your autocomplete view, as so:

```javascript
var AsyncAutocomplete = require('backbone.asyncautocomplete');

var MyItem = AsyncAutocomplete.Item.extend({
  template: _.template('<li class="MyAutocompleteItem"><%= name %></li>')
});

var MyAutocomplete = AsyncAutocomplete.define({
  Item: MyItem
});

new MyAutocomplete({
  el: $('input#someNode'),
  collection: someCollection
});
```

### Options

The `define` method takes a hash of special options that are used by the view itself.

- `Item` The view class to be used for individual autocomplete list items.
  - *Default: `AsyncAutocomplete.Item`*
- `wait` How long to wait after user input before performing a fetch.
  - *Default: `250`*
- `filterAttr` The model attribute which to use for the filtering the collection. For special filtering needs where just one attribute is not enough, see [`search`](#search-method).
  - *Default: `label`*
- `searchAttr` When calling fetch on the collection, this will be the query parameter holding the search term like so: `{data: {'SEARCH_ATTR': 'Daytona'}}`. For more advanced needs, configure your collection's fetch method.
  - *Default: `search`*
- `threshold` The minimum number of characters required before performing a fetch call.
  - *Default: `2`*
- `limit` The maximum number of items allowed to be rendered. Useful when dealing with large data sets.
  - *Default: `false`*

### Async requirements

If the view's collection has a `url` property a `fetch` call will be made whenever the [`threshold`](#options) has been met and after the defined [`wait`](#options) time has elapsed since the last user input.

### Search method

The AsyncAutocomplete view has a `search` method which by default filters the models by their [`filterAttr`](#options) in order to find matches. The method is a `_.filter` call wrapped with the the input's value. The default `search` method looks like this:

```javascripts
function (value, model, index, list) {
  var term = model.get(config.filterAttr).toLowerCase();

  if (term.indexOf(value.toLowerCase().trim()) !== -1) {
    return true;
  } else {
    return false;
  }
}
```

## Handling states

This script makes an effort to not assume anything about how you might set states or name your CSS classes. Using the item attributes `isSelected` and `isCandidate` in the template will get you part of the way but you will also have to append classes and whatnot to the items as these attributes change. Have a look at the [example](example/demo.js) to see how it can be done.

### `isSelected`
Only one model at a time may be "selected". A model becomes selected whenever the user clicks on it or navigates to it (using their arrow keys) and then hit the `enter` key.

### `isCandidate`
A candidate item is pretty much the same as hovering an item. Whenever an item is navigated to using the arrow keys, it becomes a "candidate". There can be only one candidate in a collection.
