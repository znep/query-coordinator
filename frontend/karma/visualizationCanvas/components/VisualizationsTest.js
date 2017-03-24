import { Visualizations } from 'components/Visualizations';
import mockVif from 'data/mockVif';

describe('Visualizations', () => {
  it('renders nothing if this.props.vifs is empty', () => {
    const element = renderComponent(Visualizations, { vifs: [] });
    expect(element).to.be.null;
  });

  it('renders a visualization for each VIF in this.props.vifs', () => {
    const element = renderComponent(Visualizations, { vifs: [mockVif, mockVif] });
    const visualizations = element.querySelectorAll('.visualization-wrapper');
    expect(visualizations.length).to.equal(2);
  });

  describe('displayEditButtons', () => {
    it('renders an edit button for each VIF in this.props.vifs when true', () => {
      const element = renderComponentWithStore(Visualizations, {
        vifs: [mockVif, mockVif],
        displayEditButtons: true
      });
      const editVisualizationButtons = element.querySelectorAll('.edit-visualization-button');
      expect(editVisualizationButtons.length).to.equal(2);
    });

    it('does not render an edit button for each VIF in this.props.vifs when false', () => {
      const element = renderComponent(Visualizations, {
        vifs: [mockVif, mockVif],
        displayEditButtons: false
      });
      const editVisualizationButtons = element.querySelectorAll('.edit-visualization-button');
      expect(editVisualizationButtons.length).to.equal(0);
    });
  });
});
