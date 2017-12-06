import _ from 'lodash';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';

import I18n, { useTestTranslations } from 'common/i18n';
import Approvers from 'common/components/AssetBrowser/components/approvals/settings/approvers';

const translationScope = 'approvals.settings';

describe('components/approvals/settings/Approvers', () => {
  let wrapper;

  beforeEach(() => {
    // TODO: These translations are not present in the common translations bundle.
    // Thus, they're missing in the translations fixture.
    // Hacking the test for now, but we should fix this properly. EN-20777
    const scope = {};
    _.set(scope, 'approver_configuration.paragraph_1', 'link: <a href="{{link}}">Users…</a>');
    _.set(scope, 'approver_configuration.header', 'some header');
    useTestTranslations(_.set({}, translationScope, scope));

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
