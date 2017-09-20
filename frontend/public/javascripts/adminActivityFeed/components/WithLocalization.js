import React, { PropTypes } from 'react';
import Localization from 'common/i18n/components/Localization';

const WithLocalization = ({ translations, children }) => (
  <Localization
    translations={translations}
    locale={serverConfig.locale || 'en'}
    localePrefix={serverConfig.localePrefix}
    returnKeyForNotFound={true}
    root="screens.admin.jobs"
  >
    {children}
  </Localization>
);

WithLocalization.propTypes = {
  translations: PropTypes.object.isRequired,
  children: PropTypes.object.isRequired
};

export default WithLocalization;
