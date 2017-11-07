import { assert } from 'chai';
import renderComponent from '../../renderComponent';
import TestUtils from 'react-dom/test-utils';
import Tabs from 'common/authoring_workflow/components/shared/Tabs';

describe('Tabs', () => {

  it('should render one tab', () => {
    const onClickCallback = sinon.spy();

    const oneTab = [
      {
        iconClassName: 'socrata-icon-bar-chart',
        onClickTab: onClickCallback,
        selected: true,
        tabIndex: 0,
        title: 'Tab 1'
      }
    ];

    const component = renderComponent(Tabs, {
      tabs: oneTab
    });

    const link = component.querySelector('.tabs-list li a');
    assert.equal(link.text, 'Tab 1');
    assert.equal(link.className, 'selected');

    TestUtils.Simulate.click(link);
    sinon.assert.calledOnce(onClickCallback);
  });

  it('should render two tabs', () => {
    const onClickTab1Callback = sinon.spy();
    const onClickTab2Callback = sinon.spy();

    const twoTabs = [
      {
        iconClassName: 'socrata-icon-bar-chart',
        onClickTab: onClickTab1Callback,
        selected: false,
        tabIndex: 0,
        title: 'Tab 1'
      },
      {
        iconClassName: 'socrata-icon-bar-chart',
        onClickTab: onClickTab2Callback,
        selected: true,
        tabIndex: 1,
        title: 'Tab 2'
      }
    ];

    const component = renderComponent(Tabs, {
      tabs: twoTabs
    });

    // Tab 1
    //
    const link1 = component.querySelectorAll('.tabs-list li a')[0];
    assert.equal(link1.text, 'Tab 1');
    assert.equal(link1.className, '');

    TestUtils.Simulate.click(link1);
    sinon.assert.calledOnce(onClickTab1Callback);

    // Tab 2
    //
    const link2 = component.querySelectorAll('.tabs-list li a')[1];
    assert.equal(link2.text, 'Tab 2');
    assert.equal(link2.className, 'selected');

    TestUtils.Simulate.click(link2);
    sinon.assert.calledOnce(onClickTab2Callback);
  });
});
