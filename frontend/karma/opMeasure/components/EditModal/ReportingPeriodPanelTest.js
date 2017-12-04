import _ from 'lodash';
import moment from 'moment';
import { assert } from 'chai';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';

import { ReportingPeriodPanel } from 'components/EditModal/ReportingPeriodPanel';

describe('ReportingPeriodPanel', () => {
  const getProps = (props) => ({
    // TODO: default test props
    onChangeStartDate: _.noop,
    ...props
  });

  it('renders', () => {
    const element = shallow(<ReportingPeriodPanel {...getProps()} />);
    assert.ok(element);
  });

  describe('period start date', () => {
    const getInput = (element) => element.find('.date-picker-input').first();

    it('initializes from props', () => {
      const props = { startDate: '2001-02-03' };
      const element = mount(<ReportingPeriodPanel {...getProps(props)} />);

      assert.equal(getInput(element).node.value, '02/03/2001');
    });

    it('initializes to the start of the current year if not set in props', () => {
      const props = {};
      const element = mount(<ReportingPeriodPanel {...getProps(props)} />);

      const year = moment().year();
      assert.equal(getInput(element).node.value, `01/01/${year}`);
    });

    it('calls onChangeStartDate when the date picker value changes', () => {
      const props = { onChangeStartDate: sinon.spy() };
      const element = mount(<ReportingPeriodPanel {...getProps(props)} />);

      const input = getInput(element);
      input.node.value = '02/03/2001';
      input.simulate('change');
      sinon.assert.calledOnce(props.onChangeStartDate);
    });

    it('does not call onChangeStartDate when the current date picker value is re-selected', () => {
      const props = { startDate: '2001-02-03', onChangeStartDate: sinon.spy() };
      const element = mount(<ReportingPeriodPanel {...getProps(props)} />);

      const input = getInput(element);
      input.node.value = '02/03/2001';
      input.simulate('change');
      sinon.assert.notCalled(props.onChangeStartDate);
    });
  });
});
