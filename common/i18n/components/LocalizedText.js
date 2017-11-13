import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

export default function LocalizedText(props, context) {
  const { I18n } = context;
  const { localeKey, data } = props;

  const translation = I18n.t(localeKey, data);
  const spanProps = _.omit(props, ['localeKey', 'data']);

  return <span {...spanProps} dangerouslySetInnerHTML={{ __html: translation }} />;
}

LocalizedText.defaultProps = {
  data: {}
};

LocalizedText.propTypes = {
  localeKey: PropTypes.string.isRequired,
  data: PropTypes.object
};

LocalizedText.contextTypes = {
  I18n: PropTypes.object,
  localization: PropTypes.object
};
