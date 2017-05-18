import classNames from 'classnames';
import React, { PropTypes } from 'react';

export function SocrataIcon({ name, className }) {
  const attributes = {
    className: classNames('socrata-icon', `socrata-icon-${name}`, className),
    dangerouslySetInnerHTML: {
      __html: require(`common/components/fonts/svg/${name}.svg`) // eslint-disable-line global-require
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
