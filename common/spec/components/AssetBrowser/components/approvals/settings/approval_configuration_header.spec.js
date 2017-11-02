import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';

import ApprovalConfigurationHeader from 'common/components/AssetBrowser/components/approvals/settings/approval_configuration_header';
import SocrataIcon from 'common/components/SocrataIcon';

import I18n, { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'frontend/config/locales/en.yml';

describe('components/approvals/settings/ApprovalConfigurationHeader', () => {
  const translationScope = 'approvals.settings';
  const defaultType = 'community';

  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
  });

  it('renders <SocrataIcon />', () => {
    const wrapper = shallow(
      <ApprovalConfigurationHeader translationScope={translationScope} type={defaultType} />
    );

    assert.isTrue(wrapper.find(SocrataIcon).exists());
  });

  it('renders .configuration-title', () => {
    const wrapper = shallow(
      <ApprovalConfigurationHeader translationScope={translationScope} type={defaultType} />
    );

    assert.isTrue(wrapper.find('.configuration-title').exists());
  });

  it('.configuration-title has correct text', () => {
    const type = 'community';
    const wrapper = shallow(
      <ApprovalConfigurationHeader translationScope={translationScope} type={defaultType} />
    );

    assert.include(
      wrapper.find('.configuration-title').children().nodes,
      I18n.t(`automatic_approval.header.${type}`, { scope: translationScope })
    );
  });

  describe('when passed type of `community`', () => {
    const type = 'community';

    it('provides correct iconName', () => {
      const wrapper = mount(
        <ApprovalConfigurationHeader translationScope={translationScope} type={type} />
      );

      assert.equal(wrapper.find(SocrataIcon).node.props.name, 'community');
    });

    it('.configuration-title has correct text', () => {
      const wrapper = shallow(
        <ApprovalConfigurationHeader translationScope={translationScope} type={type} />
      );

      assert.include(
        wrapper.find('.configuration-title').children().nodes,
        I18n.t(`automatic_approval.header.${type}`, { scope: translationScope })
      );
    });
  });

  describe('when passed type of `official`', () => {
    const type = 'official';

    it('provides correct iconName', () => {
      const wrapper = mount(
        <ApprovalConfigurationHeader translationScope={translationScope} type={type} />
      );

      assert.equal(wrapper.find(SocrataIcon).node.props.name, 'official2');
    });

    it('.configuration-title has correct text', () => {
      const wrapper = shallow(
        <ApprovalConfigurationHeader translationScope={translationScope} type={type} />
      );

      assert.include(
        wrapper.find('.configuration-title').children().nodes,
        I18n.t(`automatic_approval.header.${type}`, { scope: translationScope })
      );
    });
  });
});
