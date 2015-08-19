describe('storytellerComponentMediaEmbedWizard jQuery plugin', function() {
  'use strict';

  var $component;
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
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.storytellerComponentMediaEmbedWizard(); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedWizard(1); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedWizard(null); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedWizard(undefined); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedWizard({}); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedWizard([]); });
  });

  describe('given a value that is not supported', function () {
    it('should throw when instantiated', function () {
      var badData = _.cloneDeep(validComponentData);
      badData.value.value.provider = 'warlock';
      assert.throws(function() {
        $component.storytellerComponentMediaEmbedWizard(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    beforeEach(function() {
      $component = $component.storytellerComponentMediaEmbedWizard(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should render a wizard', function() {
      assert.isTrue(
        $component.is('.wizard')
      );
    });

    it('should render a button with the correct data-embed-action attribute', function() {
      assert.lengthOf(
        $component.find(
          '[data-embed-action="{0}"]'.format(Constants.EMBED_WIZARD_CHOOSE_PROVIDER)
        ),
        1
      );
    });
  });
});
