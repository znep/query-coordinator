describe('storytellerComponentMediaEmbedYouTube jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

   // (╯°□°）╯︵ ┻━┻
  var validComponentData = {
    type: 'media',
    value: {
      type: 'embed',
      value: {
        provider: 'youtube',
        id: 'videoId'
      }
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.storytellerComponentMediaEmbedYouTube(); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedYouTube(1); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedYouTube(null); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedYouTube(undefined); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedYouTube({}); });
    assert.throws(function() { $component.storytellerComponentMediaEmbedYouTube([]); });
  });

  describe('given a value that is not supported', function () {
    it('should throw when instantiated', function () {
      var badData = _.cloneDeep(validComponentData);
      badData.value.value.provider = 'vimeo, lol';

      assert.throws(function() {
        $component.storytellerComponentMediaEmbedYouTube(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.storytellerComponentMediaEmbedYouTube(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('iframe src attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('src'),
          'https://www.youtube.com/embed/{0}?rel=0&showinfo=0'.format(validComponentData.value.value.id)
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.value.id = '1234';

        $component.storytellerComponentMediaEmbedYouTube(updatedData);

        assert.equal(
          $component.find('iframe').attr('src'),
          'https://www.youtube.com/embed/{0}?rel=0&showinfo=0'.format('1234')
        );
      });

      //TODO I don't know how to test this.
      it('should not be set unnecessarily');
    });

  });
});
