import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';

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

  it('passes vifs into children', () => {
    const vifs = [mockVif, _.extend({}, mockVif, { id: 'some-id-thats-different' })];
    const visualizations = shallow(<Visualizations vifs={vifs} />);

    for (let i = 0; i < vifs.length; i++) {
      assert.deepEqual(visualizations.childAt(i).props().vif, vifs[i]);
    }
  });

  it('omits the `origin` section from the vif', () => {
    const vifWithOrigin = _.extend({}, mockVif, { origin: { url: 'origin-url'} });
    const visualizations = shallow(<Visualizations vifs={[vifWithOrigin]} />);
    const vif = visualizations.childAt(0).props().vif;

    assert.isUndefined(vif.origin);
  });
});
