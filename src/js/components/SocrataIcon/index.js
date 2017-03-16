import React, { PropTypes } from 'react';

export function SocrataIcon({ name, className }) {
  const attributes = {
    className: `socrata-icon socrata-icon-${name} ${className}`,
    dangerouslySetInnerHTML: {
      __html: require(`src/fonts/svg/${name}.svg`) // eslint-disable-line global-require
    }
  };

  return <span {...attributes} />;
}

SocrataIcon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string
};

SocrataIcon.defaultProps = {
  className: ''
};

export default SocrataIcon;
