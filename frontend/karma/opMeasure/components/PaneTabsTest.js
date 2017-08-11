import { assert } from 'chai';
import sinon from 'sinon';
import { PaneTabs } from 'components/PaneTabs';

describe('PaneTabs', () => {
  const getProps = (props) => {
    return {
      activePane: 'summary',
      onClickTab: _.noop,
      ...props
    };
  };

  it('renders two tabs', () => {
    const element = renderComponent(PaneTabs, getProps());
    assert.ok(element);
    assert.ok(element.querySelector('[data-pane="summary"]'));
    assert.ok(element.querySelector('[data-pane="metadata"]'));
  });

  it('invokes onClickTab on click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(PaneTabs, getProps({
      onClickTab: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelectorAll('.tab-link a')[0]);

    sinon.assert.called(onClickSpy);
  });
});
