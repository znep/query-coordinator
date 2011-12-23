/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * http://ejohn.org/blog/simple-javascript-inheritance/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  var Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    var addProperties = function(obj, newProps, _s) {
      // Copy the properties over onto the new object
      for (var name in newProps) {
        // Check if we're overwriting an existing function
        obj[name] = typeof newProps[name] == "function" &&
          typeof _s[name] == "function" && fnTest.test(newProps[name]) ?
          (function(name, fn){
            return function() {
              var tmp = this._super;

              // Add a new ._super() method that is the same method
              // but on the super-class
              this._super = _s[name];

              // The method only need to be bound temporarily, so we
              // remove it when we're done executing
              var ret = fn.apply(this, arguments);
              this._super = tmp;

              return ret;
            };
          })(name, newProps[name]) :
          newProps[name];
      }
    };

    // Copy the properties over onto the new prototype
    addProperties(prototype, prop, _super);

    // The dummy class constructor
    function Class() {
        this.Class = Class;
      // All construction is actually done in the init method
      if ( !initializing && this._init )
        this._init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    Class.addProperties = addProperties;

    return Class;
  };

  if (typeof blist !== 'undefined')
  { this.Class = Class; }
  else
  { module.exports = Class; }

})();

