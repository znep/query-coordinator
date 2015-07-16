describe('DragDrop', function() {
  'use strict';

  var story;
  var blocks;
  var ghost;

  var dispatchedEvents;
  beforeEach(function() {
    dispatchedEvents = [];
    window.dispatcher.register(function(payload) {
      dispatchedEvents.push(payload);
    });
  });

  beforeEach(function() {
    ghost = $('<div id="block-ghost" class="hidden">');
    story = $('<div class="story" data-story-uid="' + standardMocks.validStoryUid + '">');

    ghost.css('position', 'absolute');

    story.append('<div class="block" data-block-id="' + standardMocks.firstBlockId + '"><span>content1</span></div>');
    story.append('<div class="block" data-block-id="' + standardMocks.secondBlockId + '"><span>content2</span></div>');

    blocks = story.find('.block');
    testDom.append(story);
    testDom.append(ghost);
  });

  describe('constructor', function() {
    describe('given bad arguments', function() {
      it('should throw', function() {
        assert.throws(function() { new DragDrop(); });
        assert.throws(function() { new DragDrop([]); });
        assert.throws(function() { new DragDrop(3, ghost); });
        assert.throws(function() { new DragDrop(blocks, $('nothing')); });
      });
    });
  });

  describe('when a drag has been started', function() {
    var dragDrop;
    var fakeDragStartEvent;
    var fakeDragStartPointer;
    beforeEach(function() {
      dragDrop = new DragDrop(blocks, ghost);
      dragDrop.setup();

      // Manually invoke dragStart - usually UniDragger does this for us.
      fakeDragStartEvent = {
        target: testDom.find('[data-block-id="' + standardMocks.firstBlockId + '"] span')
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

    describe('and the pointer has moved', function() {
      var fakeDragMoveEvent;
      var fakeDragMovePointer;
      var fakeMoveVector;
      var fakeDragStartPoint;

      beforeEach(function() {
        fakeDragMoveEvent = {
          target: testDom.find('[data-block-id="' + standardMocks.firstBlockId + '"] span')
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

      it('should dispatch STORY_DRAG_ENTER followed by STORY_DRAG_OVER', function() {
        assert.equal(dispatchedEvents.length, 2);

        assert.deepEqual(dispatchedEvents[0], {
          action: Constants.STORY_DRAG_ENTER,
          storyUid: standardMocks.validStoryUid
        })

        assert.deepEqual(dispatchedEvents[1], {
          action: Constants.STORY_DRAG_OVER,
          storyUid: standardMocks.validStoryUid,
          storyElement: story[0],
          draggedBlockId: standardMocks.firstBlockId,
          pointer: fakeDragMovePointer
        })
      });

      describe('to outside the story', function() {
        beforeEach(function() {
          fakeDragMoveEvent = {
            target: testDom
          };
          fakeDragMovePointer = fakeDragMoveEvent;

          // Manually invoke dragMove - usually UniDragger does this for us.
          dragDrop.dragMove(fakeDragMoveEvent, fakeDragMovePointer, fakeMoveVector);
        });

        it('should dispatch STORY_DRAG_LEAVE', function() {
          assert.equal(dispatchedEvents.length, 3); // 2 from earlier describe block, 1 for STORY_DRAG_LEAVE.

          assert.deepEqual(dispatchedEvents[2], {
            action: Constants.STORY_DRAG_LEAVE,
            storyUid: standardMocks.validStoryUid
          });
        });

      });

      describe('to another story', function() {
        var anotherStory;
        var anotherStoryUid = 'batt-mann';

        beforeEach(function() {
          anotherStory = $('<div class="story story2" data-story-uid="' + anotherStoryUid + '">');
          anotherStory.append('<div class="block" data-block-id="otherBlockId"><span>other</span></div>');
          testDom.append(anotherStory);

          fakeDragMoveEvent = {
            target: testDom.find('.story2 .block span')
          };
          fakeDragMovePointer = fakeDragMoveEvent;

          // Manually invoke dragMove - usually UniDragger does this for us.
          dragDrop.dragMove(fakeDragMoveEvent, fakeDragMovePointer, fakeMoveVector);
        });

        it('should dispatch STORY_DRAG_LEAVE, STORY_DRAG_ENTER, and STORY_DRAG_OVER', function() {
          // 2 from earlier describe block, 1 for STORY_DRAG_ENTER, one for STORY_DRAG_LEAVE, and one for STORY_DRAG_OVER
          assert.equal(dispatchedEvents.length, 5);

          assert.deepEqual(dispatchedEvents[2], {
            action: Constants.STORY_DRAG_LEAVE,
            storyUid: standardMocks.validStoryUid
          });
          assert.deepEqual(dispatchedEvents[3], {
            action: Constants.STORY_DRAG_ENTER,
            storyUid: anotherStoryUid
          });
          assert.deepEqual(dispatchedEvents[4], {
            action: Constants.STORY_DRAG_OVER,
            storyUid: anotherStoryUid,
            storyElement: anotherStory[0],
            draggedBlockId: standardMocks.firstBlockId,
            pointer: fakeDragMovePointer
          });
        });

      });

      describe('and the user has dropped', function() {
        var fakeDragEndEvent;
        var fakeDragEndPointer;
        beforeEach(function() {
          // Manually invoke dragEnd - usually UniDragger does this for us.
          fakeDragEndEvent = {
            target: testDom.find('[data-block-id="' + standardMocks.firstBlockId + '"] span')
          };
          fakeDragEndPointer = fakeDragEndEvent;
          dragDrop.dragEnd(fakeDragEndEvent, fakeDragEndPointer);
        });

        it('should invoke STORY_DROP', function() {
          assert.equal(dispatchedEvents.length, 3); // 2 from earlier describe blocks, 1 for STORY_DROP.

          assert.deepEqual(dispatchedEvents[2], {
            action: Constants.STORY_DROP,
            storyUid: standardMocks.validStoryUid,
            blockId: standardMocks.firstBlockId
          });

        });
      });
    });
  });
});
