import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { FeatureFlags } from 'common/feature_flags';
import { Flannel, FlannelHeader, FlannelContent } from 'common/components/Flannel';
import { getDownloadLink, getDownloadType } from 'common/downloadLinks';

const featuredLinksList = ['csv', 'csv_for_excel'];

export default class ExportFlannel extends PureComponent {
  constructor(props) {
    super(props);

    props.view.exportFormats = props.view.exportFormats.filter(type => type !== 'json');

    this.state = {
      flannelOpen: props.flannelOpen
    };

    _.bindAll(this, ['closeFlannel', 'openFlannel']);
  }

  closeFlannel() {
    this.setState({ flannelOpen: false });
  }

  openFlannel() {
    this.setState({ flannelOpen: true });
  }

  renderDownloadLink(format) {
    const { view, onDownloadData } = this.props;

    const url = getDownloadLink(view.id, format);
    const type = getDownloadType(format);
    const label = I18n.export[format] || format.toUpperCase();

    return (
      <li key={format} className="download-link">
        <a role="menuitem" href={url} data-type={type} onClick={onDownloadData}>
          {label}
        </a>
      </li>
    );
  }

  // Used below to filter out the csv_for_excel options from the list of links if
  // the hide_csv_for_excel_download feature flag is set to true.
  // Duplicated in controls/panes/download-dataset.js
  csvForExcelOrTrue(value) {
    return !(FeatureFlags.value('hide_csv_for_excel_download') && value.match(/^csv_for_excel/));
  }

  getFeaturedLinks() {
    const { view } = this.props;

    const featuredLinks = view.exportFormats.
      filter(format => featuredLinksList.includes(format)).
      filter(this.csvForExcelOrTrue).
      map(this.renderDownloadLink.bind(this));

    return featuredLinks;
  }

  getRestofLinks() {
    const { view } = this.props;

    const restofLinks = view.exportFormats.
      filter(format => !featuredLinksList.includes(format)).
      filter(this.csvForExcelOrTrue).
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

  renderTarget() {
    const targetProps = {
      className: 'btn btn-simple btn-sm download',
      'aria-hidden': true,
      ref: ref => this.targetElement = ref,
      onClick: this.openFlannel
    };

    return (
      <span {...targetProps}>
        {I18n.action_buttons.export}
      </span>
    );
  }

  renderFlannel() {
    const { view } = this.props;

    const exportFlannelProps = {
      id: 'export-flannel',
      className: 'btn-container export-flannel',
      target: () => this.targetElement,
      title: I18n.export.flannel_title.replace('%{dataset_title}', view.name),
      onDismiss: this.closeFlannel
    };

    const exportFlannelHeaderProps = {
      title: I18n.export.flannel_title.replace('%{dataset_title}', view.name),
      onDismiss: this.closeFlannel
    };

    return (
      <Flannel {...exportFlannelProps}>
        <FlannelHeader {...exportFlannelHeaderProps} />
        <FlannelContent>
          <div>
            {I18n.export.flannel_description.replace('%{dataset_title}', view.name)}
          </div>
          <ul className="featured-download-links">
            {this.getFeaturedLinks()}
          </ul>
          <div className="additional-links-title">
            {I18n.export.flannel_additional_links_title}
          </div>
          <div className="restof-download-links clearBoth">
            {this.getRestofLinks()}
          </div>
        </FlannelContent>
      </Flannel>
    );
  }

  renderLinkWithFlannel() {
    return (
      <div className="btn-container">
        {this.renderTarget()}
        {this.state.flannelOpen && this.renderFlannel()}
      </div>
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
      return this.renderLinkWithFlannel();
    }
  }
}

ExportFlannel.defaultProps = {
  flannelOpen: false
};

ExportFlannel.propTypes = {
  view: PropTypes.object.isRequired,
  onDownloadData: PropTypes.func,
  flannelOpen: PropTypes.bool
};
