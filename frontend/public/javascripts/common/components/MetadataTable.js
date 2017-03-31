import _ from 'lodash';
import collapsible from '../collapsible';
import velocity from 'velocity-animate';
import React, { PropTypes, Component } from 'react';
import ReactDOM from 'react-dom';
import formatDate from '../formatDate';
import utils from 'common/js_utils';
import { handleKeyPress } from '../a11yHelpers';
import { localizeLink } from '../locale';
import Linkify from 'react-linkify';

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
    if (_.isEmpty(this.props.view.tags)) {
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

  render() {
    const view = this.props.view;
    const onClickEditMetadata = this.props.onClickEditMetadata || _.noop;
    const onClickStats = this.props.onClickStats || _.noop;

    let attribution;
    let customMetadataFieldsets;
    let attachments;
    let category;
    let tags;
    let license;
    let attributionLink;
    let statsSection;
    let editMetadata;
    let contactDatasetOwner;
    let dataLastUpdated;

    if (view.attribution) {
      attribution = (
        <dd className="metadata-detail-group-value">
          {view.attribution}
        </dd>
      );
    } else {
      attribution = (
        <dd className="metadata-detail-group-value empty">
          {I18n.common.metadata.no_value}
        </dd>
      );
    }

    if (!_.isEmpty(view.customMetadataFieldsets)) {
      customMetadataFieldsets = _.map(view.customMetadataFieldsets, (fieldset, i) => {
        const fields = _.map(fieldset.fields, (field, j) => {
          const existingField = fieldset.existing_fields[field.name];
          if (_.isString(existingField) || _.isNumber(existingField)) {
            return (
              <tr key={j}>
                <td>{field.displayName || field.name}</td>
                <td>
                  <Linkify properties={{ rel: 'nofollow', target: '_blank' }}>
                    {existingField}
                  </Linkify>
                </td>
              </tr>
            );
          } else {
            return null;
          }
        });

        return (
          <div key={i} className="metadata-table">
            <h3 className="metadata-table-title">
              {fieldset.name}
            </h3>

            <table className="table table-condensed table-borderless table-discrete table-striped">
              <tbody>
                {fields}
              </tbody>
            </table>
          </div>
        );
      });
    }

    if (!_.isEmpty(view.attachments)) {
      const attachmentRows = _.map(view.attachments, (attachment, i) => (
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

    if (view.category) {
      category = <td>{_.upperFirst(view.category)}</td>;
    } else {
      category = <td className="empty">{I18n.common.metadata.no_category_value}</td>;
    }

    if (!_.isEmpty(view.tags)) {
      const tagLinks = _.map(view.tags, (tag, i) => (
        <span key={i}>
          <a href={localizeLink(`/browse?tags=${tag}`)}>{tag}</a>
          {i === view.tags.length - 1 ? '' : ', '}
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

    if (view.licenseName) {
      if (view.licenseLogo) {
        license = <img src={`/${view.licenseLogo}`} alt={view.licenseName} className="license" />;
      } else {
        license = view.licenseName;
      }

      if (view.licenseLink) {
        license = <a href={view.licenseLink} target="_blank">{license}</a>;
      }

      license = <td>{license}</td>;
    } else {
      license = <td className="empty">{I18n.common.metadata.no_license_value}</td>;
    }

    if (view.attributionLink) {
      attributionLink = (
        <tr>
          <td>{I18n.common.metadata.source_link}</td>
          <td className="attribution">
            <a href={view.attributionLink} target="_blank" rel="nofollow external">
              {view.attributionLink}
              <span className="icon-external-square" />
            </a>
          </td>
        </tr>
      );
    }

    if (view.statsUrl) {
      statsSection = (
        <div className="metadata-row middle">
          <a
            className="metadata-detail-group-value"
            href={localizeLink(view.statsUrl)}
            onClick={onClickStats}>
            {I18n.common.metadata.view_statistics}
          </a>
        </div>
      );
    }

    if (view.editMetadataUrl) {
      editMetadata = (
        <a
          href={localizeLink(view.editMetadataUrl)}
          className="btn btn-sm btn-default btn-alternate-2"
          onClick={onClickEditMetadata}>
          {I18n.common.metadata.edit_metadata}
        </a>
      );
    }

    if (!view.disableContactDatasetOwner) {
      contactDatasetOwner = (
        <button
          className="btn btn-sm btn-primary btn-block contact-dataset-owner"
          data-modal="contact-form">
          {I18n.common.contact_dataset_owner}
        </button>
      );
    }

    if (!view.isBlobby && !view.isHref) {
      dataLastUpdated = (
        <div className="metadata-detail-group">
          <dt className="metadata-detail-group-title">
            {I18n.common.metadata.data_last_updated}
          </dt>

          <dd className="metadata-detail-group-value">
            {formatDate(view.dataLastUpdatedAt)}
          </dd>
        </div>
      );
    }

    return (
      <div className="metadata-table-wrapper">
        <section className="landing-page-section">
          <div className="landing-page-header-wrapper">
            <h2 className="landing-page-section-header">
              {I18n.common.metadata.title}
            </h2>
            {editMetadata}
          </div>

          <div className="section-content">
            <dl className="metadata-column fancy">
              <div className="metadata-section">
                <div className="metadata-row">
                  <div className="metadata-pair">
                    <dt className="metadata-pair-key">
                      {I18n.common.updated}
                    </dt>

                    <dd className="metadata-pair-value">
                      {formatDate(view.lastUpdatedAt)}
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
                      {formatDate(view.metadataLastUpdatedAt)}
                    </dd>
                  </div>
                </div>

                <div className="metadata-row metadata-detail-groups">
                  <div className="metadata-detail-group">
                    <dt className="metadata-detail-group-title">
                      {I18n.common.metadata.creation_date}
                    </dt>

                    <dd className="metadata-detail-group-value">
                      {formatDate(view.createdAt)}
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
                      {utils.formatNumber(view.viewCount)}
                    </dd>
                  </div>

                  <div className="metadata-pair">
                    <dt className="metadata-pair-key">
                      {I18n.common.metadata.downloads}
                    </dt>

                    <dd className="metadata-pair-value">
                      {utils.formatNumber(view.downloadCount)}
                    </dd>
                  </div>
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
                      {view.ownerName}
                    </dd>
                  </div>
                </div>
                {contactDatasetOwner}
              </div>
            </dl>

            <div className="metadata-column tables collapsed">
              {customMetadataFieldsets}

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

MetadataTable.propTypes = {
  onClickEditMetadata: PropTypes.func,
  onClickStats: PropTypes.func,
  onExpandMetadataTable: PropTypes.func,
  onExpandTags: PropTypes.func,
  view: PropTypes.object.isRequired
};

export default MetadataTable;
