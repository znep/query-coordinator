describe('StoryRenderer class', function() {

  var options;

  beforeEach(function() {

    $('body').append(
      $('<div>', { class: 'story-container' })
    );

    options = {
      story: new Story(generateStoryData()),
      storyContainerElement: $('.story-container'),
      onRenderError: function() {}
    };
  });

  afterEach(function() {
    $('.story-container').remove();
  });

  describe('constructor', function() {

    describe('when passed a configuration object', function() {

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

      describe('with an insertionHintElement property that is not a jQuery object', function() {

        it('raises an exception', function() {

          options.insertionHintElement = {};

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

    describe('when called on a StoryRenderer instance', function() {

      describe('that is not editable', function() {

        describe('with a story that has blocks', function() {

          it('renders blocks', function() {

            var renderer = new StoryRenderer(options);
            renderer.render();

            assert.isTrue($('.block').length > 0, 'there is at least one block');
          });

          it('does not render deleted blocks', function() {

            var story = new Story(generateStoryData());
            options.story = story;

            var renderer = new StoryRenderer(options);
            renderer.render();

            assert.isTrue($('.block').length > 0, 'there is at least one block');

            story.removeBlockAtIndex(0);
            renderer.render();

            assert.isFalse($('.block').length > 0, 'there are no blocks');
          });
        });

        describe('with a story that has blocks including an image component', function() {

          it('renders blocks', function() {

            options.story = new Story(
              generateStoryData({
                blocks: [
                  generateBlockData({
                    components: [
                      { type: 'image', value: 'image' }
                    ]
                  })
                ]
              })
            );

            var renderer = new StoryRenderer(options);
            renderer.render();

            assert.isTrue($('.block').length > 0, 'there is at least one block');
          });
        });

        describe('with a story that has blocks including a visualization component', function() {

          it('renders blocks', function() {

            options.story = new Story(
              generateStoryData({
                blocks: [
                  generateBlockData({
                    components: [
                      { type: 'visualization', value: 'visualization' }
                    ]
                  })
                ]
              })
            );

            var renderer = new StoryRenderer(options);
            renderer.render();

            assert($('.block').length > 0, 'there is more than one block');
          });
        });
      });

      describe('that is editable', function() {

        beforeEach(function() {

          $('body').append(
            $('<div>', { class: 'insertion-hint hidden' })
          );

          SquireMocker.mock();
          options.editable = true;
          options.textEditorManager = new TextEditorManager();
        });

        afterEach(function() {

          $('.insertion-hint').remove();

          SquireMocker.unmock();
        });

        describe('with no insertion hint element defined', function() {

          describe('with a story that has blocks', function() {

            it('renders blocks but no insertion hint', function() {

              var renderer = new StoryRenderer(options);
              renderer.render();

              assert($('.block').length > 0, 'there is more than one block');
              assert.isTrue($('.insertion-hint').hasClass('hidden'), 'insertion hint is hidden');
            });
          });
        });

        describe('with an insertion hint element defined', function() {

          beforeEach(function() {
            options.insertionHintElement = $('.insertion-hint');
          });

          describe('with a story that has blocks', function() {

            describe('when no insertionHintIndex has been set', function() {

              it('renders blocks but no insertion hint', function() {

                var renderer = new StoryRenderer(options);
                renderer.render();

                assert($('.block').length > 0, 'there is more than one block');
                assert.isTrue($('.insertion-hint').hasClass('hidden'), 'insertion hint is hidden');
              });
            });
          });
        });
      });
    });
  });

  describe('.showInsertionHintAtIndex()', function() {

    beforeEach(function() {

      $('body').append(
        $('<div>', { class: 'insertion-hint hidden' })
      );

      SquireMocker.mock();
      options.editable = true;
      options.insertionHintElement = $('.insertion-hint');
      options.textEditorManager = new TextEditorManager();
    });

    afterEach(function() {

      $('.insertion-hint').remove();

      SquireMocker.unmock();
    });

    it('renders blocks and an insertion hint', function() {

      var renderer = new StoryRenderer(options);

      renderer.showInsertionHintAtIndex(0);
      renderer.render();

      assert($('.block').length > 0, 'there is more than one block');
      assert.isFalse($('.insertion-hint').hasClass('hidden'), 'insertion hint is shown');
    });
  });

  describe('.hideInsertionHint()', function() {

    beforeEach(function() {

      $('body').append(
        $('<div>', { class: 'insertion-hint hidden' })
      );

      SquireMocker.mock();
      options.editable = true;
      options.insertionHintElement = $('.insertion-hint');
      options.textEditorManager = new TextEditorManager();
    });

    afterEach(function() {

      $('.insertion-hint').remove();

      SquireMocker.unmock();
    });

    it('hides the insertion hint after it has been rendered', function() {

      var renderer = new StoryRenderer(options);

      renderer.showInsertionHintAtIndex(0);
      renderer.render();

      assert($('.block').length > 0, 'there is more than one block');
      assert.isFalse($('.insertion-hint').hasClass('hidden'), 'insertion hint is shown');

      renderer.hideInsertionHint();
      renderer.render();

      assert.isTrue($('.insertion-hint').hasClass('hidden'), 'insertion hint is not shown');                
    });
  });
});
