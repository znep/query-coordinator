import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

import ApprovalConfigurationOption from 'common/components/AssetBrowser/components/approvals/settings/approval_configuration_option';

import I18n, { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'frontend/config/locales/en.yml';

const validProps = (options = {}) => ({
  translationKey: 'send_to_my_queue',
  onOptionChange: () => 'default onOptionChange func called',
  optionName: 'pending',
  presetStates: {
    community: 'approved',
    official: 'pending'
  },
  translationScope: 'approvals.settings',
  type: 'official',
  withExplanation: true,
  ...options
});

describe('components/approvals/settings/ApprovalConfigurationOption', () => {
  let wrapper;
  let type;
  let optionName;
  let childRadio;

  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
    wrapper = mount(<ApprovalConfigurationOption {...validProps()} />);
    ({ type, optionName } = validProps());
  });

  describe('child radio input', () => {
    let childRadio;

    beforeEach(() => {
      childRadio = wrapper.find(`input#approval-configuration-${type}-${optionName}`);
    });

    it('renders with correct id', () => {
      assert(childRadio.exists());
    });

    it('renders with correct name', () => {
      assert.equal(childRadio.node.name, `approval-configuration-${type}`);
    });

    it('should be checked', () => {
      assert(childRadio.node.checked);
    });

    describe('onChange callback', () => {
      it('responds to onChange with onOptionChange func', () => {
        const onOptionChangeSpy = sinon.spy();
        wrapper = mount(<ApprovalConfigurationOption {...validProps({ onOptionChange: onOptionChangeSpy })} />);
        childRadio = wrapper.find(`input#approval-configuration-${type}-${optionName}`);

        childRadio.simulate('change');

        assert(
          onOptionChangeSpy.calledOnce,
          'Option Change spy not called'
        );
      });
    });

    describe('when optionName does not match presetStates', () => {
      it('should not be checked', () => {
        optionName = 'approved';
        const propsForUnchecked = validProps({ optionName });
        wrapper = mount(<ApprovalConfigurationOption {...propsForUnchecked} />);
        childRadio = wrapper.find(`input#approval-configuration-${type}-${optionName}`);

        assert.isFalse(childRadio.node.checked);
      });
    });
  });

  describe('child label', () => {
    let childLabel;
    let translationKey;
    let translationScope;

    beforeEach(() => {
      childLabel = wrapper.find('label.radioLabel');
      ({ translationKey, translationScope } = validProps());
    });

    it('renders', () => {
      assert(childLabel.exists());
    });

    it('renders with correct text', () => {
      const childLabelText = I18n.t(`automatic_approval.${translationKey}`, { scope: translationScope });
      assert.include(childLabel.node.innerText, childLabelText);
    });

    it('renders explanation', () => {
      const explanationText = I18n.t('automatic_approval.explanation', { scope: translationScope });
      assert(childLabel.find('.explanation').exists());
    });

    it('renders correct explanation text', () => {
      const explanationText = I18n.t('automatic_approval.explanation', { scope: translationScope });
      assert.equal(childLabel.find('.explanation').text(), explanationText);
    });

    describe('when withExplanation is false', () => {
      it('does not render explanation', () => {
        wrapper = mount(<ApprovalConfigurationOption {...validProps({ withExplanation: false })} />);
        assert.isFalse(wrapper.find('label.radioLabel').find('.explanation').exists());
      });
    });
  });
});
