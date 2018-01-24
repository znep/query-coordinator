import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import I18n from 'common/i18n';
import MetadataProvider from 'common/visualizations/dataProviders/MetadataProvider';
import SoqlDataProvider from 'common/visualizations/dataProviders/SoqlDataProvider';
import { FeatureFlags } from 'common/feature_flags';
import { Flannel, FlannelHeader, FlannelContent } from 'common/components/Flannel';
import { getDownloadLink, getDownloadType } from 'common/downloadLinks';

const featuredLinksList = ['csv', 'csv_for_excel'];

export default class ExportFlannel extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      exportSetting: 'all',
      rowCountAll: null,
      rowCountFiltered: null,
      flannelOpen: props.flannelOpen
    };

    _.bindAll(this, ['closeFlannel', 'openFlannel']);
  }

  propsRefreshHelper(props) {
    const self = this;
    const { exportFilteredData, view, whereClause } = props;
    // determine the underlying dataset metadata and save it in the state
    if (exportFilteredData) {
      const datasetDomain = window.location.hostname;
      const datasetUid = view.id;
      if (datasetDomain && datasetUid) {
        const metadataProvider = new MetadataProvider({ domain: datasetDomain, datasetUid }, true);
        let queryParamFiltered = 'select *';
        if (!_.isEmpty(whereClause)) {
          queryParamFiltered += ` where ${whereClause}`;
        }
        const newState = {
          datasetDomain,
          queryParamFiltered
        };
        metadataProvider.getDatasetMigrationMetadata().
          then(function(migrationMetadata) {
            self.setState({ ...newState, datasetUid: _.get(migrationMetadata, 'nbe_id', datasetUid) });
          }).
          catch(function() {
            self.setState({ ...newState, datasetUid });
          });
        // determine row counts
        const soqlDataProvider = new SoqlDataProvider({ domain: datasetDomain, datasetUid }, true);
        soqlDataProvider.getRowCount().
          then(function(resp) {
            self.setState({ rowCountAll: resp });
          });
        if (whereClause !== '') {
          soqlDataProvider.getRowCount(whereClause).
            then(function(resp) {
              self.setState({ rowCountFiltered: resp });
            });
        } else {
          self.setState(
            {
              exportSetting: 'all',
              rowCountFiltered: null
            }
          );
        }
      }
    }
  }

  componentDidMount() {
    this.propsRefreshHelper(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.propsRefreshHelper(nextProps);
  }

  closeFlannel() {
    this.setState({ flannelOpen: false });
  }

  openFlannel() {
    this.setState({ flannelOpen: true });
  }

  renderDownloadLink(format) {
    const { view, onDownloadData } = this.props;

    let url = getDownloadLink(view.id, format);
    if (this.props.exportFilteredData) {
      const queryParam = (this.state.exportSetting === 'filtered' ? this.state.queryParamFiltered : undefined);
      url = getDownloadLink(this.state.datasetUid, format, this.state.datasetDomain, 'https', queryParam);
    }
    const type = getDownloadType(format);
    const label = I18n.t('shared.components.export')[format] || format.toUpperCase();

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
    const { view, exportFormats } = this.props;

    const featuredLinks = exportFormats.
      filter(format => featuredLinksList.includes(format)).
      filter(this.csvForExcelOrTrue).
      map(this.renderDownloadLink.bind(this));

    return featuredLinks;
  }

  getRestofLinks() {
    const { view, exportFormats } = this.props;

    const restofLinks = exportFormats.
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
        {I18n.t('shared.components.export.action_buttons.download')}
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
        {I18n.t('shared.components.export.action_buttons.download')}
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
        {I18n.t('shared.components.export.action_buttons.export')}
      </span>
    );
  }

  renderRowCount(rowCount) {
    if (rowCount) {
      return (
        <span>
          ({rowCount} {I18n.t('shared.components.export.row', { count: rowCount })})
        </span>
      );
    } else {
      return (
        <span>
          ({I18n.t('shared.components.export.not_available')})
        </span>
      );
    }
  }

  renderFilterDataSelector() {
    const allDataProps = {
      name: 'export-flannel-export-setting',
      type: 'radio',
      id: 'export-flannel-export-setting-all',
      checked: (this.state.exportSetting === 'all'),
      onChange: () => {
        this.setState({ exportSetting: 'all' });
      }
    };
    const allData = (
      <div className="radiobutton">
        <input {...allDataProps} />
        <label htmlFor="export-flannel-export-setting-all">
          <span className="fake-radiobutton" />
          <span className="translation-within-label">
            {I18n.t('shared.components.export.all_data')}&nbsp;
            {this.renderRowCount(this.state.rowCountAll)}
          </span>
        </label>
      </div>
    );

    const filteredDataProps = {
      name: 'export-flannel-export-setting',
      type: 'radio',
      id: 'export-flannel-export-setting-filtered',
      checked: (this.state.exportSetting === 'filtered'),
      disabled: _.isEmpty(this.props.whereClause),
      onChange: () => {
        this.setState({ exportSetting: 'filtered' });
      }
    };
    const filteredData = (
      <div className="radiobutton">
        <input {...filteredDataProps} />
        <label
          htmlFor="export-flannel-export-setting-filtered"
          className={filteredDataProps.disabled ? 'disabled' : ''}>
          <span className="fake-radiobutton" />
          <span className="translation-within-label">
            {I18n.t('shared.components.export.filtered_data')}&nbsp;
            {this.renderRowCount(this.state.rowCountFiltered)}
          </span>
        </label>
      </div>
    );

    return (
      <form id="export-flannel-export-form">
        {allData}
        {filteredData}
      </form>
    );
  }

  renderFlannel() {
    const { view } = this.props;

    const exportFlannelProps = {
      id: 'export-flannel',
      className: 'btn-container export-flannel',
      target: () => this.targetElement,
      title: I18n.t('shared.components.export.flannel_title', { dataset_title: view.name }),
      onDismiss: this.closeFlannel
    };

    const exportFlannelHeaderProps = {
      title: I18n.t('shared.components.export.flannel_title', { dataset_title: view.name }),
      onDismiss: this.closeFlannel
    };

    return (
      <Flannel {...exportFlannelProps}>
        <FlannelHeader {...exportFlannelHeaderProps} />
        <FlannelContent>
          <div>
            {I18n.t('shared.components.export.flannel_description', { dataset_title: view.name })}
          </div>
          {this.props.exportFilteredData && this.renderFilterDataSelector()}
          <ul className="featured-download-links">
            {this.getFeaturedLinks()}
          </ul>
          <div className="additional-links-title">
            {I18n.t('shared.components.export.flannel_additional_links_title')}
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
  exportFilteredData: false,
  exportFormats: ['csv'],
  flannelOpen: false
};

ExportFlannel.propTypes = {
  exportFormats: PropTypes.array,
  view: PropTypes.object.isRequired,
  onDownloadData: PropTypes.func,
  whereClause: PropTypes.string,
  flannelOpen: PropTypes.bool
};
