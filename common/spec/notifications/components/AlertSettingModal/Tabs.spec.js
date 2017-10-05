import renderLocalizationElement from '../../renderLocalizationComponent';
import Tabs from 'common/notifications/components/AlertSettingModal/Tabs';

describe('Tabs', () => {

  it('renders an element', () => {
    const element = renderLocalizationElement(Tabs, {});
    assert.isNotNull(element);
  });

});
