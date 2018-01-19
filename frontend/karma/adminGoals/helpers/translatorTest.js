import { expect, assert } from 'chai';
import Immutable from 'immutable';

import translator from 'adminGoals/helpers/translator';
import translationsObj from 'mockTranslations';

const translations = Immutable.fromJS(translationsObj);

describe('helpers/translator', () => {
  it('should find correct translation', () => {
    const message = translator(translations, 'admin.bulk_edit.success_message');
    expect(message).to.eq('Success! {0} goals were updated.');
  });

  it('should replace placeholders for given translation', () => {
    const message = translator(translations, 'admin.bulk_edit.success_message', 3);
    expect(message).to.eq('Success! 3 goals were updated.');
  })
});
