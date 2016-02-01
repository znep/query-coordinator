describe('componentStoryWidget jQuery plugin', function() {
  'use strict';

  var $component;
  var validComponentData = {
    type: 'story.widget',
    value: {
      domain: 'example.com',
      storyUid: 'test-test',
      url: 'https://example.com/stories/s/test-test'
    }
  };
  var validStoryWidgetDataWithoutImage = {
    title: 'The Unicorn Is The Noblest Beast And I Will Cut You If You Say Otherwise',
    image: null,
    description: 'Unicorns are the most noble of all creatures. They are herbivores. It is considered good luck to see a unicorn. Unicorns are proud. Some unicorns have fire instead of hair, but not all the hair just the long hair. These are the most noble of all the unicorns.',
    theme: 'classic',
    url: 'https://example.com/stories/s/{0}'.format(validComponentData.value.storyUid)
  };
  var validStoryWidgetDataWithImage = _.clone(validStoryWidgetDataWithoutImage);
  validStoryWidgetDataWithImage.image = 'about:blank';

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentStoryWidget(); });
    assert.throws(function() { $component.componentStoryWidget(1); });
    assert.throws(function() { $component.componentStoryWidget(null); });
    assert.throws(function() { $component.componentStoryWidget(undefined); });
    assert.throws(function() { $component.componentStoryWidget({}); });
    assert.throws(function() { $component.componentStoryWidget([]); });
  });

  describe('given a value that does not contain a domain', function() {
    it('should throw when setting the widget source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.domain;

      assert.throws(function() {
        $component.componentStoryWidget(badData);
      });
    });
  });

  describe('given a value that does not contain a storyUid', function() {
    it('should throw when setting the widget source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.storyUid;

      assert.throws(function() {
        $component.componentStoryWidget(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {

    describe('when there is no image specified', function() {
      var server;

      beforeEach(function(done) {
        // Since these tests actually expect to use AJAX, we need to disable the
        // mocked XMLHttpRequest (which happens in StandardMocks) before each,
        // and re-enble it after each.
        window.mockedXMLHttpRequest.restore();

        server = sinon.fakeServer.create();
        server.respondImmediately = true;
        server.respondWith(
          'GET',
          'https://example.com/stories/s/{0}/widget.json'.format(
            validComponentData.value.storyUid
          ),
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(validStoryWidgetDataWithoutImage)
          ]
        );

        $component = $component.componentStoryWidget(validComponentData);
        setTimeout(function() { done(); }, 0);
      });

      afterEach(function() {
        server.restore();

        // See comment above re: temporarily disabling the mocked XMLHttpRequest.
        window.mockedXMLHttpRequest = sinon.useFakeXMLHttpRequest();
      });

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
      });

      it('should render the widget as a link to the story', function() {

        assert.equal(
          $component.find('.story-widget-container').attr('href'),
          validStoryWidgetDataWithoutImage.url
        );
      });

      it('should render the story title', function() {

        assert.equal(
          $component.find('.story-widget-title').text(),
          validStoryWidgetDataWithoutImage.title
        );
      });

      it('should render the default story image', function() {

        assert.equal(
          $component.find('.story-widget-image').attr('style'),
          null
        );
      });

      it('should render the story description', function() {

        assert.equal(
          $component.find('.story-widget-description').text(),
          validStoryWidgetDataWithoutImage.description
        );
      });
    });

    describe('when there is an image specified', function() {
      var server;

      beforeEach(function(done) {
        // Since these tests actually expect to use AJAX, we need to disable the
        // mocked XMLHttpRequest (which happens in StandardMocks) before each,
        // and re-enble it after each.
        window.mockedXMLHttpRequest.restore();

        server = sinon.fakeServer.create();
        server.respondImmediately = true;
        server.respondWith(
          'GET',
          'https://example.com/stories/s/{0}/widget.json'.format(
            validComponentData.value.storyUid
          ),
          [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(validStoryWidgetDataWithImage)
          ]
        );

        $component = $component.componentStoryWidget(validComponentData);
        setTimeout(function() { done(); }, 0);
      });

      afterEach(function() {
        server.restore();

        // See comment above re: temporarily disabling the mocked XMLHttpRequest.
        window.mockedXMLHttpRequest = sinon.useFakeXMLHttpRequest();
      });

      it('should render the specified  image', function() {

        assert.equal(
          $component.find('.story-widget-image').css('background-image'),
          'url(about:blank)'
        );
      });
    });
  });
});
