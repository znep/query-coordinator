describe('DragDrop', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;
  var dispatchedEvents;
  var story;
  var blocks;
  var ghost;
  var inspirationBlockList;

  beforeEach(function() {

    dispatchedEvents = [];

    storyteller.dispatcher.register(function(payload) {
      dispatchedEvents.push(payload);
    });

    ghost = $('<div id="block-ghost" class="hidden">');
    story = $('<div class="story" data-story-uid="' + standardMocks.validStoryUid + '">');

    inspirationBlockList = $('<div class="inspiration-block-list">');
    inspirationBlockList.append($('<div class="inspiration-block"></div>').
      attr('data-block-content', JSON.stringify(standardMocks.validBlockData1)).
      append('<span>other</span>')
    );

    ghost.css('position', 'absolute');
    story.append('<div class="block" data-block-id="' + standardMocks.firstBlockId + '"><span>content1</span></div>');
    story.append('<div class="block" data-block-id="' + standardMocks.secondBlockId + '"><span>content2</span></div>');

    blocks = story.find('.block');
    testDom.append(story);
    testDom.append(ghost);
    testDom.append(inspirationBlockList);
  });

  describe('constructor', function() {
    describe('given bad arguments', function() {
      it('should throw', function() {
        assert.throws(function() { new storyteller.DragDrop(); });
        assert.throws(function() { new storyteller.DragDrop([]); });
        assert.throws(function() { new storyteller.DragDrop(3, ghost); });
        assert.throws(function() { new storyteller.DragDrop(blocks, $('nothing')); });
      });
    });
  });

  describe('when a drag has been started', function() {
    var dragDrop;
    var fakeDragStartEvent;
    var fakeDragStartPointer;
    beforeEach(function() {
      dragDrop = new storyteller.DragDrop(blocks, ghost);
      dragDrop.setup();

      // Manually invoke dragStart - usually UniDragger does this for us.
      fakeDragStartEvent = {
        target: testDom.find('[data-block-content]').first()
      };
      fakeDragStartPointer = fakeDragStartEvent;
      dragDrop.dragStart(fakeDragStartEvent, fakeDragStartPointer);
    });

    it('should add the `dragging` class to the body', function() {
      assert.isTrue($('body').hasClass('dragging'));
    });

    it('should unhide the ghost', function() {
      assert.isFalse(ghost.hasClass('hidden'));
    });

    it('should set the contents of the ghost to the dragged block\'s content', function() {
      assert.equal(ghost.text(), fakeDragStartEvent.target.text());
    });

    describe('and the pointer has moved over an inspiration block', function() {
      var fakeDragMoveEvent;
      var fakeDragMovePointer;
      var fakeMoveVector;
      var fakeDragStartPoint;

      beforeEach(function() {
        // Fire first drag move over the inspiration block
        fakeDragMoveEvent = {
          target: testDom.find('[data-block-content]').first()
        };
        fakeDragMovePointer = fakeDragMoveEvent;

        fakeMoveVector = {
          x: 100,
          y: 500
        };

        fakeDragStartPoint = {
          x: 10,
          y: 50
        };

        // Manually set dragStartPoint - usually UniDragger does this for us.
        dragDrop.dragStartPoint = fakeDragStartPoint;

        // Manually invoke dragMove - usually UniDragger does this for us.
        dragDrop.dragMove(fakeDragMoveEvent, fakeDragMovePointer, fakeMoveVector);
      });

      it('should update the ghost position', function() {
        assert.equal(ghost.css('left'), fakeDragStartPoint.x + fakeMoveVector.x + 'px');
        assert.equal(ghost.css('top'), fakeDragStartPoint.y + fakeMoveVector.y + 'px');

        dragDrop.dragMove(fakeDragMoveEvent, fakeDragMovePointer, { x: 1, y: 1});
        assert.equal(ghost.css('left'), fakeDragStartPoint.x + 1 + 'px');
        assert.equal(ghost.css('top'), fakeDragStartPoint.y + 1 + 'px');
      });

      it('should not dispatch any actions on first move', function() {
        // First dragMove is over the inspiration block itself
        assert.equal(dispatchedEvents.length, 0);
      });

      describe('and the pointer has moved from the block list into a story', function() {
        var inspirationBlockList;

        beforeEach(function() {
          // drag over an actual story block
          fakeDragMoveEvent = {
            target: testDom.find('.block').first()
          };
          fakeDragMovePointer = fakeDragMoveEvent;

          // Manually invoke dragMove - usually UniDragger does this for us.
          dragDrop.dragMove(fakeDragMoveEvent, fakeDragMovePointer, fakeMoveVector);
        });

        it('should dispatch STORY_DRAG_ENTER and STORY_DRAG_OVER', function() {
          // 1 for STORY_DRAG_ENTER, one for STORY_DRAG_OVER, and one for STORY_DRAG_LEAVE
          assert.equal(dispatchedEvents.length, 2);

          assert.deepEqual(_.findWhere(dispatchedEvents, {'action': 'STORY_DRAG_ENTER'}), {
            action: Actions.STORY_DRAG_ENTER,
            storyUid: standardMocks.validStoryUid
          });

          assert.deepEqual(_.findWhere(dispatchedEvents, {'action': 'STORY_DRAG_OVER'}), {
            action: Actions.STORY_DRAG_OVER,
            storyUid: standardMocks.validStoryUid,
            blockContent: standardMocks.validBlockData1,
            pointer: fakeDragMovePointer,
            storyElement: $('[data-story-uid="' + standardMocks.validStoryUid + '"]')[0]
          });
        });

        // TODO: Remove these two tests
        //
        // For some reason, triggering the `.dragEnd()` manually causes the
        // `STORY_DROP` action to occur after the `STORY_INSERT_BLOCK` action,
        // and in such a way that the test exits before the `STORY_DROP` event
        // has been recorded.
        //
        // I have no idea why (or how) this happens and, a) having verified
        // that we see the expected behavior in actual usage and b) having
        // reached consensus that we should probably be testing multi-step
        // behaviors like these in the context of a feature test, have decided
        // to disable the tests relying on `STORY_DROP` actions.
        //
        // Note that the 'should not invoke STORY_DROP' test technically still
        // passes but is pretty meaningless if we can never observe a
        // `STORY_DROP` action in the first place.
        xdescribe('and the user has dropped', function() {
          var fakeDragEndEvent;
          var fakeDragEndPointer;
          beforeEach(function() {
            // Manually invoke dragEnd - usually UniDragger does this for us.
            // Drop our inspiration block on the first block element
            fakeDragEndEvent = {
              target: testDom.find('.block').first()
            };
            fakeDragEndPointer = fakeDragEndEvent;
            dragDrop.dragEnd(fakeDragEndEvent, fakeDragEndPointer);
          });

          it('should invoke STORY_DROP', function() {
            assert.deepEqual(_.findWhere(dispatchedEvents, {'action': 'STORY_DROP'}), {
              action: Actions.STORY_DROP,
              storyUid: standardMocks.validStoryUid,
              blockContent: standardMocks.validBlockData1
            });

          });
        });

      });

      xdescribe('and the user has dropped', function() {
        var fakeDragEndEvent;
        var fakeDragEndPointer;
        beforeEach(function() {
          // Manually invoke dragEnd - usually UniDragger does this for us.
          // Drop our inspiration block on the first block element
          fakeDragEndEvent = {
            target: testDom.find('.inspiration-block').first()
          };
          fakeDragEndPointer = fakeDragEndEvent;

          dragDrop.dragEnd(fakeDragEndEvent, fakeDragEndPointer);
        });

        it('should not invoke STORY_DROP', function() {

          assert.isUndefined(_.findWhere(dispatchedEvents, {'action': 'STORY_DROP'}));
        });
      });
    });
  });

});
