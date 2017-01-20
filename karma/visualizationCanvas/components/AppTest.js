import App, { App as PureApp } from 'App';
import { getStore } from '../testStore';
import mockVif from '../data/mockVif';

describe('App', function() {
  it('renders', function() {
    const element = renderComponentWithStore(App);
    expect(element).to.exist;
  });

  describe('edit mode', () => {
    let element;

    beforeEach(() => {
      element = renderComponentWithStore(App, {}, getStore({
        mode: 'edit',
        authoringWorkflow: {
          isActive: false
        }
      }));
    });

    it('renders an edit bar', () => {
      expect(element.querySelector('.edit-bar')).to.exist;
    });

    it('does not render a preview bar', () => {
      expect(element.querySelector('.preview-bar')).to.not.exist;
    });

    it('does not display site chrome', () => {
      expect(document.querySelector('#site-chrome-header')).to.not.be.visible;
    });

    it('renders an InfoPane', () => {
      expect(element.querySelector('.info-pane')).to.exist;
    });

    it('renders an AddVisualizationButton', () => {
      expect(element.querySelector('.add-visualization-button-container')).to.exist;
    });

    it('renders any visualizations', () => {
      element = renderComponentWithStore(App, {}, getStore({
          mode: 'edit',
          authoringWorkflow: {
            isActive: false
          },
          vifs: [mockVif]
        }
      ));
      expect(element.querySelector('.visualization-wrapper')).to.exist;
    });

    it('renders edit visualization buttons', () => {
      element = renderComponentWithStore(App, {}, getStore(
        {
          mode: 'edit',
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
      expect(element.querySelector('.table-contents')).to.exist;
    });

    it('renders an Edit Menu', () => {
      expect(element.querySelector('.edit-menu')).to.exist;
    });

    it('renders an AuthoringWorkflow', () => {
      const store = getStore({
        mode: 'edit',
        authoringWorkflow: {
          isActive: true,
          vif: mockVif
        }
      });
      element = renderComponentWithStore(App, {}, store);
      expect(element.querySelector('.authoring-workflow-modal')).to.exist;
    });
  });

  describe('preview mode', () => {
    let element;

    beforeEach(() => {
      element = renderComponentWithStore(App, {}, getStore({ mode: 'preview' }));
    });

    it('renders a preview bar', () => {
      expect(element.querySelector('.preview-bar')).to.exist;
    });

    it('does not renders an edit bar', () => {
      expect(element.querySelector('.edit-bar')).to.not.exist;
    });

    it('displays site chrome', () => {
      expect(document.querySelector('#site-chrome-header')).to.be.visible;
    });

    it('renders an InfoPane', () => {
      expect(element.querySelector('.info-pane')).to.exist;
    });

    it('does not render an AddVisualizationButton', () => {
      expect(element.querySelector('.add-visualization-button-container')).to.not.exist;
    });

    it('renders any visualizations', () => {
      element = renderComponentWithStore(App, {}, getStore({ mode: 'preview', vifs: [mockVif] }));
      expect(element.querySelector('.visualization-wrapper')).to.exist;
    });

    it('does not render edit visualization buttons', () => {
      element = renderComponentWithStore(App, {}, getStore({ mode: 'preview', vifs: [mockVif] }));
      expect(element.querySelectorAll('.edit-visualization-button-container').length).to.equal(0);
    });

    it('renders a Table', () => {
      expect(element.querySelector('.table-contents')).to.exist;
    });

    it('does not render an Edit Menu', () => {
      expect(element.querySelector('.edit-menu')).to.not.exist;
    });
  });

  it('throws an error if no mode is specified', () => {
    expect(() => renderComponentWithStore(App, {}, getStore({ mode: 'unicorns' })).to.throw(/invalid mode/));
  });
});

