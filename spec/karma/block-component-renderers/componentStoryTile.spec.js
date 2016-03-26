import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import '../../../app/assets/javascripts/editor/block-component-renderers/componentStoryTile';

describe('componentStoryTile jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'story.tile',
    value: {
      domain: 'example.com',
      storyUid: 'test-test',
      url: 'https://example.com/stories/s/test-test'
    }
  };
  var validStoryTileDataWithoutImage = {
    title: 'The Unicorn Is The Noblest Beast And I Will Cut You If You Say Otherwise',
    image: null,
    description: 'Unicorns are the most noble of all creatures. They are herbivores. It is considered good luck to see a unicorn. Unicorns are proud. Some unicorns have fire instead of hair, but not all the hair just the long hair. These are the most noble of all the unicorns.',
    theme: 'classic',
    url: StorytellerUtils.format(
      'https://example.com/stories/s/{0}', validComponentData.value.storyUid
    )
  };
  var validStoryTileDataWithImage = _.clone(validStoryTileDataWithoutImage);
  validStoryTileDataWithImage.image = 'about:blank';

  function stubTileJsonApiWith(blob, statusCode) {
    var server;
    statusCode = statusCode || 200;

    beforeEach(function(done) {
      server = mockTileServerResponse(blob, statusCode);

      // Need to use a setTimeout to escape the stack and resolve the promise.
      setTimeout(function() { done(); }, 0);
    });

    afterEach(function() {
      server.restore();
      statusCode = 200;
    });
  }

  function mockTileServerResponse(blob, statusCode) {
    var server = sinon.fakeServer.create();
    server.respondImmediately = true;
    server.respondWith(
      'GET',
      StorytellerUtils.format(
        'https://example.com/stories/s/{0}/tile.json',
        validComponentData.value.storyUid
      ),
      [
        statusCode,
        { 'Content-Type': 'application/json' },
        JSON.stringify(blob)
      ]
    );

    $component = $component.componentStoryTile(validComponentData);
    return server;
  }

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentStoryTile(); });
    assert.throws(function() { $component.componentStoryTile(1); });
    assert.throws(function() { $component.componentStoryTile(null); });
    assert.throws(function() { $component.componentStoryTile(undefined); });
    assert.throws(function() { $component.componentStoryTile({}); });
    assert.throws(function() { $component.componentStoryTile([]); });
  });

  describe('given a value that does not contain a domain', function() {
    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.domain;

      assert.throws(function() {
        $component.componentStoryTile(badData);
      });
    });
  });

  describe('given a value that does not contain a storyUid', function() {
    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.storyUid;

      assert.throws(function() {
        $component.componentStoryTile(badData);
      });
    });
  });

  describe('when the story tile 404s', function() {
    stubTileJsonApiWith(validStoryTileDataWithoutImage, 404);

    it('should render an error message, then clear when adding a valid tile', function(done) {
      assert.isTrue($component.hasClass('error'));

      var dataWithNewUrl = _.cloneDeep(validStoryTileDataWithoutImage);
      dataWithNewUrl.url = 'https://example.com/stories/s/test-what';
      var storyUid = validComponentData.value.storyUid;
      validComponentData.value.storyUid = 'test-what'

      var server = mockTileServerResponse(validStoryTileDataWithoutImage, 200);
      validComponentData.value.storyUid = storyUid;

      setTimeout(function() {
        server.restore();
        assert.isFalse($component.hasClass('error'));
        done();
      }, 1000);
    });
  })

  describe('given a valid component type and value', function() {

    describe('when there is no image specified', function() {
      stubTileJsonApiWith(validStoryTileDataWithoutImage);

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
      });

      it('should render the tile as a link to the story', function() {

        assert.equal(
          $component.find('.story-tile-container').attr('href'),
          validStoryTileDataWithoutImage.url
        );
      });

      it('should render the story title container', function() {
        assert.lengthOf(
          $component.find('.story-tile-title-container'), 1
        );
      });

      it('should render the story title', function() {

        assert.equal(
          $component.find('.story-tile-title').text(),
          validStoryTileDataWithoutImage.title
        );
      });

      it('should render the default story image', function() {

        assert.equal(
          $component.find('.story-tile-image').attr('style'),
          null
        );
      });

      it('should render the story description', function() {

        assert.equal(
          $component.find('.story-tile-description').text(),
          validStoryTileDataWithoutImage.description
        );
      });
    });

    describe('when there is an image specified', function() {
      stubTileJsonApiWith(validStoryTileDataWithImage);

      it('should render the specified  image', function() {

        assert.equal(
          $component.find('.story-tile-image').css('background-image'),
          'url(about:blank)'
        );
      });
    });
  });
});
