import _ from 'lodash';
import collapsible from '../collapsible';
import velocity from 'velocity-animate';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import formatDate from '../lib/formatDate';
import utils from 'socrata-utils';

var contactFormData = window.contactFormData;

export var MetadataTable = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  componentDidMount: function() {
    this.collapseTags();
    this.collapseTable();
    this.applyFirefoxHack();
  },

  render: function() {
    var view = this.props.view;

    var attachments;
    var attribution;
    var attributionLink;
    var category;
    var contactFormButton;
    var customMetadataFieldsets;
    var license;
    var tags;

    // TODO: Remove this feature flag check once we've verified recaptcha 2.0 works as expected
    contactFormButton = contactFormData.contactFormEnabled ?
      <button className="btn btn-sm btn-primary btn-block contact-dataset-owner" data-modal="contact-modal">
        {I18n.contact_dataset_owner}
      </button> :
      null;

    if (view.attribution) {
      attribution = (
        <div className="metadata-detail-group-value">
          {view.attribution}
        </div>
      );
    } else {
      attribution = (
        <div className="metadata-detail-group-value empty">
          {I18n.metadata.no_value}
        </div>
      );
    }

    if (!_.isEmpty(view.customMetadataFieldsets)) {
      customMetadataFieldsets = _.map(view.customMetadataFieldsets, function(fieldset, i) {
        var fields = _.map(fieldset.fields, function(field, j) {
          return (
            <tr key={j}>
              <td>{field.displayName || field.name}</td>
              <td>
                {fieldset.existing_fields[field.name]}
              </td>
            </tr>
          );
        });

        return (
          <div key={i} className="metadata-table">
            <h5 className="metadata-table-title">
              {fieldset.name}
            </h5>

            <table className="table-condensed table-borderless table-discrete table-striped">
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
              <span dangerouslySetInnerHTML={{__html: attachment.link}}></span>
            </td>
          </tr>
        );
      });

      attachments = (
        <div>
          <h5 className="metadata-table-title">
            {I18n.metadata.attachments}
          </h5>
          <table className="table-condensed table-borderless table-discrete table-striped">
            <tbody>
              {attachmentRows}
            </tbody>
          </table>
        </div>
      );
    }

    if (view.category) {
      category = <td>{_.capitalize(view.category)}</td>;
    } else {
      category = <td className="empty">{I18n.metadata.no_value}</td>;
    }

    if (!_.isEmpty(view.tags)) {
      var tagLinks = _.map(view.tags, function(tag, i) {
        return (
          <span key={i}>
            <a href={`/browse?tags=${tag}`}>{tag}</a>
            {i === view.tags.length - 1 ? '' : ', '}
          </span>
        );
      });

      tags = (
        <td>
          <div className="tag-list-container collapsible">
            <div className="tag-list">
              {tagLinks}

              <a className="collapse-toggle more">{I18n.more}</a>
              <a className="collapse-toggle less">{I18n.less}</a>
            </div>
          </div>
        </td>
      );
    } else {
      tags = <td className="empty">{I18n.metadata.no_value}</td>;
    }

    if (view.licenseName) {
      license = <td>{view.licenseName}</td>;
    } else {
      license = <td className="empty">{I18n.metadata.no_value}</td>;
    }

    if (view.attributionLink) {
      attributionLink = (
        <td>
          <a href={view.attributionLink}>{view.attributionLink}</a>
        </td>
      );
    } else {
      attributionLink = <td className="empty">{I18n.metadata.no_value}</td>;
    }

    return (
      <section className="landing-page-section">
        <h2 className="landing-page-section-header">
          {I18n.metadata.title}
        </h2>

        <div className="section-content">
          <div className="metadata-column fancy">
            <div className="metadata-section">
              <div className="metadata-row">
                <div className="metadata-pair">
                  <span className="metadata-pair-key">
                    {I18n.updated}
                  </span>

                  <h3 className="metadata-pair-value">
                    {formatDate(view.lastUpdatedAt)}
                  </h3>
                </div>
              </div>

              <div className="metadata-row middle metadata-flex metadata-detail-groups">
                <div className="metadata-detail-group">
                  <div className="metadata-detail-group-title">
                    {I18n.metadata.data_last_updated}
                  </div>

                  <div className="metadata-detail-group-value">
                    {formatDate(view.dataLastUpdatedAt)}
                  </div>
                </div>

                <div className="metadata-detail-group">
                  <div className="metadata-detail-group-title">
                    {I18n.metadata.metadata_last_updated}
                  </div>

                  <div className="metadata-detail-group-value">
                    {formatDate(view.metadataLastUpdatedAt)}
                  </div>
                </div>
              </div>

              <div className="metadata-row metadata-detail-groups">
                <div className="metadata-detail-group">
                  <div className="metadata-detail-group-title">
                    {I18n.metadata.creation_date}
                  </div>

                  <div className="metadata-detail-group-value">
                    {formatDate(view.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className="metadata-section">
              <div className="metadata-row metadata-flex">
                <div className="metadata-pair">
                  <span className="metadata-pair-key">
                    {I18n.metadata.views}
                  </span>

                  <h3 className="metadata-pair-value">
                    {utils.formatNumber(view.viewCount)}
                  </h3>
                </div>

                <div className="metadata-pair">
                  <span className="metadata-pair-key">
                    {I18n.metadata.downloads}
                  </span>

                  <h3 className="metadata-pair-value">
                    {utils.formatNumber(view.downloadCount)}
                  </h3>
                </div>
              </div>
            </div>

            <hr />

            <div className="metadata-section">
              <div className="metadata-row metadata-flex metadata-detail-groups">
                <div className="metadata-detail-group">
                  <div className="metadata-detail-group-title">
                    {I18n.metadata.data_provided_by}
                  </div>
                  {attribution}
                </div>

                <div className="metadata-detail-group">
                  <div className="metadata-detail-group-title">
                    {I18n.metadata.dataset_owner}
                  </div>

                  <div className="metadata-detail-group-value">
                    {view.ownerName}
                  </div>
                </div>
              </div>

              {contactFormButton}
            </div>
          </div>

          <div className="metadata-column tables collapsed">
            {customMetadataFieldsets}

            <div className="metadata-table">
              {attachments}
            </div>

            <div className="metadata-table">
              <h5 className="metadata-table-title">
                {I18n.metadata.topics}
              </h5>

              <table className="table-condensed table-borderless table-discrete table-striped">
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
              <h5 className="metadata-table-title">
                {I18n.metadata.licensing}
              </h5>

              <table className="table-condensed table-borderless table-discrete table-striped">
                <tbody>
                  <tr>
                    <td>{I18n.metadata.license}</td>
                    {license}
                  </tr>

                  <tr>
                    <td>{I18n.metadata.source_link}</td>
                    {attributionLink}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="metadata-table-toggle-group desktop">
              <a className="metadata-table-toggle more">
                {I18n.more}
              </a>

              <a className="metadata-table-toggle less">
                {I18n.less}
              </a>
            </div>

            <div className="metadata-table-toggle-group mobile">
              <button className="btn btn-block btn-default metadata-table-toggle more mobile">
                {I18n.more}
              </button>

              <button className="btn btn-block btn-default metadata-table-toggle less mobile">
                {I18n.less}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
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
        remove: [ ' ', ';', '.', '!', '?' ]
      }
    });
  },

  collapseTable: function() {
    var el = ReactDOM.findDOMNode(this);
    var leftColumnHeight = el.querySelector('.metadata-column.fancy').offsetHeight;
    var tableColumn = el.querySelector('.metadata-column.tables');
    var tables = Array.prototype.slice.call(tableColumn.querySelectorAll('.metadata-table'));
    var shouldHideToggles = true;

    // Add a 'hidden' class to tables whose top is below the bottom of the left column.  These will be
    // shown and hidden as the tableColumn is expanded and collapsed.
    tables.forEach(function(table) {
      if (table.offsetTop > leftColumnHeight) {
        table.classList.add('hidden');
        shouldHideToggles = false;
      }
    });

    var columnToggles = Array.prototype.slice.call(el.querySelectorAll('.metadata-table-toggle'));

    // If there is not enough content in the tableColumn, hide the toggles and avoid binding event
    // handlers, as no collapsing is necessary.
    if (shouldHideToggles) {
      var toggleGroups = Array.prototype.slice.call(el.querySelectorAll('.metadata-table-toggle-group'));
      toggleGroups.forEach(function(group) {
        group.style.display = 'none';
      });

      tableColumn.classList.remove('collapsed');
      tableColumn.style.paddingBottom = 0;

      return;
    }

    columnToggles.forEach(function(toggle) {
      toggle.addEventListener('click', function(event) {
        event.preventDefault();

        var wasCollapsed = tableColumn.classList.contains('collapsed');
        var originalHeight = tableColumn.getBoundingClientRect().height;
        tableColumn.classList.toggle('collapsed');
        var targetHeight = tableColumn.getBoundingClientRect().height;
        tableColumn.style.height = originalHeight + 'px';

        if (wasCollapsed) {
          velocity(tableColumn, {
            height: targetHeight
          }, function() {
            tableColumn.style.height = '';
          });
        } else {
          tableColumn.classList.remove('collapsed');

          tableColumn.style.height = originalHeight + 'px';
          velocity(tableColumn, {
            height: targetHeight
          }, function() {
            tableColumn.style.height = '';
            tableColumn.classList.add('collapsed');
          });
        }
      });
    });
  },

  // Legendary firefox hack, see https://bugzilla.mozilla.org/show_bug.cgi?id=1266901
  applyFirefoxHack: function() {
    var el = ReactDOM.findDOMNode(this);
    Array.prototype.slice.call(el.querySelectorAll('td.attachment a')).forEach(function(link) {
      link.style.display = 'none';
      link.offsetHeight;
      link.style.display = '';
    });
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(MetadataTable);
