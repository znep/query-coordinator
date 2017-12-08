import _ from 'lodash';
import { assert } from 'chai';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';

import { ReportingPeriodSize } from 'components/EditModal/ReportingPeriodSize';

describe('ReportingPeriodSize', () => {
  const getProps = (props) => ({
    options: [
      { value: 'year', title: 'Year' },
      { value: 'month', title: 'Month' },
      { value: 'week', title: 'Week' }
    ],
    onOptionSelected: _.noop,
    ...props
  });

  it('renders', () => {
    const element = shallow(<ReportingPeriodSize {...getProps()} />);
    assert.ok(element);
  });

  describe('when collapsible is true', () => {
    it('renders "Show more" link when collapsible is true', () => {
      const props = { collapsible: true };
      const element = mount(<ReportingPeriodSize {...getProps(props)} />);

      const link = element.find('a').first();
      assert.isOk(link.node);
      assert.equal(link.node.textContent, "Show more");
    });

    it('initially does not render the dropdown', () => {
      const props = { collapsible: true };
      const element = mount(<ReportingPeriodSize {...getProps(props)} />);

      const dropdown = element.find('.dropdown-container').first();
      assert.isNotOk(dropdown.node);
    });

    describe('after clicking "Show more"', () => {
      let element;
      let link;
      beforeEach(() => {
        const props = { collapsible: true };
        element = mount(<ReportingPeriodSize {...getProps(props)} />);
        link = element.find('a').first();
        link.simulate('click');
      });

      it('renders dropdown', () => {
        const dropdown = element.find('.dropdown-container').first();
        assert.isOk(dropdown.node);
      });

      it('renders "Show less" link', () => {
        link = element.find('a').first();
        assert.isOk(link.node);
        assert.equal(link.node.textContent, "Show less");
      });
    });
  });

  it('does not render "Show more" when collapsible is false', () => {
    const props = { collapsible: false };
    const element = mount(<ReportingPeriodSize {...getProps(props)} />);

    const link = element.find('a').first();
    assert.isNotOk(link.node);
  });

  it('calls onOptionSelected when value is selected', () => {
    const props = getProps({ onOptionSelected: sinon.spy() });
    const element = mount(<ReportingPeriodSize {...props} />);

    const options = element.find('.picklist-option');
    options.last().simulate('click');
    sinon.assert.calledWith(props.onOptionSelected, _.last(props.options));
  });
});
