import { assert } from 'chai';
import sinon from 'sinon';
import App, { App as PureApp } from 'App';
import { ModeStates } from 'lib/constants';
import { getStore } from './testStore';
import mockFilter from './data/mockFilter';
import mockView from './data/mockView';
import mockVif from './data/mockVif';
import { shallow } from 'enzyme';

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
      element = shallow(<PureApp mode={ModeStates.EDIT} onNameChanged={() => {}}/>)
    });

    it('renders an edit bar', () => {
      assert.isTrue(element.find('Connect(EditBar)').exists());
    });

    it('does not render a preview bar', () => {
      assert.isFalse(element.find('Connect(PreviewBar)').exists());
    });

    it('does not display site chrome', () => {
      assert.equal(element.find('.hide-site-chrome').length, 0)
    });

    it('renders an InfoPane', () => {
      assert.isTrue(element.find('Connect(InfoPaneComponent)').exists());
    });

    it('renders an editable filter bar', () => {
      assert.isTrue(element.find('Connect(FilterBar)').exists());
      assert.isFalse(element.find('Connect(FilterBar)').prop('isReadOnly'));
    });

    it('renders an AddVisualizationButton', () => {
      const store = getStore({
        mode: ModeStates.EDIT,
        shareModal: {
          isActive: false
        },
        authoringWorkflow: {
          isActive: false
        }
      });

      assert.isTrue(element.find('Connect(EditBar)').dive({
        context: {
          store: store
        }
      }).dive().find('Connect(AddVisualizationButton)').exists());
    });

    it('renders any visualizations', () => {
      assert.isTrue(element.find('Connect(Visualizations)').exists());
    });

    it('renders edit visualization buttons', () => {
      const store = getStore({
        mode: ModeStates.EDIT,
        shareModal: {
          isActive: false
        },
        authoringWorkflow: {
          isActive: false
        }
      });

      assert.isTrue(element.find('Connect(Visualizations)').dive({
        context: {
          store: store
        }
      }).prop('isEditable'));
    });

    it('renders a Table', () => {
      assert.isTrue(element.find('Connect(Table)').exists());
    });

    it('renders an Edit Menu', () => {
      assert.isTrue(element.find('Connect(EditMenu)').exists());
    });

    it('renders an AuthoringWorkflow', () => {
      assert.isTrue(element.find('Connect(AuthoringWorkflowModal)').exists());
    });
  });

  describe('preview mode', () => {
    let element;

    beforeEach(() => {
      element = shallow(<PureApp mode={ModeStates.PREVIEW} onNameChanged={() => {}}/>);
    });

    it('renders a preview bar', () => {
      assert.isTrue(element.find('Connect(PreviewBar)').exists());
    });

    it('does not renders an edit bar', () => {
      assert.isFalse(element.find('Connect(EditBar)').exists());
    });

    it('does not render an Edit Menu', () => {
      assert.isFalse(element.find('Connect(EditMenu)').exists());
    });

    it('renders an InfoPane', () => {
      assert.isTrue(element.find('Connect(InfoPaneComponent)').exists());
    });

    it('renders a presentational filter bar', () => {
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

      assert.isTrue(element.find('Connect(FilterBar)').exists());
      assert.isTrue(element.find('Connect(FilterBar)').dive({
        context: {
          store: store
        }
      }).prop('isReadOnly'));
    });

    it('renders any visualizations', () => {
      assert.isTrue(element.find('Connect(Visualizations)').exists());
    });

    it('does not render edit visualization buttons', () => {
      const store = getStore({
        mode: ModeStates.PREVIEW,
        vifs: [mockVif],
        shareModal: {
          isActive: false
        }
      });

      assert.isFalse(element.find('Connect(Visualizations)').dive({
        context: {
          store: store
        }
      }).prop('isEditable'));
    });

    it('renders a Table', () => {
      assert.isTrue(element.find('Connect(Table)').exists());
    });
  });

  describe('view mode', () => {
    let element;

    beforeEach(() => {
      element = shallow(<PureApp mode={ModeStates.VIEW} onNameChanged={() => {}} />);
    });

    it('does not render a preview bar', () => {
      assert.isFalse(element.find('Connect(PreviewBar)').exists());
    });

    it('does not renders an edit bar', () => {
      assert.isFalse(element.find('Connect(EditBar)').exists());
    });

    it('does not render an Edit Menu', () => {
      assert.isFalse(element.find('Connect(EditMenu)').exists());
    });

    it('renders an InfoPane', () => {
      assert.isTrue(element.find('Connect(InfoPaneComponent)').exists());
    });

    it('renders a presentational filter bar', () => {
      const store = getStore({
        mode: ModeStates.VIEW,
        view: mockView,
        filters: [mockFilter],
        shareModal: {
          isActive: false
        }
      });

      assert.isTrue(element.find('Connect(FilterBar)').exists());
      assert.isTrue(element.find('Connect(FilterBar)').dive({
        context: {
          store: store
        }
      }).prop('isReadOnly'));
    });

    it('renders any visualizations', () => {
      assert.isTrue(element.find('Connect(Visualizations)').exists());
    });

    it('does not render edit visualization buttons', () => {
      const store = getStore({
        mode: ModeStates.VIEW,
        vifs: [mockVif],
        shareModal: {
          isActive: false
        }
      });

      assert.isFalse(element.find('Connect(Visualizations)').dive({
        context: {
          store: store
        }
      }).prop('isEditable'));
    });

    it('renders a Table', () => {
      assert.isTrue(element.find('Connect(Table)').exists());
    });
  });
});
