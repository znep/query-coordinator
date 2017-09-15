import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

export default function LocalizedText(props, context) {
  const { localization } = context;
  const { localeKey, data } = props;

  const translation = localization.translate(localeKey, data);
  const spanProps = _.omit(props, ['localeKey']);

  return <span {...spanProps} dangerouslySetInnerHTML={{ __html: translation }} />;
}

LocalizedText.propTypes = {
  localeKey: PropTypes.string.isRequired,
  data: PropTypes.object
};

LocalizedText.contextTypes = {
  localization: PropTypes.object
};
