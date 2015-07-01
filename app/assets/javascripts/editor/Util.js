;(function() {
  window.Util = {
    assertHasProperty: function(object, name) {
      if (!object.hasOwnProperty(name)) {
        throw new Error('`' + name + '`' + 'property must be present.');
      }
    },
    assertHasProperties: function(object) {
      // Apply all arguments (minus `object`)
      // to assertHasProperty(object, argument).
      _.each(
        _.rest(arguments),
        function(argument) {
          window.Util.assertHasProperty(object, argument);
        }
      );
    }
  };
})();
