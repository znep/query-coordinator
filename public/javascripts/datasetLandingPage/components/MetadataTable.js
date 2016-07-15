import _ from 'lodash';
import collapsible from '../collapsible';
import velocity from 'velocity-animate';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import Linkify from 'react-linkify';
import formatDate from '../lib/formatDate';
import utils from 'socrata-utils';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { handleKeyPress } from '../lib/a11yHelpers';
import { localizeLink } from '../lib/locale';

export var MetadataTable = React.createClass({
  propTypes: {
    onClickEditMetadata: PropTypes.func,
    onClickStats: PropTypes.func,
    onExpandMetadataTable: PropTypes.func,
    onExpandTags: PropTypes.func,
    view: PropTypes.object.isRequired
  },

  componentDidMount: function() {
    this.collapseTags();
    this.collapseTable();
    this.applyFirefoxHack();
  },

  // Legendary firefox hack, see https://bugzilla.mozilla.org/show_bug.cgi?id=1266901
  applyFirefoxHack: function() {
    var el = ReactDOM.findDOMNode(this);
    _.toArray(el.querySelectorAll('td.attachment a')).forEach(function(link) {
      link.style.display = 'none';
      link.offsetHeight; // eslint-disable-line no-unused-expressions
      link.style.display = '';
    });
  },

  collapseTags: function() {
    if (_.isEmpty(this.props.view.tags)) {
      return;
    }

    var el = ReactDOM.findDOMNode(this);

    collapsible(el.querySelector('.tag-list'), {
      height: 2 * 24,
      wrap: 'children',
      lastCharacter: {
        remove: [' ', ';', '.', '!', '?']
      },
      expandedCallback: this.props.onExpandTags
    });
  },

  collapseTable: function() {
    var el = ReactDOM.findDOMNode(this);
    var leftColumnHeight = el.querySelector('.metadata-column.fancy').offsetHeight;
    var tableColumn = el.querySelector('.metadata-column.tables');
    var tables = _.toArray(tableColumn.querySelectorAll('.metadata-table'));
    var shouldHideToggles = true;

    // Add a 'hidden' class to tables whose top is below the bottom of the left column.
    // These will be shown and hidden as the tableColumn is expanded and collapsed.
    tables.forEach(function(table) {
      if (table.offsetTop > leftColumnHeight) {
        table.classList.add('hidden');
        shouldHideToggles = false;
      }
    });

    // If there is not enough content in the tableColumn, hide the toggles and avoid
    // binding event handlers, as no collapsing is necessary.
    if (shouldHideToggles) {
      var toggleGroups = _.toArray(el.querySelectorAll('.metadata-table-toggle-group'));
      toggleGroups.forEach(function(group) {
        group.style.display = 'none';
      });

      tableColumn.classList.remove('collapsed');
      tableColumn.style.paddingBottom = 0;

      return;
    }
  },

  toggleTable: function(event) {
    event.preventDefault();

    var { onExpandMetadataTable } = this.props;
    var el = ReactDOM.findDOMNode(this);
    var tableColumn = el.querySelector('.metadata-column.tables');

    var wasCollapsed = tableColumn.classList.contains('collapsed');
    var originalHeight = tableColumn.getBoundingClientRect().height;
    tableColumn.classList.toggle('collapsed');
    var targetHeight = tableColumn.getBoundingClientRect().height;
    tableColumn.style.height = `${originalHeight}px`;

    if (wasCollapsed) {
      velocity(tableColumn, {
        height: targetHeight
      }, function() {
        tableColumn.style.height = '';
      });

      onExpandMetadataTable();
    } else {
      tableColumn.classList.remove('collapsed');

      tableColumn.style.height = `${originalHeight}px`;
      velocity(tableColumn, {
        height: targetHeight
      }, function() {
        tableColumn.style.height = '';
        tableColumn.classList.add('collapsed');
      });
    }
  },

  render: function() {
    var { view, onClickEditMetadata, onClickStats } = this.props;
    var { defaultToDatasetLandingPage } = window.serverConfig.featureFlags;

    var attachments;
    var attribution;
    var attributionLink;
    var category;
    var contactFormButton;
    var customMetadataFieldsets;
    var license;
    var tags;
    var statsSection;
    var editMetadata;

    contactFormButton = defaultToDatasetLandingPage ?
      <button
        className="btn btn-sm btn-primary btn-block contact-dataset-owner"
        data-modal="contact-form">
        {I18n.contact_dataset_owner}
      </button> :
      null;

    if (view.attribution) {
      attribution = (
        <dd className="metadata-detail-group-value">
          {view.attribution}
        </dd>
      );
    } else {
      attribution = (
        <dd className="metadata-detail-group-value empty">
          {I18n.metadata.no_value}
        </dd>
      );
    }

    if (!_.isEmpty(view.customMetadataFieldsets)) {
      customMetadataFieldsets = _.map(view.customMetadataFieldsets, function(fieldset, i) {
        var fields = _.map(fieldset.fields, function(field, j) {
          if (fieldset.existing_fields[field.name]) {
            return (
              <tr key={j}>
                <td>{field.displayName || field.name}</td>
                <td>
                  <Linkify properties={{ rel: 'nofollow', target: '_blank' }}>
                    {fieldset.existing_fields[field.name]}
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
      var attachmentRows = _.map(view.attachments, function(attachment, i) {
        return (
          <tr key={i}>
            <td className="attachment">
              <span className="icon-copy-document"></span>
              <span dangerouslySetInnerHTML={{ __html: attachment.link }}></span>
            </td>
          </tr>
        );
      });

      attachments = (
        <div>
          <h3 className="metadata-table-title">
            {I18n.metadata.attachments}
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
      category = <td className="empty">{I18n.metadata.no_category_value}</td>;
    }

    if (!_.isEmpty(view.tags)) {
      var tagLinks = _.map(view.tags, function(tag, i) {
        return (
          <span key={i}>
            <a href={localizeLink(`/browse?tags=${tag}`)}>{tag}</a>
            {i === view.tags.length - 1 ? '' : ', '}
          </span>
        );
      });

      tags = (
        <td>
          <div className="tag-list-container collapsible">
            <div className="tag-list">
              {tagLinks}

              <button className="collapse-toggle more">{I18n.more}</button>
              <button className="collapse-toggle less">{I18n.less}</button>
            </div>
          </div>
        </td>
      );
    } else {
      tags = <td className="empty">{I18n.metadata.no_tags_value}</td>;
    }

    if (view.licenseName) {
      license = <td>{view.licenseName}</td>;
    } else {
      license = <td className="empty">{I18n.metadata.no_license_value}</td>;
    }

    if (view.attributionLink) {
      attributionLink = (
        <tr>
          <td>{I18n.metadata.source_link}</td>
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
          <a className="metadata-detail-group-value" href={view.statsUrl} onClick={onClickStats}>
            {I18n.metadata.view_statistics}
          </a>
        </div>
      );
    }

    if (view.editMetadataUrl) {
      editMetadata = (
        <a
          href={view.editMetadataUrl}
          className="btn btn-sm btn-default"
          onClick={onClickEditMetadata}>
          {I18n.metadata.edit_metadata}
        </a>
      );
    }

    return (
      <section className="landing-page-section">
        <div className="landing-page-header-wrapper">
          <h2 className="landing-page-section-header">
            {I18n.metadata.title}
          </h2>
          {editMetadata}
        </div>

        <div className="section-content">
          <dl className="metadata-column fancy">
            <div className="metadata-section">
              <div className="metadata-row">
                <div className="metadata-pair">
                  <dt className="metadata-pair-key">
                    {I18n.updated}
                  </dt>

                  <dd className="metadata-pair-value">
                    {formatDate(view.lastUpdatedAt)}
                  </dd>
                </div>
              </div>

              <div className="metadata-row middle metadata-flex metadata-detail-groups">
                <div className="metadata-detail-group">
                  <dt className="metadata-detail-group-title">
                    {I18n.metadata.data_last_updated}
                  </dt>

                  <dd className="metadata-detail-group-value">
                    {formatDate(view.dataLastUpdatedAt)}
                  </dd>
                </div>

                <div className="metadata-detail-group">
                  <dt className="metadata-detail-group-title">
                    {I18n.metadata.metadata_last_updated}
                  </dt>

                  <dd className="metadata-detail-group-value">
                    {formatDate(view.metadataLastUpdatedAt)}
                  </dd>
                </div>
              </div>

              <div className="metadata-row metadata-detail-groups">
                <div className="metadata-detail-group">
                  <dt className="metadata-detail-group-title">
                    {I18n.metadata.creation_date}
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
                    {I18n.metadata.views}
                  </dt>

                  <dd className="metadata-pair-value">
                    {utils.formatNumber(view.viewCount)}
                  </dd>
                </div>

                <div className="metadata-pair">
                  <dt className="metadata-pair-key">
                    {I18n.metadata.downloads}
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
                    {I18n.metadata.data_provided_by}
                  </dt>
                  {attribution}
                </div>

                <div className="metadata-detail-group">
                  <dt className="metadata-detail-group-title">
                    {I18n.metadata.dataset_owner}
                  </dt>

                  <dd className="metadata-detail-group-value">
                    {view.ownerName}
                  </dd>
                </div>
              </div>

              {contactFormButton}
            </div>
          </dl>

          <div className="metadata-column tables collapsed">
            {customMetadataFieldsets}

            <div className="metadata-table">
              {attachments}
            </div>

            <div className="metadata-table">
              <h3 className="metadata-table-title">
                {I18n.metadata.topics}
              </h3>

              <table
                className="table table-condensed table-borderless table-discrete table-striped">
                <tbody>
                  <tr>
                    <td>{I18n.metadata.category}</td>
                    {category}
                  </tr>

                  <tr>
                    <td>{I18n.metadata.tags}</td>
                    {tags}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="metadata-table">
              <h3 className="metadata-table-title">
                {I18n.metadata.licensing}
              </h3>

              <table
                className="table table-condensed table-borderless table-discrete table-striped">
                <tbody>
                  <tr>
                    <td>{I18n.metadata.license}</td>
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
                {I18n.more}
              </a>

              <a
                className="metadata-table-toggle less"
                tabIndex="0"
                role="button"
                onClick={this.toggleTable}
                onKeyDown={handleKeyPress(this.toggleTable)}>
                {I18n.less}
              </a>
            </div>

            <div className="metadata-table-toggle-group mobile">
              <button
                className="btn btn-block btn-default metadata-table-toggle more mobile"
                onClick={this.toggleTable}
                onKeyDown={handleKeyPress(this.toggleTable)}>
                {I18n.more}
              </button>

              <button
                className="btn btn-block btn-default metadata-table-toggle less mobile"
                onClick={this.toggleTable}
                onKeyDown={handleKeyPress(this.toggleTable)}>
                {I18n.less}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickEditMetadata: function() {
      var payload = {
        name: 'Edited Metadata',
        properties: {
          'From Page': 'DSLP'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onClickStats: function() {
      var payload = {
        name: 'Viewed Dataset Statistics',
        properties: {
          'From Page': 'DSLP'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandTags: function() {
      var payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Tags'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandMetadataTable: function() {
      var payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Metadata Table'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataTable);
