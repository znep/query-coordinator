import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import AutoApproval from 'common/components/AssetBrowser/components/approvals/settings/auto_approval';
import ApprovalConfigurationHeader from 'common/components/AssetBrowser/components/approvals/settings/approval_configuration_header';
import OptionContainer from 'common/components/AssetBrowser/components/approvals/settings/option_container';

const validProps = {
  translationKey: 'string',
  onOptionChange: () => 'success',
  optionName: 'string',
  presetStates: {},
  translationScope: 'string',
  type: 'community'
};

describe('components/approvals/settings/AutoApproval', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<AutoApproval {...validProps} />);
  });

  it('should render a component with the class .approval-configuration', () => {
    assert.equal(wrapper.find('.approval-configuration').length, 1);
  });

  it('should render one ApprovalConfigurationHeader', () => {
    assert.equal(wrapper.find(ApprovalConfigurationHeader).length, 1);
  });

  it('should render three OptionContainers', () => {
    assert.equal(wrapper.find(OptionContainer).length, 3);
  });
});
