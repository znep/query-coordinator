import classNames from 'classnames';
import React, { PropTypes } from 'react';

export function SocrataIcon({ name, className, otherAttributes }) {
  const attributes = {
    className: classNames('socrata-icon', `socrata-icon-${name}`, className),
    dangerouslySetInnerHTML: {
      __html: require(`common/resources/fonts/svg/${name}.svg`) // eslint-disable-line global-require
    }
  };

  return <span {...attributes} {...otherAttributes} />;
}

SocrataIcon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  otherAttributes: PropTypes.object
};

SocrataIcon.defaultProps = {
  className: '',
  otherAttributes: {}
};

export default SocrataIcon;
