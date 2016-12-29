import React, { PropTypes } from 'react';

export function SocrataIcon({ name }) {
  const attributes = {
    className: 'socrata-icon',
    dangerouslySetInnerHTML: {
      __html: require(`src/fonts/svg/${name}.svg`) // eslint-disable-line global-require
    }
  };

  return <span {...attributes} />;
}

SocrataIcon.propTypes = {
  name: PropTypes.string.isRequired
};

export default SocrataIcon;
