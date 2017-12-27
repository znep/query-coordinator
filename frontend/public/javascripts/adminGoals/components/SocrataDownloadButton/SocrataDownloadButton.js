import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Button } from 'common/components';

import './SocrataDownloadButton.scss';

export default class SocrataDownloadButton extends React.Component {
  constructor(props) {
    super(props);

    this.blobDataSupported = typeof window.Blob !== 'undefined' && typeof window.URL !== 'undefined';
    this.blacklistedProps = ['fileUrl', 'fileName', 'info', 'onStartDownload', 'onCancelDownload', 'inProgress', 'children'];

    this.state = {
      infoVisible: false
    };
  }

  renderButtonContent() {
    if (this.props.inProgress) {
      return <span className="spinner-default spinner-btn-primary"/>;
    } else {
      return this.props.children;
    }
  }

  render() {
    const props = this.props;
    const childrenProps = _.omit(props, this.blacklistedProps);

    const buttonProps = {
      ...childrenProps,
      href: this.blobDataSupported ? null : props.fileUrl,
      download: this.blobDataSupported ? null : props.fileName,
      onClick: this.blobDataSupported ? props.onStartDownload : null
    };

    return (
      <Button {...buttonProps} className={ this.props.inProgress ? '' : 'icon-download'}>
        { this.renderButtonContent() }
      </Button>
    );
  }
}

SocrataDownloadButton.defaultProps = {
  inProgress: false
};

SocrataDownloadButton.propTypes = {
  inProgress: PropTypes.bool,
  fileUrl: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  onStartDownload: PropTypes.func.isRequired
};
