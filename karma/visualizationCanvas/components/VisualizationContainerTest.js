import { VisualizationContainer } from 'components/VisualizationContainer';
import mockVif from 'data/mockVif';
import { getStore } from 'testStore';

describe('VisualizationContainer', () => {
  const getProps = (props) => {
    return {
      vifs: [],
      isEditingVisualization: false,
      ...props
    };
  };

  it('renders an element', () => {
    const element = renderPureComponentWithStore(VisualizationContainer(getProps()));
    expect(element).to.exist;
  });

  describe('when rendering visualizations', () => {
    it('renders nothing if this.props.vifs is empty', () => {
      const element = renderPureComponentWithStore(VisualizationContainer(getProps()));
      expect(element.querySelector('.socrata-visualization-renderer')).to.not.exist;
    });

    it('renders a visualization for each VIF in this.props.vifs', () => {
      const element = renderPureComponentWithStore(VisualizationContainer(getProps({
        vifs: [mockVif, mockVif]
      })));
      const visualizations = element.querySelectorAll('.socrata-visualization-renderer');

      expect(visualizations.length).to.eq(2);
    });
  });

  describe('add visualization button', () => {
    it('does not render if VIFs are provided', () => {
      const element = renderPureComponentWithStore(VisualizationContainer(getProps({
        vifs: [mockVif]
      })));
      expect(element.querySelector('button')).to.not.exist;
    });

    it('renders if no VIFs are provided', () => {
      const element = renderPureComponentWithStore(VisualizationContainer(getProps()));
      expect(element.querySelector('button')).to.exist;
    });
  });

  describe('authoring workflow modal', () => {
    it('does not render if not editing visualization', () => {
      const element = renderPureComponentWithStore(VisualizationContainer(getProps()));
      expect(element.querySelector('.authoring-workflow-modal')).to.not.exist;
    });

    it('renders if editing visualization', () => {
      const element = renderPureComponentWithStore(
        VisualizationContainer(getProps({
          isEditingVisualization: true
        })),
        getStore({
          authoringWorkflow: {
            position: 1,
            // If the VIF is an empty object, the AuthoringWorkflowModal doesn't render the
            // AuthoringWorkflow, avoiding a bunch of AuthoringWorkflow logs when tests run.
            vif: {}
          }
        })
      );
      expect(element.querySelector('.authoring-workflow-modal')).to.exist;
    });
  });
});
