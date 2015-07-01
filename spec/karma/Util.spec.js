describe('Util', function() {
  var object = {
    propA: null,
    propB: 5,
    propC: 'asd'
  };

  describe('assertHasProperty', function() {
    describe('given an object with the desired property', function() {
      it('does not throw', function() {
        window.Util.assertHasProperty(object, 'propA');
      });
    });
    describe('given an object without the desired property', function() {
      it('throws', function() {
        assert.throws(function() {
          window.Util.assertHasProperty(object, 'oops');
        });
      });
    });
  });
  describe('assertHasProperties', function() {
    describe('given an object with all the desired properties', function() {
      it('does not throw', function() {
        window.Util.assertHasProperties(object, 'propA', 'propB');
      });
    });
    describe('given an object without the desired property', function() {
      it('throws', function() {
        assert.throws(function() {
          window.Util.assertHasProperties(object, 'propA', 'propOops');
        });
      });
    });
  });
});
