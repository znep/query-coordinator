describe('StoryRenderer', function() {

  var storyUid = 'rend-erer';
  var imageBlockId = '1000';
  var textBlockId = '1001';
  var options;

  function createSampleStories() {

    var userStoryData = generateStoryData({
      uid: storyUid,
      blocks: [
        generateBlockData({
          id: imageBlockId,
          components: [
            { type: 'image', value: 'fakeImageFile.png' }
          ]
        }),
        generateBlockData({
          id: textBlockId,
          components: [
            { type: 'text', value: 'some-text' }
          ]
        })
      ]
    });

    window.dispatcher = new Dispatcher();
    window.storyStore = new StoryStore();
    window.blockStore = new BlockStore();
    window.dragDropStore = new DragDropStore();

    dispatcher.dispatch({ action: Constants.STORY_CREATE, data: userStoryData });
  }

  function clearFixtures() {
    delete window.storyStore;
  }

  beforeEach(function() {

    createSampleStories();

    $('body').append(
      $('<div>', { class: 'story-container' })
    );

    options = {
      storyUid: storyUid,
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

      describe('with a storyUid property that is not a string', function() {

        it('raises an exception', function() {

          options.storyUid = {};

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

      describe('with with editable set to true but no richTextEditorManager', function() {

        it('raises an exception', function() {

          options.editable = true;
          options.richTextEditorManager = {};

          assert.throws(function() {
            var renderer = new StoryRenderer(options);
          });
        });
      });

      describe('with a custom onRenderError function', function() {

        describe('and an error is thrown', function() {

          it('calls the custom onRenderError function', function(done) {

            options.storyUid = {};
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

            assert.equal($('.block').length, 2);
          });

          it('does not render deleted blocks', function() {

            var renderer = new StoryRenderer(options);

            assert.equal($('.block').length, 2);

            dispatcher.dispatch({ action: Constants.STORY_DELETE_BLOCK, storyUid: storyUid, blockId: imageBlockId });

            assert.equal($('.block').length, 1);
          });
        });

        describe('with a story that has blocks including an image component', function() {

          it('renders blocks', function() {

            var storyWithImage = generateStoryData({
              uid: 'with-imge',
              blocks: [
                generateBlockData({
                  components: [
                    { type: 'image', value: 'image' }
                  ]
                })
              ]
            });

            dispatcher.dispatch({ action: Constants.STORY_CREATE, data: storyWithImage });

            options.storyUid = 'with-imge';
            var renderer = new StoryRenderer(options);

            assert.equal($('.block').length, 1);
          });
        });

        describe('with a story that has blocks including a visualization component', function() {

          it('renders blocks', function() {

            var storyWithVisualization = generateStoryData({
              uid: 'with-visu',
              blocks: [
                generateBlockData({
                  components: [
                    { type: 'visualization', value: 'visualization' }
                  ]
                })
              ]
            });

            dispatcher.dispatch({ action: Constants.STORY_CREATE, data: storyWithVisualization });

            options.storyUid = 'with-visu';
            var renderer = new StoryRenderer(options);

            assert.equal($('.block').length, 1);
          });
        });
      });

      describe('that is editable', function() {

        var validAssetFinder;
        var validToolbar;
        var validFormats;

        beforeEach(function() {

          $('body').append([
            $('<div>', { class: 'insertion-hint hidden' }),
            $('<div>', { id: 'rich-text-editor-toolbar' })
          ]);

          AssetFinderMocker.mock();
          validAssetFinder = new AssetFinder();
          validToolbar = Object.create(RichTextEditorToolbar.prototype);
          validFormats = [];
          SquireMocker.mock();
          options.editable = true;
          options.richTextEditorManager = new RichTextEditorManager(
            validAssetFinder,
            validToolbar,
            validFormats
          );
        });

        afterEach(function() {

          $('.insertion-hint').remove();
          $('#rich-text-editor-toolbar').remove();
          SquireMocker.unmock();
          AssetFinderMocker.unmock();
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

  describe('drag-and-drop insertion hint', function() {

    var renderer;
    var validAssetFinder;
    var validToolbar;
    var validFormats;

    beforeEach(function() {

      $('body').append([
        $('<div>', { class: 'insertion-hint hidden' }),
        $('<div>', { id: 'rich-text-editor-toolbar' })
      ]);

      AssetFinderMocker.mock();
      validAssetFinder = new AssetFinder();
      validToolbar = Object.create(RichTextEditorToolbar.prototype);
      validFormats = [];
      SquireMocker.mock();
      options.editable = true;
      options.insertionHintElement = $('.insertion-hint');
      options.richTextEditorManager = new RichTextEditorManager(
        validAssetFinder,
        validToolbar,
        validFormats
      );

      renderer = new StoryRenderer(options);
    });

    afterEach(function() {

      $('.insertion-hint').remove();
      $('#rich-text-editor-toolbar').remove();
      SquireMocker.unmock();
      AssetFinderMocker.unmock();
    });

    function hintAtStoryAndBlock(storyUid, blockId) {
      // Cause DragDropStore to indicate we're dragging over
      // the given story and block.
      window.dispatcher.dispatch({
        action: Constants.STORY_DRAG_OVER,
        storyUid: storyUid,
        blockId: blockId,
        pointer: {},
        storyElement: {},
        draggedBlockId: 'draggedBlockId'
      });
    };

    function noHint() {
      // Cause DragDropStore to indicate we're dragging over
      // nothing at all.
      window.dispatcher.dispatch({
        action: Constants.STORY_DRAG_LEAVE,
        storyUid: storyUid
      });
    };

    describe('with a drag hint not on this story', function() {
      beforeEach(function() {
        hintAtStoryAndBlock('notm-ystr', 0);
      });

      it('should be hidden', function() {
        assert.isTrue($('.insertion-hint').hasClass('hidden'), 'insertion hint is not shown');
      });
    });

    describe('with a drag hint on this story', function() {
      beforeEach(function() {
        hintAtStoryAndBlock(storyUid, textBlockId);
      });

      it('is shown', function() {
        assert.isFalse($('.insertion-hint').hasClass('hidden'), 'insertion hint is shown');
      });

      describe('that was removed by clearing all hints', function() {
        beforeEach(function() {
          noHint();
        });

        it('is not shown', function() {
          assert.isTrue($('.insertion-hint').hasClass('hidden'), 'insertion hint is not shown');
        });

      });

      describe('that was removed by changing to another story', function() {
        beforeEach(function() {
          hintAtStoryAndBlock('notm-ystr', 0);
        });

        it('is not shown', function() {
          assert.isTrue($('.insertion-hint').hasClass('hidden'), 'insertion hint is not shown');
        });

      });
    });
  });
});
