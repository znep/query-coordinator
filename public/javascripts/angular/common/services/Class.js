const angular = require('angular');
// Yoinked from: http://ejohn.org/blog/simple-javascript-inheritance
// Socrata wrapped it into a service.

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
var ClassProvider = function() {
  var initializing = false;
  var fnTest = /return/.test(function() { return; }) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  var Class = function() {};

  // Create a new Class that inherits from this class
  function extend(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    function makeMethod(currentName, fn) {
      return function() {
        var tmp = this._super;

        // Add a new ._super() method that is the same method
        // but on the super-class
        this._super = _super[currentName];

        // The method only need to be bound temporarily, so we
        // remove it when we're done executing
        var ret = fn.apply(this, arguments);
        this._super = tmp;

        return ret;
      };
    }

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      var isFunction = _.isFunction(prop[name]) && _.isFunction(_super[name]) && fnTest.test(prop[name]);
      prototype[name] = isFunction ? makeMethod(name, prop[name]) : prop[name];
    }

    // The dummy class constructor
    function NewClass() {
      // All construction is actually done in the init method
      if (!initializing && this.init) {
        this.init.apply(this, arguments);
      }
    }

    // Populate our constructed prototype object
    NewClass.prototype = prototype;

    // Enforce the constructor to be what we expect
    NewClass.prototype.constructor = Class;

    // And make this class extendable
    NewClass.extend = extend;

    return NewClass;
  }

  Class.extend = extend;

  return Class;
};

angular.
  module('socrataCommon.services').
  factory('Class', ClassProvider);
