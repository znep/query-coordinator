import React from 'react';

import { assert } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import I18n from 'common/i18n';
import Reapproval from 'common/components/AssetBrowser/components/approvals/settings/reapproval';

const validProps = (options = {}) => ({
  onReapprovalClick: () => 'default onOptionChange func called',
  reapprovalPolicy: 'manual',
  translationScope: 'approvals.settings',
  ...options
});

describe('components/approvals/settings/Reapproval', () => {
  let wrapper;
  let translationScope;

  beforeEach(() => {
    wrapper = shallow(<Reapproval {...validProps()} />);
    ({ translationScope } = validProps());
  });

  it('renders .checkboxWrapper', () => {
    assert(wrapper.find('.checkboxWrapper').exists());
  });

  it('renders label with the correct text', () => {
    const labelText = I18n.t('automatic_approval.require_on_republish', { scope: translationScope });
    assert.equal(wrapper.find('label').text(), labelText);
  });

  it('#approval-configuration-reapproval checkbox should be checked', () => {
    assert.isTrue(wrapper.find('input#approval-configuration-reapproval').props().checked);
  });

  describe('when reapprovalPolicy is "auto"', () => {
    it('#approval-configuration-reapproval checkbox should not be checked', () => {
      const propsWithAutoReapproval = validProps({ reapprovalPolicy: 'auto' });
      wrapper = shallow(<Reapproval {...propsWithAutoReapproval} />);
      assert.isFalse(wrapper.find('input#approval-configuration-reapproval').props().checked);
    });
  });

  describe('input checkbox .checkboxWrapper', () => {
    it('responds to onChange with onReapprovalClick func', () => {
      const onReapprovalClickSpy = sinon.spy();
      const propsWithSpy = validProps({ onReapprovalClick: onReapprovalClickSpy });
      wrapper = shallow(<Reapproval {...propsWithSpy} />);

      const childCheckbox = wrapper.find('input#approval-configuration-reapproval');
      childCheckbox.simulate('change');

      assert(onReapprovalClickSpy.calledOnce, 'Reapproval Click spy not called');
    });
  });
});
