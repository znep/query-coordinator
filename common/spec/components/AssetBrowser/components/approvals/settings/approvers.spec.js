import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';

import Approvers from 'common/components/AssetBrowser/components/approvals/settings/approvers';

import I18n, { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'frontend/config/locales/en.yml';

const translationScope = 'approvals.settings';

describe('components/approvals/settings/Approvers', () => {
  let wrapper;

  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
    wrapper = shallow(<Approvers translationScope={translationScope} />);
  });

  it('renders .approver-configuration', () => {
    assert.isTrue(wrapper.find('.approver-configuration').exists());
  });

  it('renders .section-title', () => {
    assert.isTrue(wrapper.find('.section-title').exists());
  });

  it('.section-title has the correct text', () => {
    const translatedText = I18n.t('approver_configuration.header', { scope: translationScope });

    assert.equal(
      wrapper.find('.section-title').text(),
      translatedText
    );
  });

  // NOTE: hacky looking test due to use of `dangerouslySetInnerHTML` inside
  // <p> tag
  it('link points to /admin/users', () => {
    wrapper = mount(<Approvers translationScope={translationScope} />);
    assert.include(
      wrapper.find('p').html(),
      '/admin/users'
    );
  });
});
