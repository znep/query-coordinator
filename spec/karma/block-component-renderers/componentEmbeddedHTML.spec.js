describe('componentEmbeddedHTML jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  var validComponentData = {
    type: 'embeddedHTML',
    value: {
      url: 'https://imageuploads.com/embedded_fragment.html'
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentEmbeddedHTML(); });
    assert.throws(function() { $component.componentEmbeddedHTML(1); });
    assert.throws(function() { $component.componentEmbeddedHTML(null); });
    assert.throws(function() { $component.componentEmbeddedHTML(undefined); });
    assert.throws(function() { $component.componentEmbeddedHTML({}); });
    assert.throws(function() { $component.componentEmbeddedHTML([]); });
  });

  describe('given a value that does not contain a url', function () {
    it('should throw when setting the iframe source', function () {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.url;

      assert.throws(function() {
        $component.componentEmbeddedHTML(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentEmbeddedHTML(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('iframe src attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('src'),
          validComponentData.value.url
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.url = 'https://updated.imageuploads.com/embedded_fragment.html';

        $component.componentEmbeddedHTML(updatedData);

        assert.equal(
          $component.find('iframe').attr('src'),
          'https://updated.imageuploads.com/embedded_fragment.html'
        );
      });
    });

  });
});

