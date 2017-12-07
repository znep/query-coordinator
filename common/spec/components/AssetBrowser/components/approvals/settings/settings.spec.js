import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import Settings from 'common/components/AssetBrowser/components/approvals/settings/settings';
import Introduction from 'common/components/AssetBrowser/components/approvals/settings/introduction';
import AutoApproval from 'common/components/AssetBrowser/components/approvals/settings/auto_approval';
import Reapproval from 'common/components/AssetBrowser/components/approvals/settings/reapproval';
import Approvers from 'common/components/AssetBrowser/components/approvals/settings/approvers';

const validProps = (options = {}) => ({
  translationScope: 'approvals.settings',
  onReapprovalClick: () => 'onReapprovalClick default',
  reapprovalPolicy: 'manual',
  ...options
});

describe('components/approvals/settings/Settings', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Settings {...validProps()} />);
  });

  it('renders .settings', () => {
    assert.isTrue(wrapper.find('.settings').exists());
  });

  it('renders .settingsContainer', () => {
    assert.isTrue(wrapper.find('.settingsContainer').exists());
  });

  it('renders .actions', () => {
    assert.isTrue(wrapper.find('.actions').exists());
  });

  const componentsToRender = [
    Introduction,
    AutoApproval,
    Reapproval,
    Approvers
  ];

  for (var i = 0; i < componentsToRender.length; i++) {
    const componentUnderTest = componentsToRender[i];

    it(`renders ${componentUnderTest}`, () => {
      assert.isTrue(wrapper.find(componentUnderTest).exists());
    });
  }
});
