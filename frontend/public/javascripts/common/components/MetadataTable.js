import _ from 'lodash';
import collapsible from '../collapsible';
import velocity from 'velocity-animate';
import React, { PropTypes, Component } from 'react';
import ReactDOM from 'react-dom';
import formatDate, { parseISO8601Date } from '../formatDate';
import utils from 'common/js_utils';
import { handleKeyPress } from '../a11yHelpers';
import { localizeLink } from '../locale';
import Linkify from 'react-linkify';
import moment from 'moment-timezone';

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
    if (_.isEmpty(this.props.viewlikeObject.tags)) {
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
    const { viewlikeObject } = this.props;
    const onClickEditMetadata = this.props.onClickEditMetadata || _.noop;

    if (viewlikeObject.editMetadataUrl) {
      editMetadata = (
        <a
          href={localizeLink(viewlikeObject.editMetadataUrl)}
          className="btn btn-sm btn-default btn-alternate-2"
          onClick={onClickEditMetadata}>
          {I18n.common.metadata.edit_metadata}
        </a>
      );
    }

    return (
      <div className="landing-page-header-wrapper">
        <h2 className="landing-page-section-header">
          {I18n.common.metadata.title}
        </h2>
        {editMetadata}
      </div>
    );
  }

  render() {
    const { viewlikeObject, customMetadataFieldsets } = this.props;
    const onClickStats = this.props.onClickStats || _.noop;

    if (!_.has(viewlikeObject, 'lastUpdatedAt')) {
      throw new Error('viewlikeObject property does not look like a viewlikeObject. If you are trying to use\
        a raw core view metadata object, look at coreViewToViewlikeObject');
    }

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

    const header = _.get(
      this.props,
      'header',
      this.renderHeader()
    );

    if (viewlikeObject.attribution) {
      attribution = (
        <dd className="metadata-detail-group-value">
          {viewlikeObject.attribution}
        </dd>
      );
    } else {
      attribution = (
        <dd className="metadata-detail-group-value empty">
          {I18n.common.metadata.no_value}
        </dd>
      );
    }

    if (!_.isEmpty(customMetadataFieldsets)) {
      const makeRows = (fields = {}) => {
        return _.map(fields, (value, name) => {
          if (_.isString(value) || _.isNumber(value)) {
            return (
              <tr key={name}>
                <td>{name}</td>
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

    if (!_.isEmpty(viewlikeObject.attachments)) {
      const attachmentRows = _.map(viewlikeObject.attachments, (attachment, i) => (
        <tr key={i}>
          <td className="attachment">
            <span className="icon-copy-document"></span>
            <span dangerouslySetInnerHTML={{ __html: attachment.link }}></span>
          </td>
        </tr>
      ));

      attachments = (
        <div>
          <h3 className="metadata-table-title">
            {I18n.common.metadata.attachments}
          </h3>
          <table className="table table-condensed table-borderless table-discrete table-striped">
            <tbody>
              {attachmentRows}
            </tbody>
          </table>
        </div>
      );
    }

    if (viewlikeObject.category) {
      category = <td>{_.upperFirst(viewlikeObject.category)}</td>;
    } else {
      category = <td className="empty">{I18n.common.metadata.no_category_value}</td>;
    }

    if (!_.isEmpty(viewlikeObject.tags)) {
      const tagLinks = _.map(viewlikeObject.tags, (tag, i) => (
        <span key={i}>
          <a href={localizeLink(`/browse?tags=${tag}`)}>{tag}</a>
          {i === viewlikeObject.tags.length - 1 ? '' : ', '}
        </span>
      ));

      tags = (
        <td>
          <div className="tag-list-container collapsible">
            <div className="tag-list">
              {tagLinks}

              <button className="collapse-toggle more">{I18n.common.more}</button>
              <button className="collapse-toggle less">{I18n.common.less}</button>
            </div>
          </div>
        </td>
      );
    } else {
      tags = <td className="empty">{I18n.common.metadata.no_tags_value}</td>;
    }

    if (viewlikeObject.licenseName) {
      if (viewlikeObject.licenseLogo) {
        license = <img src={`/${viewlikeObject.licenseLogo}`} alt={viewlikeObject.licenseName} className="license" />;
      } else {
        license = viewlikeObject.licenseName;
      }

      if (viewlikeObject.licenseLink) {
        license = <a href={viewlikeObject.licenseLink} target="_blank">{license}</a>;
      }

      license = <td>{license}</td>;
    } else {
      license = <td className="empty">{I18n.common.metadata.no_license_value}</td>;
    }

    if (viewlikeObject.attributionLink) {
      attributionLink = (
        <tr>
          <td>{I18n.common.metadata.source_link}</td>
          <td className="attribution">
            <a href={viewlikeObject.attributionLink} target="_blank" rel="nofollow external">
              {viewlikeObject.attributionLink}
              <span className="icon-external-square" />
            </a>
          </td>
        </tr>
      );
    }

    if (viewlikeObject.statsUrl) {
      statsSection = (
        <div className="metadata-row middle">
          <a
            className="metadata-detail-group-value"
            href={localizeLink(viewlikeObject.statsUrl)}
            onClick={onClickStats}>
            {I18n.common.metadata.view_statistics}
          </a>
        </div>
      );
    }

    if (!viewlikeObject.disableContactDatasetOwner) {
      contactDatasetOwner = (
        <button
          className="btn btn-sm btn-primary btn-block contact-dataset-owner"
          data-modal="contact-form">
          {I18n.common.contact_dataset_owner}
        </button>
      );
    }

    if (!viewlikeObject.isBlobby && !viewlikeObject.isHref) {
      dataLastUpdated = (
        <div className="metadata-detail-group">
          <dt className="metadata-detail-group-title">
            {I18n.common.metadata.data_last_updated}
          </dt>

          <dd className="metadata-detail-group-value">
            {formatDate(viewlikeObject.dataLastUpdatedAt)}
          </dd>
        </div>
      );
    }

    if (_.isFinite(viewlikeObject.downloadCount)) {
      downloads = (
        <div className="metadata-pair">
          <dt className="metadata-pair-key">
            {I18n.common.metadata.downloads}
          </dt>

          <dd className="metadata-pair-value">
            {utils.formatNumber(viewlikeObject.downloadCount)}
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
                      {I18n.common.updated}
                    </dt>

                    <dd className="metadata-pair-value">
                      {formatDate(viewlikeObject.lastUpdatedAt)}
                    </dd>
                  </div>
                </div>

                <div className="metadata-row middle metadata-flex metadata-detail-groups">
                  {dataLastUpdated}

                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.common.metadata.metadata_last_updated}
                    </dt>

                    <dd className="metadata-detail-group-value">
                      {formatDate(viewlikeObject.metadataLastUpdatedAt)}
                    </dd>
                  </div>
                </div>

                <div className="metadata-row metadata-detail-groups">
                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.common.metadata.creation_date}
                    </dt>

                    <dd className="metadata-detail-group-value">
                      {formatDate(viewlikeObject.createdAt)}
                    </dd>
                  </div>
                </div>
              </div>

              <hr aria-hidden />

              <div className="metadata-section">
                <div className="metadata-row metadata-flex">
                  <div className="metadata-pair">
                    <dt className="metadata-pair-key">
                      {I18n.common.metadata.views}
                    </dt>

                    <dd className="metadata-pair-value">
                      {utils.formatNumber(viewlikeObject.viewCount)}
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
                      {I18n.common.metadata.data_provided_by}
                    </dt>
                    {attribution}
                  </div>

                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.common.metadata.dataset_owner}
                    </dt>

                    <dd className="metadata-detail-group-value">
                      {viewlikeObject.ownerName}
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
                  {I18n.common.metadata.topics}
                </h3>

                <table
                  className="table table-condensed table-borderless table-discrete table-striped">
                  <tbody>
                    <tr>
                      <td>{I18n.common.metadata.category}</td>
                      {category}
                    </tr>

                    <tr>
                      <td>{I18n.common.metadata.tags}</td>
                      {tags}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="metadata-table">
                <h3 className="metadata-table-title">
                  {I18n.common.metadata.licensing}
                </h3>

                <table
                  className="table table-condensed table-borderless table-discrete table-striped">
                  <tbody>
                    <tr>
                      <td>{I18n.common.metadata.license}</td>
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
                  onKeyDown={handleKeyPress(this.toggleTable)}>
                  {I18n.common.more}
                </a>

                <a
                  className="metadata-table-toggle less"
                  tabIndex="0"
                  role="button"
                  onClick={this.toggleTable}
                  onKeyDown={handleKeyPress(this.toggleTable)}>
                  {I18n.common.less}
                </a>
              </div>

              <div className="metadata-table-toggle-group mobile">
                <button
                  className="btn btn-block btn-default metadata-table-toggle more mobile"
                  onClick={this.toggleTable}
                  onKeyDown={handleKeyPress(this.toggleTable)}>
                  {I18n.common.more}
                </button>

                <button
                  className="btn btn-block btn-default metadata-table-toggle less mobile"
                  onClick={this.toggleTable}
                  onKeyDown={handleKeyPress(this.toggleTable)}>
                  {I18n.common.less}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

// Converts a real core view (/api/views/xxxx-xxxx.json) to a form this component can understand.
// See comments in propTypes.
// If you want to override some fields (editMetadataUrl and statsUrl come to mind),
// pass a hash of fields as the "defaults" parameter.
export const coreViewToViewlikeObject = (coreView, defaults) => {
  const viewlikeObject = _.cloneDeep(coreView);
  const license = coreView.license || {};

  const toISO8601 = (date) => {
    const momentDate = _.isNumber(date) ? moment.unix(date) : parseISO8601Date(date);
    return momentDate.toISOString();
  };

  // Mirrors view.rb#time_last_updated_at
  const lastUpdatedAt = _([
    coreView.rowsUpdatedAt,
    coreView.createdAt,
    coreView.viewLastModified
  ]).compact().max();

  _.assign(viewlikeObject, {
    tags: coreView.tags,
    attribution: coreView.attribution,
    attributionLink: coreView.attributionLink || '',
    attachments: coreView.attachments, // MetadataTable transforms this
    licenseName: license.name,
    licenseLogo: license.logoUrl,
    licenseUrl: license.termsLink, // TODO consume?
    editMetadataUrl: `/d/${coreView.id}/edit_metadata`,
    statsUrl: null, // Tricky - need to do a permissions check first. See view.rb#can_see_stats?
    // Tricky - should be tied to CurrentDomain.feature?(:disable_contact_dataset_owner), but we have
    // no standard facility to check features in JS (as opposed to FeatureFlags).
    // Default to a safe value.
    disableContactDatasetOwner: true,
    lastUpdatedAt: toISO8601(lastUpdatedAt),
    dataLastUpdatedAt: toISO8601(coreView.rowsUpdatedAt), // Note the name change :/
    metadataLastUpdatedAt: toISO8601(coreView.viewLastModified), // Note the name change :/
    createdAt: toISO8601(coreView.createdAt),
    viewCount: coreView.viewCount,
    downloadCount: coreView.downloadCount,
    ownerName: coreView.owner.displayName
  }, defaults || {});

  return viewlikeObject;
};

MetadataTable.propTypes = {
  onClickEditMetadata: PropTypes.func,
  onClickStats: PropTypes.func,
  onExpandMetadataTable: PropTypes.func,
  onExpandTags: PropTypes.func,

  // Header content. If unspecified, uses a default header (with an edit button
  // going to viewlikeObject.editMetadataUrl).
  header: PropTypes.node,

  // This is a not-quite-core-view object that dates back to an early Primer implementation.
  // It's terrible, but an ecosystem (more like petri dish) has grown up around it. Unfortunately,
  // this object is a little sticky because it provides a little more information than what is
  // provided by a normal core view (some links, statsUrl, etc). This is also not the only
  // component which uses this viewlikeObject.
  //
  // If you're thinking "Dangit, I just wanna display a darn
  // table!" you're a) right to be miffed, and b) in luck: use
  // the included coreViewToViewlikeObject. If you have the time,
  // consider investing the time to refactor viewlikeObject straight
  // into the depths of the sea of fire from whence it came. You'll
  // have to address Primer, DatasetManagementUI, and OP Measures.
  viewlikeObject: PropTypes.shape({
    tags: PropTypes.array,
    attribution: PropTypes.string,
    attachments: PropTypes.array,
    category: PropTypes.string,
    licenseName: PropTypes.string,
    licenseUrl: PropTypes.string, // TODO consume?
    licenseLogo: PropTypes.string,
    attributionLink: PropTypes.string,
    statsUrl: PropTypes.string,
    editMetadataUrl: PropTypes.string,
    disableContactDatasetOwner: PropTypes.bool,
    isHref: PropTypes.bool,
    isBlobby: PropTypes.bool,

    // NOTE! These timestamps are ISO8601, which is gratuitously different from core
    // (which provides a UNIX timestamp). Sorry.
    dataLastUpdatedAt: PropTypes.string,
    lastUpdatedAt: PropTypes.string,
    metadataLastUpdatedAt: PropTypes.string,
    createdAt: PropTypes.string,

    ownerName: PropTypes.string,
    viewCount: PropTypes.number,
    downloadCount: PropTypes.number
  }).isRequired,

  customMetadataFieldsets: PropTypes.object
};

export default MetadataTable;
