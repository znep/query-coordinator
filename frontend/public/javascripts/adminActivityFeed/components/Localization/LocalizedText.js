import _ from 'lodash';
import React from 'react';

export default function LocalizedText(props, context) {
  const { localization } = context;
  const { localeKey } = props;

  const translation = localization.translate(localeKey);
  const spanProps = _.omit(props, ['localeKey']);

  return <span {...spanProps}>{translation}</span>;
}

LocalizedText.propTypes = {
  localeKey: React.PropTypes.string.isRequired
};

LocalizedText.contextTypes = {
  localization: React.PropTypes.object
};
