import { Visualizations } from 'components/Visualizations';
import mockVif from 'data/mockVif';
import { getStore } from 'testStore';

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
});
