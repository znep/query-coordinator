import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export function SocrataIcon({ name, className, isBtnIcon, otherAttributes }) {
  const attributes = {
    className: classNames(
      'socrata-icon',
      `socrata-icon-${name}`,
      { 'btn-icon': isBtnIcon },
      className,
    ),
    dangerouslySetInnerHTML: {
      __html: require(`common/resources/fonts/svg/${name}.svg`) // eslint-disable-line global-require
    }
  };

  return <span {...attributes} {...otherAttributes} />;
}

SocrataIcon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  otherAttributes: PropTypes.object,
  isBtnIcon: PropTypes.bool
};

SocrataIcon.defaultProps = {
  className: '',
  otherAttributes: {}
};

export default SocrataIcon;
