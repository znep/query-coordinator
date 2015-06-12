describe.only('StoryRenderer class', function() {

  describe('constructor', function() {

    describe('when passed a configuration object', function() {

      var options;

      beforeEach(function() {

        $('body').append(
          $('<div>', { class: 'story-container' })
        );

        options = {
          story: new Story(generateStoryData()),
          storyContainerElement: $('.story-container'),
          scaleFactor: 1,
          editable: false,
          insertionHint: false,
          textEditorManager: false,
          onRenderError: function() {}
        };
      });

      describe('with an onRenderError property that is not a function', function() {

        it('raises an exception', function() {

          options.onRenderError = null;

          assert.throws(function() {
            var renderer = new StoryRenderer(options);
          });
        });
      });

      describe('with no onRenderError property', function() {

        it('creates a new StoryRenderer', function() {

          delete options['onRenderError'];

          var renderer = new StoryRenderer(options);
          assert.instanceOf(renderer, StoryRenderer, 'renderer is instance of StoryRenderer');
        });
      });

      describe('with a story property that is not an instance of Story', function() {

        it('raises an exception', function() {

          options.story = {};

          assert.throws(function() {
            var renderer = new StoryRenderer(options);
          });
        });
      });

      describe('with a storyContainerElement property that is not a jQuery object', function() {

        it('raises an exception', function() {

          options.storyContainerElement = {};

          assert.throws(function() {
            var renderer = new StoryRenderer(options);
          });
        });
      });

      describe('with with editable set to true but no textEditorManager', function() {

        it('raises an exception', function() {

          options.editable = true;
          options.textEditorManager = {};

          assert.throws(function() {
            var renderer = new StoryRenderer(options);
          });
        });
      });

      describe('with a custom onRenderError function', function() {

        describe('and an error is thrown', function() {

          it('calls the custom onRenderError function', function(done) {

            options.story = {};
            options.onRenderError = function() {
              assert.isTrue(true);
              done();
            }

            assert.throws(function() {
              var renderer = new StoryRenderer(options);
            });
          });
        });
      });
    });
  });

  describe('.render()', function()  {

  });
});
