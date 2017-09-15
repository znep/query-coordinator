import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { getIconNameForDisplayType } from 'common/displayTypeMetadata';
import SocrataIcon from '../SocrataIcon';

class AssetTypeIcon extends React.Component {
  getSvgName() {
    const { displayType, isPublished } = this.props;
    return getIconNameForDisplayType(displayType, isPublished);
  }

  render() {
    const { displayType, className, tooltip } = this.props;
    const name = this.getSvgName();

    const otherAttributes = {
      'data-type': displayType,
      title: tooltip
    }

    return <SocrataIcon
      name={name}
      className={`asset-type-icon ${className}`}
      otherAttributes={otherAttributes} />;
  }
}

AssetTypeIcon.propTypes = {
  displayType: PropTypes.string.isRequired,
  className: PropTypes.string,
  isPublished: PropTypes.bool,
  tooltip: PropTypes.string
};

AssetTypeIcon.defaultProps = {
  className: '',
  isPublished: true
};

export default AssetTypeIcon;
