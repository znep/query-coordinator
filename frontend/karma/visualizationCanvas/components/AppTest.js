import { expect, assert } from 'chai';
import App, { App as PureApp } from 'App';
import { ModeStates } from 'lib/constants';
import { getStore } from '../testStore';
import mockFilter from '../data/mockFilter';
import mockView from '../data/mockView';
import mockVif from '../data/mockVif';

describe('App', function() {
  it('renders', function() {
    const element = renderComponentWithStore(App);
    assert.ok(element);
  });

  describe('edit mode', () => {
    let element;

    beforeEach(() => {
      element = renderComponentWithStore(App, {}, getStore({
        mode: ModeStates.EDIT,
        authoringWorkflow: {
          isActive: false
        }
      }));
    });

    it('renders an edit bar', () => {
      assert.ok(element.querySelector('.edit-bar'));
    });

    it('does not render a preview bar', () => {
      assert.isNull(element.querySelector('.preview-bar'));
    });

    it('does not display site chrome', () => {
      assert.isNull(document.querySelector('#site-chrome-header'));
    });

    it('renders an InfoPane', () => {
      assert.ok(element.querySelector('.info-pane'));
    });

    it('renders an editable filter bar', () => {
      assert.ok(element.querySelector('.filter-bar-container'));
      assert.ok(element.querySelector('.btn-add-filter'));
    });

    it('renders an AddVisualizationButton', () => {
      assert.ok(element.querySelector('.add-visualization-button-container'));
    });

    it('renders any visualizations', () => {
      element = renderComponentWithStore(App, {}, getStore({
          mode: ModeStates.EDIT,
          authoringWorkflow: {
            isActive: false
          },
          vifs: [mockVif]
        }
      ));
      assert.ok(element.querySelector('.visualization-wrapper'));
    });

    it('renders edit visualization buttons', () => {
      element = renderComponentWithStore(App, {}, getStore(
        {
          mode: ModeStates.EDIT,
          authoringWorkflow: {
            isActive: false
          },
          vifs: [mockVif, mockVif]
        }
      ));
      const editVisualizationButtons = element.querySelectorAll('.edit-visualization-button');
      expect(editVisualizationButtons.length).to.equal(2);
    });

    it('renders a Table', () => {
      assert.ok(element.querySelector('.table-contents'));
    });

    it('renders an Edit Menu', () => {
      assert.ok(element.querySelector('.edit-menu'));
    });

    it('renders an AuthoringWorkflow', () => {
      const store = getStore({
        mode: ModeStates.EDIT,
        authoringWorkflow: {
          isActive: true,
          vif: mockVif
        }
      });
      element = renderComponentWithStore(App, {}, store);
      assert.ok(element.querySelector('.authoring-workflow-modal'));
    });
  });

  describe('preview mode', () => {
    let element;

    beforeEach(() => {
      element = renderComponentWithStore(App, {}, getStore({
        mode: ModeStates.PREVIEW,
        view: mockView,
        filters: [mockFilter]
      }));
    });

    it('renders a preview bar', () => {
      assert.ok(element.querySelector('.preview-bar'));
    });

    it('does not renders an edit bar', () => {
      assert.isNull(element.querySelector('.edit-bar'));
    });

    it('does not render an Edit Menu', () => {
      assert.isNull(element.querySelector('.edit-menu'));
    });

    // TODO this test never tested anything.
    xit('displays site chrome', () => {
      assert.ok(document.querySelector('#site-chrome-header'));
    });

    it('renders an InfoPane', () => {
      assert.ok(element.querySelector('.info-pane'));
    });

    it('renders a presentational filter bar', () => {
      assert.ok(element.querySelector('.filter-bar-container'));
      assert.isNull(element.querySelector('.add-filter-button'));
    });

    it('does not render an AddVisualizationButton', () => {
      assert.isNull(element.querySelector('.add-visualization-button-container'));
    });

    it('renders any visualizations', () => {
      element = renderComponentWithStore(App, {}, getStore({ mode: ModeStates.PREVIEW, vifs: [mockVif] }));
      assert.ok(element.querySelector('.visualization-wrapper'));
    });

    it('does not render edit visualization buttons', () => {
      element = renderComponentWithStore(App, {}, getStore({ mode: ModeStates.PREVIEW, vifs: [mockVif] }));
      expect(element.querySelectorAll('.edit-visualization-button-container').length).to.equal(0);
    });

    it('renders a Table', () => {
      assert.ok(element.querySelector('.table-contents'));
    });
  });

  describe('view mode', () => {
    let element;

    beforeEach(() => {
      element = renderComponentWithStore(App, {}, getStore({
        mode: ModeStates.VIEW,
        view: mockView,
        filters: [mockFilter]
      }));
    });

    it('does not render a preview bar', () => {
      assert.isNull(element.querySelector('.preview-bar'));
    });

    it('does not renders an edit bar', () => {
      assert.isNull(element.querySelector('.edit-bar'));
    });

    it('does not render an Edit Menu', () => {
      assert.isNull(element.querySelector('.edit-menu'));
    });

    // TODO this test never tested anything.
    xit('displays site chrome', () => {
      assert.ok(document.querySelector('#site-chrome-header'));
    });

    it('renders an InfoPane', () => {
      assert.ok(element.querySelector('.info-pane'));
    });

    it('renders a presentational filter bar', () => {
      assert.ok(element.querySelector('.filter-bar-container'));
      assert.isNull(element.querySelector('.add-filter-button'));
    });

    it('does not render an AddVisualizationButton', () => {
      assert.isNull(element.querySelector('.add-visualization-button-container'));
    });

    it('renders any visualizations', () => {
      element = renderComponentWithStore(App, {}, getStore({ mode: ModeStates.VIEW, vifs: [mockVif] }));
      assert.ok(element.querySelector('.visualization-wrapper'));
    });

    it('does not render edit visualization buttons', () => {
      element = renderComponentWithStore(App, {}, getStore({ mode: ModeStates.VIEW, vifs: [mockVif] }));
      expect(element.querySelectorAll('.edit-visualization-button-container').length).to.equal(0);
    });

    it('renders a Table', () => {
      assert.ok(element.querySelector('.table-contents'));
    });
  });

  it('throws an error if no mode is specified', () => {
    expect(() => renderComponentWithStore(App, {}, getStore({ mode: 'unicorns' })).to.throw(/invalid mode/));
  });
});

