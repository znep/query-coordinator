import _ from 'lodash';
import React from 'react';

export default function LocalizedText(props, context) {
  const { localization } = context;
  const { localeKey, data } = props;

  const translation = localization.translate(localeKey, data);
  const spanProps = _.omit(props, ['localeKey']);

  return <span {...spanProps} dangerouslySetInnerHTML={{ __html: translation }} />;
}

LocalizedText.propTypes = {
  localeKey: React.PropTypes.string.isRequired,
  data: React.PropTypes.object
};

LocalizedText.contextTypes = {
  localization: React.PropTypes.object
};
