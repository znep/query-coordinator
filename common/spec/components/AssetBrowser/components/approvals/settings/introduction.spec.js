import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import I18n from 'common/i18n';
import Introduction from 'common/components/AssetBrowser/components/approvals/settings/introduction';

describe('components/approvals/settings/Introduction', () => {
  const translationScope = 'approvals.settings';
  const wrapper = shallow(<Introduction translationScope={translationScope} />);

  it('renders .introduction', () => {
    assert.isTrue(wrapper.find('.introduction').exists());
  });

  it('renders .section-title', () => {
    assert.isTrue(wrapper.find('.section-title').exists());
  });

  it('has correct first paragraph text', () => {
    const wrapper = shallow(<Introduction translationScope={translationScope} />);
    const translatedText = I18n.t('introduction.paragraph_1', { scope: translationScope });

    assert.equal(
      wrapper.find('.first-paragraph').text(),
      translatedText
    );
  });

  it('has correct second paragraph text', () => {
    const wrapper = shallow(<Introduction translationScope={translationScope} />);
    const translatedText = I18n.t('introduction.paragraph_2', { scope: translationScope });

    assert.equal(
      wrapper.find('.second-paragraph').text(),
      translatedText
    );
  });
});
