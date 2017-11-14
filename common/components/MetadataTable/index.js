import _ from 'lodash';
import collapsible from 'common/collapsible';
import velocity from 'velocity-animate';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { formatDateWithLocale } from 'common/dates';
import utils from 'common/js_utils';
import Linkify from 'react-linkify';
import moment from 'moment-timezone';
import I18n from 'common/i18n';
import { ENTER, SPACE, isOneOfKeys } from 'common/dom_helpers/keycodes';

// Checks if event is a space or an enter
const handleInvokeKey = (handler, preventDefault) => (
  (event) => {
    if (isOneOfKeys(event, [ENTER, SPACE])) {
      if (preventDefault) {
        event.preventDefault();
      }

      return handler(event);
    }
  }
);

// TODO: Make an example page for this component.
class MetadataTable extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'toggleTable');
  }

  componentDidMount() {
    this.collapseTags();
    this.collapseTable();
    this.patchFirefoxWordBreakBug();
  }

  // Legendary firefox hack, see https://bugzilla.mozilla.org/show_bug.cgi?id=1266901
  patchFirefoxWordBreakBug() {
    const el = ReactDOM.findDOMNode(this);
    _.toArray(el.querySelectorAll('td.attachment a')).forEach((link) => {
      link.style.display = 'none';
      link.offsetHeight; // eslint-disable-line no-unused-expressions
      link.style.display = '';
    });
  }

  collapseTags() {
    if (_.isEmpty(this.props.coreView.tags)) {
      return;
    }

    const el = ReactDOM.findDOMNode(this);
    collapsible(el.querySelector('.tag-list'), {
      height: 2 * 24,
      wrap: 'children',
      lastCharacter: {
        remove: [' ', ';', '.', '!', '?']
      },
      expandedCallback: this.props.onExpandTags || _.noop
    });
  }

  collapseTable() {
    const el = ReactDOM.findDOMNode(this);
    const leftColumnHeight = el.querySelector('.metadata-column.fancy').offsetHeight;
    const tableColumn = el.querySelector('.metadata-column.tables');
    const tables = _.toArray(tableColumn.querySelectorAll('.metadata-table'));
    let shouldHideToggles = true;

    // Add a 'hidden' class to tables whose top is below the bottom of the left column.
    // These will be shown and hidden as the tableColumn is expanded and collapsed.
    tables.forEach((table) => {
      if (table.offsetTop > leftColumnHeight) {
        table.classList.add('hidden');
        shouldHideToggles = false;
      }
    });

    // If there is not enough content in the tableColumn, hide the toggles and avoid
    // binding event handlers, as no collapsing is necessary.
    if (shouldHideToggles) {
      const toggleGroups = _.toArray(el.querySelectorAll('.metadata-table-toggle-group'));
      toggleGroups.forEach((group) => group.style.display = 'none');

      tableColumn.classList.remove('collapsed');
      tableColumn.style.paddingBottom = 0;

      return;
    }
  }

  toggleTable(event) {
    event.preventDefault();

    const onExpandMetadataTable = this.props.onExpandMetadataTable || _.noop;
    const el = ReactDOM.findDOMNode(this);
    const tableColumn = el.querySelector('.metadata-column.tables');

    const wasCollapsed = tableColumn.classList.contains('collapsed');
    const originalHeight = tableColumn.getBoundingClientRect().height;
    tableColumn.classList.toggle('collapsed');
    const targetHeight = tableColumn.getBoundingClientRect().height;
    tableColumn.style.height = `${originalHeight}px`;

    if (wasCollapsed) {
      velocity(tableColumn, {
        height: targetHeight
      }, () =>
        tableColumn.style.height = ''
      );

      onExpandMetadataTable();
    } else {
      tableColumn.classList.remove('collapsed');

      tableColumn.style.height = `${originalHeight}px`;
      velocity(tableColumn, {
        height: targetHeight
      }, () => {
        tableColumn.style.height = '';
        tableColumn.classList.add('collapsed');
      });
    }
  }

  renderHeader() {
    let editMetadata;
    const { editMetadataUrl, localizeLink, renderWatchDatasetButton } = this.props;
    const onClickEditMetadata = this.props.onClickEditMetadata || _.noop;
    const watchDatasetButton = renderWatchDatasetButton ? renderWatchDatasetButton() : null;
    if (editMetadataUrl) {
      editMetadata = (
        <a
          href={localizeLink(editMetadataUrl)}
          className="btn btn-sm btn-default btn-alternate-2"
          onClick={onClickEditMetadata}>
          {I18n.t('common.metadata.edit_metadata')}
        </a>
      );
    }

    return (
      <div className="landing-page-header-wrapper">
        <h2 className="landing-page-section-header">
          {I18n.t('common.metadata.title')}
        </h2>
        <div className="button-group">
          {editMetadata}
          {watchDatasetButton}
        </div>
      </div>
    );
  }

  render() {
    const { coreView, disableContactDatasetOwner, statsUrl, customMetadataFieldsets, localizeLink } =
      this.props;
    const onClickStats = this.props.onClickStats || _.noop;

    let attachments;
    let attribution;
    let attributionLink;
    let category;
    let contactDatasetOwner;
    let customMetadataTable;
    let dataLastUpdated;
    let downloads;
    let license;
    let statsSection;
    let tags;
    const isBlobby = coreView.viewType === 'blobby';
    const isHref = coreView.viewType === 'href';
    const isMeasure = coreView.viewType === 'measure';
    const showDataLastUpdated = !isBlobby && !isHref && !isMeasure;
    const showDownloadCount = !isMeasure;

    const ownerName = _.get(coreView, 'owner.displayName');
    const dataLastUpdatedAt = coreView.rowsUpdatedAt;
    const metadataLastUpdatedAt = coreView.viewLastModified;

    // Mirrors view.rb#time_last_updated_at
    const lastUpdatedAt = _([
      coreView.rowsUpdatedAt,
      coreView.createdAt,
      coreView.viewLastModified
    ]).compact().max();

    const header = _.get(
      this.props,
      'header',
      this.renderHeader()
    );

    if (coreView.attribution) {
      attribution = (
        <dd className="metadata-detail-group-value">
          {coreView.attribution}
        </dd>
      );
    } else {
      attribution = (
        <dd className="metadata-detail-group-value empty">
          {I18n.t('common.metadata.no_value')}
        </dd>
      );
    }

    // The intention behind this construct is to provide a means of translating _certain_ metadata field names
    // into variations of the original name. For example USAID wishes to see "Described By" => "Data Dictionary".
    // In order to facilitate this, we only add transformation to en.yml for the words or phrases that need to
    // be transformed. The defaults object provides the un-transformed value when no transformation is available.
    const transformLabel = (name) => {
      const translationKey = name.replace(/ /g, '_').toLowerCase();
      const defaults = [{ message: name }];
      return I18n.t(translationKey, { scope: 'dataset_landing_page.metadata.transforms', defaults });
    };

    if (!_.isEmpty(customMetadataFieldsets)) {
      const makeRows = (fields = {}) => {
        return _.map(fields, (value, name) => {
          if (_.isString(value) || _.isNumber(value)) {
            return (
              <tr key={name}>
                <td>{transformLabel(name)}</td>
                <td>
                  <Linkify properties={{ rel: 'nofollow', target: '_blank' }}>
                    {value}
                  </Linkify>
                </td>
              </tr>
            );
          } else {
            return null;
          }
        });
      };

      customMetadataTable = _.map(customMetadataFieldsets, (fieldset, fieldsetName) => {
        const tableRows = makeRows(fieldset);

        return (
          <div key={fieldsetName} className="metadata-table">
            <h3 className="metadata-table-title">
              {fieldsetName}
            </h3>

            <table className="table table-condensed table-borderless table-discrete table-striped">
              <tbody>
                {tableRows}
              </tbody>
            </table>
          </div>
        );
      });
    }

    if (coreView.metadata && !_.isEmpty(coreView.metadata.attachments)) {
      const attachmentRows = _.map(coreView.metadata.attachments, (attachment, i) => {
        const displayName = attachment.name || attachment.filename;
        const href = attachment.blobId ?
          `/api/assets/${attachment.blobId}?download=true` :
          `/api/views/${coreView.id}/files/${attachment.assetId}?download=true&filename=${attachment.filename}`;

        return (
          <tr key={i}>
            <td className="attachment">
              <span className="icon-copy-document"></span>
              <span><a href={href}>{displayName}</a></span>
            </td>
          </tr>
        );
      });

      attachments = (
        <div>
          <h3 className="metadata-table-title">
            {I18n.t('common.metadata.attachments')}
          </h3>
          <table className="table table-condensed table-borderless table-discrete table-striped">
            <tbody>
              {attachmentRows}
            </tbody>
          </table>
        </div>
      );
    }

    if (coreView.category) {
      category = <td>{_.upperFirst(coreView.category)}</td>;
    } else {
      category = <td className="empty">{I18n.t('common.metadata.no_category_value')}</td>;
    }

    if (!_.isEmpty(coreView.tags)) {
      const tagLinks = _.map(coreView.tags, (tag, i) => (
        <span key={i}>
          <a href={localizeLink(`/browse?tags=${tag}`)}>{tag}</a>
          {i === coreView.tags.length - 1 ? '' : ', '}
        </span>
      ));

      tags = (
        <td>
          <div className="tag-list-container collapsible">
            <div className="tag-list">
              {tagLinks}

              <button className="collapse-toggle more">{I18n.t('common.more')}</button>
              <button className="collapse-toggle less">{I18n.t('common.less')}</button>
            </div>
          </div>
        </td>
      );
    } else {
      tags = <td className="empty">{I18n.t('common.metadata.no_tags_value')}</td>;
    }

    const licenseName = _.get(coreView, 'license.name');
    const licenseLink = _.get(coreView, 'license.termsLink');
    const licenseLogo = _.get(coreView, 'license.logoUrl');
    if (licenseName) {
      if (licenseLogo) {
        license = <img src={`/${licenseLogo}`} alt={licenseName} className="license" />;
      } else {
        license = licenseName;
      }

      if (licenseLink) {
        license = <a href={licenseLink} target="_blank">{license}</a>;
      }

      license = <td>{license}</td>;
    } else {
      license = <td className="empty">{I18n.t('common.metadata.no_license_value')}</td>;
    }

    if (coreView.attributionLink) {
      attributionLink = (
        <tr>
          <td>{I18n.t('common.metadata.source_link')}</td>
          <td className="attribution">
            <a href={coreView.attributionLink} target="_blank" rel="nofollow external">
              {coreView.attributionLink}
              <span className="icon-external-square" />
            </a>
          </td>
        </tr>
      );
    }

    if (statsUrl) {
      statsSection = (
        <div className="metadata-row middle">
          <a
            className="metadata-detail-group-value"
            href={localizeLink(statsUrl)}
            onClick={onClickStats}>
            {I18n.t('common.metadata.view_statistics')}
          </a>
        </div>
      );
    }

    if (!disableContactDatasetOwner) {
      contactDatasetOwner = (
        <button
          className="btn btn-sm btn-primary btn-block contact-dataset-owner"
          data-modal="contact-form">
          {I18n.t('common.contact_dataset_owner')}
        </button>
      );
    }

    if (showDataLastUpdated) {
      dataLastUpdated = (
        <div className="metadata-detail-group">
          <dt className="metadata-detail-group-title">
            {I18n.t('common.metadata.data_last_updated')}
          </dt>

          <dd className="metadata-detail-group-value">
            {formatDateWithLocale(moment.unix(coreView.rowsUpdatedAt))}
          </dd>
        </div>
      );
    }

    if (showDownloadCount && _.isFinite(coreView.downloadCount)) {
      downloads = (
        <div className="metadata-pair download-count">
          <dt className="metadata-pair-key">
            {I18n.t('common.metadata.downloads')}
          </dt>

          <dd className="metadata-pair-value">
            {utils.formatNumber(coreView.downloadCount)}
          </dd>
        </div>
      );
    }

    return (
      <div className="metadata-table-wrapper">
        <section className="landing-page-section">
          {header}

          <div className="section-content">
            <dl className="metadata-column fancy">
              <div className="metadata-section">
                <div className="metadata-row">
                  <div className="metadata-pair">
                    <dt className="metadata-pair-key">
                      {I18n.t('common.updated')}
                    </dt>

                    <dd className="metadata-pair-value">
                      {formatDateWithLocale(moment.unix(lastUpdatedAt))}
                    </dd>
                  </div>
                </div>

                <div className="metadata-row middle metadata-flex metadata-detail-groups">
                  {dataLastUpdated}

                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.t('common.metadata.metadata_last_updated')}
                    </dt>

                    <dd className="metadata-detail-group-value">
                      {formatDateWithLocale(moment.unix(metadataLastUpdatedAt))}
                    </dd>
                  </div>
                </div>

                <div className="metadata-row metadata-detail-groups">
                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.t('common.metadata.creation_date')}
                    </dt>

                    <dd className="metadata-detail-group-value">
                      {formatDateWithLocale(moment.unix(coreView.createdAt))}
                    </dd>
                  </div>
                </div>
              </div>

              <hr aria-hidden />

              <div className="metadata-section">
                <div className="metadata-row metadata-flex">
                  <div className="metadata-pair">
                    <dt className="metadata-pair-key">
                      {I18n.t('common.metadata.views')}
                    </dt>

                    <dd className="metadata-pair-value">
                      {utils.formatNumber(coreView.viewCount)}
                    </dd>
                  </div>

                  {downloads}
                </div>
                {statsSection}
              </div>

              <hr aria-hidden />

              <div className="metadata-section">
                <div className="metadata-row metadata-flex metadata-detail-groups">
                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.t('common.metadata.data_provided_by')}
                    </dt>
                    {attribution}
                  </div>

                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.t('common.metadata.dataset_owner')}
                    </dt>

                    <dd className="metadata-detail-group-value">
                      {ownerName}
                    </dd>
                  </div>
                </div>
                {contactDatasetOwner}
              </div>
            </dl>

            <div className="metadata-column tables collapsed">
              {customMetadataTable}

              <div className="metadata-table">
                {attachments}
              </div>

              <div className="metadata-table">
                <h3 className="metadata-table-title">
                  {I18n.t('common.metadata.topics')}
                </h3>

                <table
                  className="table table-condensed table-borderless table-discrete table-striped">
                  <tbody>
                    <tr>
                      <td>{I18n.t('common.metadata.category')}</td>
                      {category}
                    </tr>

                    <tr>
                      <td>{I18n.t('common.metadata.tags')}</td>
                      {tags}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="metadata-table">
                <h3 className="metadata-table-title">
                  {I18n.t('common.metadata.licensing')}
                </h3>

                <table
                  className="table table-condensed table-borderless table-discrete table-striped">
                  <tbody>
                    <tr>
                      <td>{I18n.t('common.metadata.license')}</td>
                      {license}
                    </tr>

                    {attributionLink}
                  </tbody>
                </table>
              </div>

              <div className="metadata-table-toggle-group desktop">
                <a
                  className="metadata-table-toggle more"
                  tabIndex="0"
                  role="button"
                  onClick={this.toggleTable}
                  onKeyDown={handleInvokeKey(this.toggleTable)}>
                  {I18n.t('common.more')}
                </a>

                <a
                  className="metadata-table-toggle less"
                  tabIndex="0"
                  role="button"
                  onClick={this.toggleTable}
                  onKeyDown={handleInvokeKey(this.toggleTable)}>
                  {I18n.t('common.less')}
                </a>
              </div>

              <div className="metadata-table-toggle-group mobile">
                <button
                  className="btn btn-block btn-default metadata-table-toggle more mobile"
                  onClick={this.toggleTable}
                  onKeyDown={handleInvokeKey(this.toggleTable)}>
                  {I18n.t('common.more')}
                </button>

                <button
                  className="btn btn-block btn-default metadata-table-toggle less mobile"
                  onClick={this.toggleTable}
                  onKeyDown={handleInvokeKey(this.toggleTable)}>
                  {I18n.t('common.less')}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

MetadataTable.defaultProps = {
  localizeLink: _.identity
};

MetadataTable.propTypes = {
  onClickEditMetadata: PropTypes.func,
  onClickStats: PropTypes.func,
  onExpandMetadataTable: PropTypes.func,
  onExpandTags: PropTypes.func,
  renderWatchDatasetButton: PropTypes.func,

  // Optional function to let containing app add a locale prefix to links generated
  // by MetadataTable. There's no standardized way of doing this for common code,
  // so the easiest way for now is to externalize the concern.
  localizeLink: PropTypes.func,

  // Header content. If unspecified, uses a default header (with an edit button
  // going to editMetadataUrl).
  header: PropTypes.node,

  // Href for the Edit Metadata button.
  editMetadataUrl: PropTypes.string,

  // Href for the "view all statistics" link. Null to disable.
  statsUrl: PropTypes.string,

  // Disables the "contact dataset owner" button if set to true.
  disableContactDatasetOwner: PropTypes.bool,

  // A simple Core view metadata blob from /api/views/xxxx-yyyy.json
  // These PropTypes capture the fields actually used by the component.
  coreView: PropTypes.shape({
    tags: PropTypes.array,
    attribution: PropTypes.string,
    metadata: PropTypes.shape({
      attachments: PropTypes.array
    }),
    category: PropTypes.string,
    license: PropTypes.shape({
      name: PropTypes.string,
      logoUrl: PropTypes.string,
      termsLink: PropTypes.string
    }),
    attributionLink: PropTypes.string,
    viewType: PropTypes.string,

    rowsUpdatedAt: PropTypes.number,
    viewLastModified: PropTypes.number,
    createdAt: PropTypes.number,
    owner: PropTypes.shape({
      displayName: PropTypes.string
    }),
    viewCount: PropTypes.number,
    downloadCount: PropTypes.number
  }).isRequired

};

export default MetadataTable;
