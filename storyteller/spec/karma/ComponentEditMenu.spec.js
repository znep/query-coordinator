import { Simulate } from 'react-dom/test-utils';
import sinon from 'sinon';
import { assert } from 'chai';

import renderComponent from './renderComponent';

import Actions from 'editor/Actions';
import ComponentEditMenu, {__RewireAPI__ as ComponentEditMenuAPI} from 'editor/ComponentEditMenu';

describe('ComponentEditMenu', () => {
  let element;
  let dispatchStub = sinon.stub();
  let blockIdAndComponentIndex = { blockId: 'blockId', componentIndex: 0 };
  let componentValidSource = false;
  let componentType = 'image';

  const getDispatcher = () => ({ dispatch: dispatchStub });
  const getMoveComponentStoreMock = () => ({ isComponentValidMoveSource: _.constant(componentValidSource) });
  const getStorytellerUtilsMock = () => ({ findBlockIdAndComponentIndex: _.constant(blockIdAndComponentIndex) });
  const getProps = () => ({ componentData: { type: componentType } });
  const getEditButton = () => element.querySelector('.component-edit-controls-edit-btn');
  const getKebabButton = () => element.querySelector('.component-edit-controls-kebab-btn');
  const getPicklist = () => element.querySelector('.picklist');

  const rewire = () => {
    ComponentEditMenuAPI.__Rewire__('dispatcher', getDispatcher());
    ComponentEditMenuAPI.__Rewire__('moveComponentStore', getMoveComponentStoreMock());
    ComponentEditMenuAPI.__Rewire__('StorytellerUtils', getStorytellerUtilsMock());
  };

  const reset = () => {
    dispatchStub.reset();
    ComponentEditMenuAPI.__ResetDependency__('dispatcher');
    ComponentEditMenuAPI.__ResetDependency__('moveComponentStore');
    ComponentEditMenuAPI.__ResetDependency__('StorytellerUtils');
  };

  const render = (props) => {
    element = renderComponent(ComponentEditMenu, props);
  };

  beforeEach(() => {
    rewire();
    render(getProps());
  });

  afterEach(() => {
    reset();
  });

  it('renders', () => {
    assert.ok(element);
  });

  it('renders an edit button', () => {
    assert.ok(getEditButton());
  });

  it('does not render a kebab button', () => {
    assert.notOk(getKebabButton());
  });

  describe('when clicking the edit button', () => {
    it('dispatches an action', () => {
      const { blockId, componentIndex } = blockIdAndComponentIndex;

      Simulate.click(getEditButton());

      sinon.assert.calledWith(dispatchStub, {
        action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
        blockId,
        componentIndex
      });
    });
  });

  // NOTE: The same criteria apply for a component's ability to be reset, so
  // the MoveComponentStore check is doing double duty.
  describe('when component is a valid, swappable source', () => {
    beforeEach(() => {
      componentValidSource = true;

      rewire();
      render(getProps());
    });

    it('renders a kebab button', () => {
      assert.ok(getKebabButton());
    });

    describe('when clicking the kebab button', () => {
      beforeEach(() => {
        Simulate.click(getKebabButton());
      });

      it('renders a picklist', () => {
        assert.ok(getPicklist());
      });

      describe('when clicking the picklist option to move a component', () => {
        it('dispatches an action', () => {
          const { blockId, componentIndex } = blockIdAndComponentIndex;

          Simulate.click(getPicklist().querySelector('.picklist-option[id^="swap"]'));

          sinon.assert.calledWith(dispatchStub, {
            action: Actions.MOVE_COMPONENT_START,
            blockId,
            componentIndex
          });
        });
      });

      describe('when clicking the picklist option to reset a component', () => {
        it('dispatches an action', () => {
          const { blockId, componentIndex } = blockIdAndComponentIndex;

          Simulate.click(getPicklist().querySelector('.picklist-option[id^="reset"]'));

          sinon.assert.calledWith(dispatchStub, {
            action: Actions.RESET_COMPONENT,
            blockId,
            componentIndex
          });
        });
      });
    });
  });
});
