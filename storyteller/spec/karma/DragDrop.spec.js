import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from './TransientElement';
import StandardMocks from './StandardMocks';
import Actions from '../../app/assets/javascripts/editor/Actions';
import DragDrop, {__RewireAPI__ as DragDropAPI} from '../../app/assets/javascripts/editor/DragDrop';
import Dispatcher from '../../app/assets/javascripts/editor/Dispatcher';

describe('DragDrop', function() {

  var dispatchedEvents;
  var story;
  var blocks;
  var ghost;
  var inspirationBlockList;
  var dispatcher;

  beforeEach(function() {
    dispatchedEvents = [];

    dispatcher = new Dispatcher();
    dispatcher.register(function(payload) {
      dispatchedEvents.push(payload);
    });

    DragDropAPI.__Rewire__('dispatcher', dispatcher);

    ghost = $('<div id="block-ghost" class="hidden">');
    story = $('<div class="story" data-story-uid="' + StandardMocks.validStoryUid + '">');

    inspirationBlockList = $('<div class="inspiration-block-list">');
    inspirationBlockList.append($('<div class="inspiration-block"></div>').
      attr('data-block-content', JSON.stringify(StandardMocks.validBlockData1)).
      append('<span>other</span>')
    );

    ghost.css('position', 'absolute');
    story.append('<div class="block" data-block-id="' + StandardMocks.firstBlockId + '"><span>content1</span></div>');
    story.append('<div class="block" data-block-id="' + StandardMocks.secondBlockId + '"><span>content2</span></div>');

    blocks = story.find('.block');

    $transient.append(story);
    $transient.append(ghost);
    $transient.append(inspirationBlockList);
  });

  afterEach(function() {
    DragDropAPI.__ResetDependency__('dispatcher');
  });

  describe('constructor', function() {
    describe('given bad arguments', function() {
      it('should throw', function() {
        /* eslint-disable no-new */
        assert.throws(function() { new DragDrop(); });
        assert.throws(function() { new DragDrop([]); });
        assert.throws(function() { new DragDrop(3, ghost); });
        assert.throws(function() { new DragDrop(blocks, $('nothing')); });
        /* eslint-enable no-new */
      });
    });
  });

  describe('when a drag has been started', function() {
    var dragDrop;
    var fakePointerDownEvent;
    var fakePointerDownPointer;
    var fakeDragStartEvent;
    var fakeDragStartPointer;

    beforeEach(function() {
      dragDrop = new DragDrop(blocks, ghost);
      dragDrop.setup();

      // Manually invoke pointerDown and dragStart - in an actual browser UniDragger does this for us.
      fakePointerDownEvent = {
        preventDefault: _.noop,
        target: $transient.find('[data-block-content]').first(),
        type: 'mousedown'
      };
      fakePointerDownPointer = fakePointerDownEvent;

      fakeDragStartEvent = {
        target: $transient.find('[data-block-content]').first()
      };
      fakeDragStartPointer = fakeDragStartEvent;

      dragDrop.pointerDown(fakePointerDownEvent, fakePointerDownPointer);
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
          target: $transient.find('[data-block-content]').first()
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
        beforeEach(function() {
          // drag over an actual story block
          fakeDragMoveEvent = {
            target: $transient.find('.block').first()
          };
          fakeDragMovePointer = fakeDragMoveEvent;

          // Manually invoke dragMove - usually UniDragger does this for us.
          dragDrop.dragMove(fakeDragMoveEvent, fakeDragMovePointer, fakeMoveVector);
        });

        it('should dispatch STORY_DRAG_OVER', function() {
          assert.equal(dispatchedEvents.length, 1);
          assert.deepEqual(_.find(dispatchedEvents, {'action': 'STORY_DRAG_OVER'}), {
            action: Actions.STORY_DRAG_OVER,
            storyUid: StandardMocks.validStoryUid,
            blockContent: StandardMocks.validBlockData1,
            pointer: fakeDragMovePointer,
            storyElement: $('[data-story-uid="' + StandardMocks.validStoryUid + '"]')[0]
          });
        });
      });
    });
  });
});
