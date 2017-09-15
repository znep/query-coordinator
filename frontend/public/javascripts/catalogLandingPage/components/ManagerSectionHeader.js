import PropTypes from 'prop-types';
import React from 'react';

export class ManagerSectionHeader extends React.Component {
  render() {
    const { children, className } = this.props;

    return (
      <h6 className={`h6 styleguide-subheader ${className}`}>{children}</h6>
    );
  }
}

ManagerSectionHeader.propTypes = {
  children: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default ManagerSectionHeader;
