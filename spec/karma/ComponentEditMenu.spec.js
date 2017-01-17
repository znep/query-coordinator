import { Simulate } from 'react-addons-test-utils';

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
    expect(element).to.exist;
  });

  it('renders an edit button', () => {
    expect(getEditButton()).to.exist;
  });

  it('does not render a kebab button', () => {
    expect(getKebabButton()).to.not.exist;
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

  describe('when component is a valid, swappable source', () => {
    beforeEach(() => {
      componentValidSource = true;

      rewire();
      render(getProps());
    });

    it('renders a kebab button', () => {
      expect(getKebabButton()).to.exist;
    });

    describe('when clicking the kebab button', () => {
      beforeEach(() => {
        Simulate.click(getKebabButton());
      });

      it('renders a picklist', () => {
        expect(getPicklist()).to.exist;
      });

      describe('when clicking a picklist option', () => {
        it('dispatches an action', () => {
          const { blockId, componentIndex } = blockIdAndComponentIndex;

          Simulate.click(getPicklist().querySelector('.picklist-option'));

          sinon.assert.calledWith(dispatchStub, {
            action: Actions.MOVE_COMPONENT_START,
            blockId,
            componentIndex
          });
        });
      });
    });
  });
});
