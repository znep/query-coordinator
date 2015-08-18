describe('storytellerComponentMediaEmbedWizard jQuery plugin', function() {
  var node;
  var storyteller = window.socrata.storyteller;

   // (╯°□°）╯︵ ┻━┻
  var validComponentData = {
    type: 'media',
    value: {
      type: 'embed',
      value: {
        provider: 'wizard'
      }
    }
  };

  beforeEach(function() {
    node = testDom.append('<div>');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { node.storytellerComponentMediaEmbedWizard(); });
    assert.throws(function() { node.storytellerComponentMediaEmbedWizard(1); });
    assert.throws(function() { node.storytellerComponentMediaEmbedWizard(null); });
    assert.throws(function() { node.storytellerComponentMediaEmbedWizard(undefined); });
    assert.throws(function() { node.storytellerComponentMediaEmbedWizard({}); });
    assert.throws(function() { node.storytellerComponentMediaEmbedWizard([]); });
  });

  describe('given a value that is not supported', function () {
    it('should throw when instantiated', function () {
      var badData = _.cloneDeep(validComponentData);
      badData.value.value.provider = 'warlock';
      assert.throws(function() {
        node.storytellerComponentMediaEmbedWizard(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var component;

    beforeEach(function() {
      component = node.storytellerComponentMediaEmbedWizard(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.isTrue($.fn.isPrototypeOf(component), 'Returned value is not a jQuery collection');
    });

    it('should render a wizard', function() {
      assert.isTrue(
        component.is('.wizard')
      );
    });
  });
});
