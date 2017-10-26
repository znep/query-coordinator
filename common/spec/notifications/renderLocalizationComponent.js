import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import Localization from 'common/i18n/components/Localization';

export default function(component, props, translations, locale) {
  const element = React.createElement(component, props);
  const renderLocalizationElement = TestUtils.renderIntoDocument(
    <Localization translations={translations || {}} locale={locale || 'en'}>
      {element}
    </Localization>
  );

  return ReactDOM.findDOMNode(renderLocalizationElement);
}
