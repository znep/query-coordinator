import { assert } from 'chai';
import sinon from 'sinon';
import App, { App as PureApp } from 'App';
import { ModeStates } from 'lib/constants';
import { getStore } from './testStore';
import mockFilter from './data/mockFilter';
import mockView from './data/mockView';
import mockVif from './data/mockVif';

describe('App', function() {
  let server;

  beforeEach(() => {
    // This stubs the network requests being made by the visualizations and the Authoring Workflow.
    // We shouldn't be making network requests from any other components, but if we did attempt to
    // do that, this will override those requests.
    server = sinon.fakeServer.create();
    server.respondWith([200, { 'Content-Type': 'application/json' }, '{}']);
  });

  afterEach(() => {
    server.restore();
  });

  it('renders', function() {
    const element = renderComponentWithStore(App);
    assert.ok(element);
  });

  describe('edit mode', () => {
    let element;

    beforeEach(() => {
      const store = getStore({
        mode: ModeStates.EDIT,
        shareModal: {
          isActive: false
        },
        authoringWorkflow: {
          isActive: false
        }
      })

      element = element = renderComponentWithStore(App, {}, store)
    });

    it('renders an edit bar', () => {
      assert.ok(element.querySelector('.edit-bar'));
    });

    it('does not render a preview bar', () => {
      assert.isNull(element.querySelector('.preview-bar'));
      assert.isNull(document.querySelector('.preview-mode'));
    });

    it('does not display site chrome', () => {
      assert.ok(document.querySelector('.hide-site-chrome'));
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
      const store =  getStore({
        mode: ModeStates.EDIT,
        shareModal: {
          isActive: false
        },
        authoringWorkflow: {
          isActive: false
        },
        vifs: [mockVif]
      });
      element = renderComponentWithStore(App, {}, store);
      assert.ok(element.querySelector('.visualization-wrapper'));
    });

    it('renders edit visualization buttons', () => {
      const store = getStore({
        mode: ModeStates.EDIT,
        authoringWorkflow: {
          isActive: false
        },
        shareModal: {
          isActive: false
        },
        vifs: [mockVif, mockVif]
      });
      element = renderComponentWithStore(App, {}, store);
      const editVisualizationButtons = element.querySelectorAll('.edit-visualization-button');
      assert.equal(editVisualizationButtons.length, 2);
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
        shareModal: {
          isActive: false
        },
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
      const store = getStore({
        mode: ModeStates.PREVIEW,
        shareModal: {
          isActive: false
        },
        authoringWorkflow: {
          isActive: false
        },
        view: mockView,
        filters: [mockFilter]
      });

      element = renderComponentWithStore(App, {}, store);
    });

    it('renders a preview bar', () => {
      assert.ok(element.querySelector('.preview-bar'));
      assert.ok(document.querySelector('.preview-mode'));
    });

    it('does not renders an edit bar', () => {
      assert.isNull(element.querySelector('.edit-bar'));
    });

    it('does not render an Edit Menu', () => {
      assert.isNull(element.querySelector('.edit-menu'));
    });

    it('displays site chrome', () => {
      assert.isNull(document.querySelector('.hide-site-chrome'));
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
      const store = getStore({
        mode: ModeStates.PREVIEW,
        vifs: [mockVif],
        shareModal: {
          isActive: false
        }
      });

      element = renderComponentWithStore(App, {}, store);
      assert.ok(element.querySelector('.visualization-wrapper'));
    });

    it('does not render edit visualization buttons', () => {
      const store = getStore({
        mode: ModeStates.PREVIEW,
        vifs: [mockVif],
        shareModal: {
          isActive: false
        }
      });

      element = renderComponentWithStore(App, {}, store);
      assert.equal(element.querySelectorAll('.edit-visualization-button-container').length, 0);
    });

    it('renders a Table', () => {
      assert.ok(element.querySelector('.table-contents'));
    });
  });

  describe('view mode', () => {
    let element;

    beforeEach(() => {
      const store = getStore({
        mode: ModeStates.VIEW,
        view: mockView,
        filters: [mockFilter],
        shareModal: {
          isActive: false
        }
      })

      element = renderComponentWithStore(App, {}, store);
    });

    it('does not render a preview bar', () => {
      assert.isNull(element.querySelector('.preview-bar'));
      assert.isNull(document.querySelector('.preview-mode'));
    });

    it('does not renders an edit bar', () => {
      assert.isNull(element.querySelector('.edit-bar'));
    });

    it('does not render an Edit Menu', () => {
      assert.isNull(element.querySelector('.edit-menu'));
    });

    it('displays site chrome', () => {
      assert.isNull(document.querySelector('.hide-site-chrome'));
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
      const store = getStore({
        mode: ModeStates.VIEW,
        vifs: [mockVif],
        shareModal: {
          isActive: false
        }
      })
      element = renderComponentWithStore(App, {}, store);
      assert.ok(element.querySelector('.visualization-wrapper'));
    });

    it('does not render edit visualization buttons', () => {
      const store = getStore({
        mode: ModeStates.VIEW,
        vifs: [mockVif],
        shareModal: {
          isActive: false
        }
      });

      element = renderComponentWithStore(App, {}, store);
      assert.equal(element.querySelectorAll('.edit-visualization-button-container').length, 0);
    });

    it('renders a Table', () => {
      assert.ok(element.querySelector('.table-contents'));
    });
  });
});
