import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { Flyout, FlyoutHeader, FlyoutContent } from './Flyout';

const featuredLinksList = ['csv', 'csv_for_excel'];

export default class DownloadFlyout extends PureComponent {

  renderDownloadLink(format) {
    const { view, onDownloadData } = this.props;
    let extension = format;
    let type = format.toUpperCase();
    const params = {
      accessType: 'DOWNLOAD'
    };

    switch (format) { // eslint-disable-line default-case
      case 'csv_for_excel':
        extension = 'csv';
        type = 'CSV for Excel';
        params.bom = 'true';
        params.format = 'true';
        break;

      case 'csv_for_excel_europe':
        extension = 'csv';
        type = 'CSV for Excel (Europe)';
        params.bom = 'true';
        params.format = 'true';
        params.delimiter = ';';
        break;

      case 'tsv_for_excel':
        extension = 'tsv';
        type = 'TSV for Excel';
        params.bom = 'true';
        break;
    }

    // Construct the query string, url, and label
    const queryString = $.param(params);
    const url = `/api/views/${view.id}/rows.${extension}?${queryString}`;
    const label = I18n.download[format] || format.toUpperCase();

    return (
      <li key={format} className="download-link">
        <a role="menuitem" href={url} data-type={type} onClick={onDownloadData}>
          {label}
        </a>
      </li>
    );
  }

  getFeaturedLinks() {
    const { view } = this.props;

    const featuredLinks = view.exportFormats.
      filter(format => ['csv', 'csv_for_excel'].includes(format)).
      map(this.renderDownloadLink.bind(this));

    return featuredLinks;
  }

  getRestofLinks() {
    const { view } = this.props;

    const restofLinks = view.exportFormats.
      filter(format => !['csv', 'csv_for_excel'].includes(format)).
      map(this.renderDownloadLink.bind(this)).
      filter(el => !featuredLinksList.includes(el.key)).
      reduce(
        (accu, el, index) => {
          const currentULIndex = Math.floor(index / 3);
          !accu[currentULIndex] && (accu[currentULIndex] = []); // eslint-disable-line no-unused-expressions
          accu[currentULIndex].push(el);
          return accu;
        }, []
      ).
      map((part, i) => <ul key={i}>{part}</ul>);

    return restofLinks;
  }

  renderBlobby() {
    const { view } = this.props;

    const componentProps = {
      href: `/api/views/${view.id}/files/${view.blobId}?filename=${view.blobFilename}`,
      className: 'btn btn-simple btn-sm unstyled-link download',
      target: '_blank'
    };

    return (
      <a {...componentProps}>
        {I18n.action_buttons.download}
      </a>
    );
  }

  renderOverrideLink() {
    const { view } = this.props;
    const href = _.get(view.metadata, 'overrideLink');

    const componentProps = {
      href,
      className: 'btn btn-simple btn-sm unstyled-link download'
    };

    return (
      <a {...componentProps}>
        {I18n.action_buttons.download}
      </a>
    );
  }

  renderTargetElement() {

    return (
      <span aria-hidden className="btn btn-simple btn-sm download">
        {I18n.action_buttons.download}
      </span>
    );
  }

  renderLinkWithFlyout() {
    const { view } = this.props;

    const downloadFlyoutProps = {
      position: 'left',
      trigger: 'click',
      className: 'btn-container downloads-flyout',
      targetElement: this.renderTargetElement()
    };

    return (
      <Flyout {...downloadFlyoutProps}>
        <FlyoutHeader
          title={I18n.download.flyout_title.replace('%{dataset_title}', view.name)}
          description={I18n.download.flyout_description.replace('%{dataset_title}', view.name)} />
        <FlyoutContent>
          <ul className="featured-download-links">
            {this.getFeaturedLinks()}
          </ul>
          <div className="additional-links-title">
            {I18n.download.flyout_additional_links_title}
          </div>
          <div className="restof-download-links clearBoth">
            {this.getRestofLinks()}
          </div>
        </FlyoutContent>
      </Flyout>
    );
  }

  render() {
    const { view } = this.props;
    const overrideLink = _.get(view.metadata, 'overrideLink');

    // Special cases for different view types and download overrides
    if (view.isHref) {
      return null;
    } else if (view.isBlobby) {
      return this.renderBlobby();
    } else if (overrideLink) {
      return this.renderOverrideLink();
    } else {
      return this.renderLinkWithFlyout();
    }
  }
}

DownloadFlyout.propTypes = {
  view: PropTypes.object.isRequired,
  onDownloadData: PropTypes.func
};
