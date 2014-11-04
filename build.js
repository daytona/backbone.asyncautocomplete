var fs = require('fs');
var _ = require('underscore');
var spec = require('./package.json');
var bower = require('./bower.json');
var browserify = require('browserify');
var requirejs = require('requirejs');

var PATHS = {
  'backbone.asyncautocomplete': './main',
  'underscore': './node_modules/underscore/underscore',
  'backbone': './node_modules/backbone/backbone',
  'jquery': './node_modules/jquery/dist/jquery'
};

var bower = _.extend(bower, {
  name: spec.name,
  version: spec.version,
  description: spec.description,
  main: spec.main,
  dependencies: spec.dependencies,
  devDependencies: spec.devDependencies,
  keywords: spec.keywords
});

// Build our bower package
fs.writeFileSync('bower.json', JSON.stringify(bower, null, 2));

// Build demo file
browserify('./example/demo.js')
  .bundle()
  .pipe(fs.createWriteStream('./example/demo.min.js'));

// Build Browserify test suite
browserify('./test/test.js')
  .bundle()
  .pipe(fs.createWriteStream('./test/test.commonjs.min.js'));

// Build AMD test suite
requirejs.optimize({
  paths: PATHS,
  optimize: 'none',
  baseUrl: '.',
  name: 'test/test',
  insertRequire: ['test/test'],
  out: './test/test.amd.min.js'
});
