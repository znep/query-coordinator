import { EditableVisualizations } from 'components/EditableVisualizations';
import mockVif from 'data/mockVif';

describe('Editable Visualizations', () => {
  it('renders nothing if this.props.vifs is empty', () => {
    const component = EditableVisualizations({ vifs: [] });
    expect(component).to.be.null;
  });

  it('renders a visualization for each VIF in this.props.vifs', () => {
    const element = renderPureComponentWithStore(EditableVisualizations({ vifs: [mockVif, mockVif] }));
    const editableVisualizations = element.querySelectorAll('.visualization-wrapper');
    expect(editableVisualizations.length).to.equal(2);
  });

  it('renders an edit button for each VIF in this.props.vifs', () => {
    const element = renderPureComponentWithStore(EditableVisualizations({ vifs: [mockVif, mockVif] }));
    const editVisualizationButtons = element.querySelectorAll('.edit-visualization-button');
    expect(editVisualizationButtons.length).to.equal(2);
  });
});
