import _ from 'lodash';
import React from 'react';
import SocrataButton from '../SocrataButton';

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
      <SocrataButton {...buttonProps} className={ this.props.inProgress ? '' : 'icon-download'}>
        { this.renderButtonContent() }
      </SocrataButton>
    );
  }
}

SocrataDownloadButton.defaultProps = {
  inProgress: false
};

SocrataDownloadButton.propTypes = {
  inProgress: React.PropTypes.bool,
  fileUrl: React.PropTypes.string.isRequired,
  fileName: React.PropTypes.string.isRequired,
  onStartDownload: React.PropTypes.func.isRequired
};
