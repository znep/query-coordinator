import { assert } from 'chai';
import sinon from 'sinon';
import { Visualizations } from 'visualizationCanvas/components/Visualizations';
import mockVif from 'data/mockVif';

describe('Visualizations', () => {
  beforeEach(() => {
    sinon.stub($.fn, 'socrataSvgHistogram');
  });

  afterEach(() => {
    $.fn.socrataSvgHistogram.restore();
  });

  it('renders nothing if this.props.vifs is empty', () => {
    const element = renderComponent(Visualizations, { vifs: [] });
    assert.isNull(element);
  });

  it('renders a visualization for each VIF in this.props.vifs', () => {
    const element = renderComponent(Visualizations, { vifs: [mockVif, mockVif] });
    const visualizations = element.querySelectorAll('.visualization-wrapper');
    assert.equal(visualizations.length, 2);
  });
});
