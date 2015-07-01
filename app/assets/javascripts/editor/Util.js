;(function() {
  window.Util = {
    assertHasProperty: function(object, name) {
      if (!object.hasOwnProperty(name)) {
        throw new Error('`' + name + '`' + 'property must be present.');
      }
    },
    assertHasProperties: function(object) {
      _.each(_.rest(arguments), _.partial(window.Util.assertHasProperty, object));
    }
  };
})();
