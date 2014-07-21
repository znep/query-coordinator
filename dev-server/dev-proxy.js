#!/usr/bin/env node

var options = {
  target: 'dataspace-demo.test-socrata.com',
  local: 'localhost:9443',
  port: 9000,
  launchBrowser: false,
  paths: [
    '/view/',
    '/styles/',
    '/javascripts/',
    '/angular_templates/'
  ],
  ssl_key: __dirname+'/ssl/host.key',
  ssl_cert: __dirname+'/ssl/host.crt'
}

var httpProxy = require('http-proxy'),
  fs = require('fs'),
  https = require('https'),
  exec = require('child_process').exec,
  _ = require('underscore');

_.str = require('underscore.string');
_.mixin(_.str.exports());


function showHelp() {
  console.log('usage: dev-proxy [target=<domain>] [port=<port>] [launchBrowser=<bool>]');
  console.log('                 [local=<domain:port>] [ssl_key=<path>] [ssl_cert=<path>]\n');
  console.log('   Any option in the options hash in the beginning of dev-proxy.js can be overriden by adding');
  console.log('   a key=value pair. eval() will be called on the value.\n');
  console.log('   If you change the domain, make sure to logout first to prevent 404 errors.');
  process.exit();
}

process.argv.forEach(function(val) {
  var parts = val.split('=');
  if (parts.length == 2) {
    try {
      var val = eval(parts[1]);
    } catch (e) {
      var val = parts[1];
    }
    options[parts[0]] = val;
  } else {
    if (_.startsWith(val, '-')) {
      showHelp();
    }
  }
});

// Allows untrusted SSL connections such as localhost:9443.
var proxy = httpProxy.createProxyServer({
  secure: false
});

var server = https.createServer({
  key: fs.readFileSync(options.ssl_key),
  cert: fs.readFileSync(options.ssl_cert)
}, function(req, res) {
  if (_.some(options.paths, function(path) {
      return _.startsWith(req.url, path);
    })) {
    var target = 'https://'+options.local;
  } else {
    var target = 'https://'+options.target;
    req.headers.host = options.target;
  }
  console.log(target, req.url);
  proxy.web(req, res, { target: target });
});

proxy.on('proxyRes', function (res) {
  // Modify 3xx responses
  if (res.headers.location) {
    res.headers.location = res.headers.location.
      replace(options.target, 'localhost:'+options.port);
  }
});

proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  console.log('ERR', req.url, err);
  res.end('Something went wrong.', err);
});

console.log('Listening on port:', options.port,
  'and proxying to:', options.target);
server.listen(options.port);

if (options.launchBrowser) {
  // Launch Browser
  exec('open https://localhost:' + options.port);
}
