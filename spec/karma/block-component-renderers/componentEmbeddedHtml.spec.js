describe('componentEmbeddedHtml jQuery plugin', function() {
  'use strict';

  var $component;

  var validComponentData = {
    type: 'embeddedHtml',
    value: {
      url: 'https://imageuploads.com/embedded_fragment.html',
      documentId: '4567',
      layout: {
        height: 300
      }
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentEmbeddedHtml(); });
    assert.throws(function() { $component.componentEmbeddedHtml(1); });
    assert.throws(function() { $component.componentEmbeddedHtml(null); });
    assert.throws(function() { $component.componentEmbeddedHtml(undefined); });
    assert.throws(function() { $component.componentEmbeddedHtml({}); });
    assert.throws(function() { $component.componentEmbeddedHtml([]); });
  });

  describe('given a value that does not contain a url', function() {
    it('should throw when setting the iframe source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.url;

      assert.throws(function() {
        $component.componentEmbeddedHtml(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentEmbeddedHtml(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('iframe data-document-id attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('data-document-id'),
          validComponentData.value.documentId
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.documentId = '9999';

        $component.componentEmbeddedHtml(updatedData);

        assert.equal(
          $component.find('iframe').attr('data-document-id'),
          updatedData.value.documentId
        );
      });

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

        $component.componentEmbeddedHtml(updatedData);

        assert.equal(
          $component.find('iframe').attr('src'),
          updatedData.value.url
        );
      });
    });

    describe('internet explorer hovering', function() {
      beforeEach(function() {
        $component.find('iframe').mouseenter();
      });

      it('should add a .active class to the base element when hovering', function() {
        assert.isTrue($component.hasClass('active'));
      });

      it('removes the .active class from the base element when leaving', function() {
        $component.find('iframe').mouseleave();
        assert.isFalse($component.hasClass('active'));
      });
    });
  });
});

