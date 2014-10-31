var fs = require('fs');
var _ = require('underscore');
var spec = require('./package.json');
var bower = require('./bower.json');
var browserify = require('browserify');

var bower = _.extend(bower, {
  name: spec.name,
  version: spec.version,
  description: spec.description,
  main: spec.main,
  dependencies: spec.dependencies,
  devDependencies: spec.devDependencies,
  keywords: spec.keywords
});

// build our bower package
fs.writeFileSync('bower.json', JSON.stringify(bower, null, 2));

// build minified file
browserify('./example/demo.js')
  .bundle()
  .pipe(fs.createWriteStream('./example/demo.min.js'));
