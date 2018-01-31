import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import { EditModalTab } from 'opMeasure/components/EditModal/EditModalTab';

describe('EditModalTab', () => {
  const getProps = (props) => {
    return {
      icon: 'example',
      id: 'foo',
      isSelected: true,
      title: 'Foo',
      onTabNavigation: _.noop,
      ...props
    };
  };

  it('renders a tab with suitable ARIA attributes and an icon', () => {
    const element = shallow(<EditModalTab {...getProps()} />);

    assert.ok(element.hasClass('current'));
    assert.equal(element.find('.icon-example').length, 1);

    const link = element.find('a');
    assert.equal(link.prop('aria-label'), 'Foo');
    assert.equal(link.prop('aria-selected'), true);
    assert.equal(link.prop('aria-controls'), 'foo-panel');
    assert.equal(link.prop('role'), 'tab');
  });

  it('calls onTabNavigation when the tab link is clicked', () => {
    const spy = sinon.spy();
    const props = getProps({
      onTabNavigation: spy
    });
    const element = shallow(<EditModalTab {...props} />);

    sinon.assert.notCalled(spy);
    const link = element.find('a');

    link.prop('onClick')({ preventDefault: _.noop });

    sinon.assert.calledOnce(spy);
  });

  it('shows a dot if the tab needs attention', () => {
    const element = shallow(<EditModalTab needsAttention {...getProps()} />);
    assert.equal(element.find('.tab-attention').length, 1);
  });

  it('does not show a dot if the tab does not need attention', () => {
    const element = shallow(<EditModalTab {...getProps()} />);
    assert.equal(element.find('.tab-attention').length, 0);
  });
});
