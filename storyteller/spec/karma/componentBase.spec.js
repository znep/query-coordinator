import _ from 'lodash';
import $ from 'jquery';
import { assert } from 'chai';
import sinon from 'sinon';

import Actions from 'editor/Actions';
import { $transient } from './TransientElement';
import { __RewireAPI__ as componentBaseAPI } from 'editor/componentBase';

describe('componentBase jQuery plugin', function() {

  var $component;
  var dispatchStub;
  var componentData;

  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: null,
      componentIndex: null,
      theme: 'theme'
    }, props);
  };

  function callWithOptions(props) {
    beforeEach(function() {
      componentData = {};
      props.componentData = componentData;
      $component.componentBase(getProps(props));
    });
  }

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
    dispatchStub = sinon.stub();

    componentBaseAPI.__Rewire__('dispatcher', { dispatch: dispatchStub });
  });

  afterEach(function() {
    dispatchStub.reset();
    componentBaseAPI.__ResetDependency__('dispatcher');
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf(
      $component.componentBase(getProps()),
      $,
      'Returned value is not a jQuery collection');
  });

  it('should pass `componentData` and `defaultHeight` to `withLayoutHeightFromComponentData`', function() {
    componentData = {};

    sinon.stub($component, 'withLayoutHeightFromComponentData');

    $component.componentBase(getProps({
      componentData
    }));

    sinon.assert.calledWithExactly($component.withLayoutHeightFromComponentData, componentData, undefined);

    $component.componentBase(getProps({
      componentData,
      defaultHeight: 1337
    }));

    sinon.assert.calledWithExactly($component.withLayoutHeightFromComponentData, componentData, 1337);
  });

  describe('editMode = false', function() {
    callWithOptions({editMode: false});
    it('should not have editing class', function() {
      assert.isFalse($component.hasClass('editing'));
    });
  });

  describe('editMode = true', function() {
    callWithOptions({editMode: true});

    it('should have editing class', function() {
      assert.isTrue($component.hasClass('editing'));
    });

    describe('isUserChoosingMoveDestination = true', function() {
      callWithOptions({editMode: true, isUserChoosingMoveDestination: true});

      it('should add moving class to body', function() {
        assert.isTrue($(document.body).hasClass('moving'));
      });

      it('should have moving class', function() {
        assert.isTrue($component.hasClass('moving'));
      });
    });

    describe('isComponentBeingMoved = true', function() {
      callWithOptions({editMode: true, isComponentBeingMoved: true});

      it('should have moving-source class', function() {
        assert.isTrue($component.hasClass('moving-source'));
      });
    });

    describe('isComponentValidMoveDestination = true', function() {
      callWithOptions({editMode: true, isComponentValidMoveDestination: true});

      it('should have moving-valid-destination class', function() {
        assert.isTrue($component.hasClass('moving-valid-destination'));
      });
    });

    describe('move overlay', function() {
      callWithOptions({editMode: true});

      it('should render a move overlay', function() {
        assert.lengthOf($component.find('.component-edit-move-action-overlay'), 1);
      });

      it('should render move overlay buttons', function() {
        assert.lengthOf($component.find('.component-edit-move-action-overlay button'), 2);
      });

      describe('move button', function() {
        describe('isComponentValidMoveDestination = true', function() {
          callWithOptions({editMode: true, isComponentValidMoveDestination: true});

          it('dispatches an action when clicked', function() {
            $component.find('.btn-move-place').click();

            sinon.assert.calledWith(dispatchStub, {
              action: Actions.MOVE_COMPONENT_DESTINATION_CHOSEN,
              blockId: null,
              componentIndex: Number.NaN
            });
          });
        });

        describe('isComponentValidMoveDestination = false', function() {
          callWithOptions({editMode: true, isComponentValidMoveDestination: false});

          it('doesn\'t dispatch an action when clicked', function() {
            $component.find('.btn-move-place').click();
            sinon.assert.notCalled(dispatchStub);
          });
        });
      });

      describe('cancel button', function() {
        it('dispatches an action when clicked', function() {
          $component.find('.btn-move-cancel').click();

          sinon.assert.calledWith(dispatchStub, {
            action: Actions.MOVE_COMPONENT_CANCEL
          });
        });
      });
    });
  });

  describe('editButtonSupported', function() {
    var renderStub;

    beforeEach(function() {
      renderStub = sinon.stub();
      componentBaseAPI.__Rewire__('ReactDOM', { render: renderStub });
    });

    afterEach(function() {
      renderStub.reset();
      componentBaseAPI.__ResetDependency__('ReactDOM');
    });

    describe('in edit mode', function() {
      describe('editButtonSupported = true', function() {
        callWithOptions({ editMode: true, editButtonSupported: true });
        it('should call into `ReactDOM.render`', function() {
          sinon.assert.calledOnce(renderStub);
        });
      });

      describe('editButtonSupported = false', function() {
        callWithOptions({ editMode: true, editButtonSupported: false });
        it('should not call into `ReactDOM.render`', function() {
          sinon.assert.notCalled(renderStub);
        });
      });
    });

    describe('not in edit mode', function() {
      callWithOptions({ editMode: false });
      callWithOptions({ editMode: false, editButtonSupported: true });
      callWithOptions({ editMode: false, editButtonSupported: false });
      it('should never call into `ReactDOM.render`', function() {
        sinon.assert.notCalled(renderStub);
      });
    });
  });

  describe('resizeSupported', function() {
    var componentResizableStub;

    beforeEach(function() {
      componentResizableStub = sinon.stub($component, 'componentResizable');
    });

    describe('in edit mode', function() {
      describe('resizeSupported not specified', function() {
        callWithOptions({ editMode: true });
        it('should not call into `componentResizable`', function() {
          sinon.assert.notCalled(componentResizableStub);
        });
      });
      describe('resizeSupported = true with and resizeOptions is not set', function() {
        callWithOptions({ editMode: true, resizeSupported: true });
        it('should call into `componentResizable` with an empty options hash', function() {
          sinon.assert.calledOnce(componentResizableStub);
          assert.deepEqual(componentResizableStub.args[0], [{}]); // This is the default resizeOptions.
        });
      });
      describe('resizeSupported = true and resizeOptions set', function() {
        var resizeOptions = { foo: 'bar' };
        callWithOptions({ editMode: true, resizeSupported: true, resizeOptions: resizeOptions });
        it('should call into `componentResizable` with resizeOptions', function() {
          sinon.assert.calledOnce(componentResizableStub);
          sinon.assert.calledWithExactly(componentResizableStub, resizeOptions);
        });
      });
      describe('resizeSupported = false', function() {
        callWithOptions({ editMode: true, resizeSupported: false });
        it('should not call into `componentResizable`', function() {
          sinon.assert.notCalled(componentResizableStub);
        });
      });
    });

    describe('not in edit mode', function() {
      callWithOptions({ editMode: false });
      callWithOptions({ editMode: false, resizeSupported: true });
      callWithOptions({ editMode: false, resizeSupported: false });
      it('should never call into `componentResizable`', function() {
        sinon.assert.notCalled(componentResizableStub);
      });
    });

  });

});
