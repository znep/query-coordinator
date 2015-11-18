describe('componentImage jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  var validComponentData = {
    type: 'image',
    value: {
      documentId: '1234',
      url: 'https://imageuploads.com/valid-upload-image.png'
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentImage(); });
    assert.throws(function() { $component.componentImage(1); });
    assert.throws(function() { $component.componentImage(null); });
    assert.throws(function() { $component.componentImage(undefined); });
    assert.throws(function() { $component.componentImage({}); });
    assert.throws(function() { $component.componentImage([]); });
  });

  describe('given a value that does not contain a documentId', function () {
    it('should throw when setting the img source', function () {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.documentId;

      assert.throws(function() {
        $component.componentImage(badData);
      });
    });
  });

  describe('given a value that does not contain a url', function () {
    it('should throw when setting the img source', function () {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.url;

      assert.throws(function() {
        $component.componentImage(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentImage(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('img data-document-id attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('img').attr('data-document-id'),
          validComponentData.value.documentId
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.documentId = '4321';

        $component.componentImage(updatedData);

        assert.equal(
          $component.find('img').attr('data-document-id'),
          updatedData.value.documentId
        );
      });
    });

    describe('img src attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('img').attr('src'),
          validComponentData.value.url
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.url = 'https://imageuploads.com/new-valid-upload-image.png';

        $component.componentImage(updatedData);

        assert.equal(
          $component.find('img').attr('src'),
          updatedData.value.url
        );
      });
    });
  });
});
