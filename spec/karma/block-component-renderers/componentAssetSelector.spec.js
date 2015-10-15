describe('componentAssetSelector jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  var validComponentData = {
    type: 'assetSelector'
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentAssetSelector(); });
    assert.throws(function() { $component.componentAssetSelector(1); });
    assert.throws(function() { $component.componentAssetSelector(null); });
    assert.throws(function() { $component.componentAssetSelector(undefined); });
    assert.throws(function() { $component.componentAssetSelector({}); });
    assert.throws(function() { $component.componentAssetSelector([]); });
  });

  describe('given a type that is not supported', function () {
    it('should throw when instantiated', function () {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notAssetSelector';
      assert.throws(function() {
        $component.componentAssetSelector(badData);
      });
    });
  });

  describe('given a valid component type', function() {
    beforeEach(function() {
      $component = $component.componentAssetSelector(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should render a media selector', function() {
      assert.isTrue(
        $component.is('.component-asset-selector')
      );
    });

    it('adds the correct data-action attribute to the component', function() {
      assert.equal(
        $component.attr('data-action'),
        Actions.ASSET_SELECTOR_CHOOSE_PROVIDER,
        "Asset Selector component should have the attribute data-action={0}".format(Actions.ASSET_SELECTOR_CHOOSE_PROVIDER)
      );
    });
  });
});
