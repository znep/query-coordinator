import _ from 'lodash';
import velocity from 'velocity-animate';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { getIconClassForDataType, getDocumentationLinkForDataType } from '../lib/dataTypeMetadata';
import { handleKeyPress } from '../lib/a11yHelpers';

var SCHEMA_TABLE_COLUMN_COUNT = 7;

export var SchemaPreview = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired,
    onExpandColumn: PropTypes.func.isRequired,
    onExpandSchemaTable: PropTypes.func.isRequired,
    showAsLayer: PropTypes.bool
  },

  toggleTable: function() {
    var { onExpandSchemaTable } = this.props;
    var el = ReactDOM.findDOMNode(this).querySelector('.section-content');
    var tableWrapper = el.querySelector('.table-wrapper');
    var wasCollapsed = el.classList.contains('collapsed');
    var originalScrollPosition = document.documentElement ?
      document.documentElement.scrollTop : // IE11
      document.body.scrollTop;

    // Calculate current height and the height we are going to animate to.
    var originalHeight = tableWrapper.getBoundingClientRect().height;
    el.classList.toggle('collapsed');
    var newHeight = tableWrapper.getBoundingClientRect().height;

    if (wasCollapsed) {
      onExpandSchemaTable();
    }

    // Here we expand the table if we are collapsing so the contents are visible while the
    // animation is playing.  We also reset the scroll position to the original position because
    // getBoundingClientRect was called while the table was collapsed which will reset the scroll
    // position of the window.
    if (!wasCollapsed) {
      el.classList.remove('collapsed');
      window.scrollTo(0, originalScrollPosition);
    }

    // Set the height to the original height and animate to the new height.
    tableWrapper.style.height = `${originalHeight}px`;
    velocity(tableWrapper, {
      height: newHeight
    }, function() {
      // Let the wrapper set its own height after the animation is finished.  This allows the
      // wrapper height to naturally adjust as the nested collapsibles are animating.
      tableWrapper.style.height = '';

      // If we just collapsed the table, hide the contents at the end of the animation.
      if (!wasCollapsed) {
        el.classList.add('collapsed');
      }
    });
  },

  toggleColumn: function(event) {
    var { onExpandColumn } = this.props;
    var el = ReactDOM.findDOMNode(this);
    var row = event.currentTarget;

    // Expand and collapse each row of the table when clicked.  There are two elements that are
    // simultaneously animated: the row itself (animated to show the full description), and the
    // "details" row that immediately follows the "summary" row in the DOM, containing more
    // information about the column.
    var columnId = row.dataset.column;

    // Animate the sister row
    var detailRow = el.querySelector(`.column-details[data-column="${columnId}"]`);
    if (detailRow) {
      var detailRowIsHidden = detailRow.style.display === 'none' || detailRow.style.display === '';
      var detailRowContents = detailRow.querySelector('.contents');

      if (detailRowIsHidden) {
        var originalRowHeight = 0;
        var targetRowHeight;
        var padding = 15;

        // Show the row
        detailRow.style.display = 'table-row';

        // Temporarily set height to auto to determine the height to animate to
        detailRowContents.style.height = 'auto';
        targetRowHeight = detailRowContents.getBoundingClientRect().height;
        detailRowContents.style.height = originalRowHeight;

        // Also animate padding due to the way <td>s work
        velocity(detailRowContents, {
          height: targetRowHeight + (2 * padding),
          paddingTop: padding,
          paddingBottom: padding
        });
        row.setAttribute('aria-expanded', true);

        // Dispatch Mixpanel tracking
        onExpandColumn(event);
      } else {
        velocity(detailRowContents, {
          height: 0,
          paddingTop: 0,
          paddingBottom: 0
        }, function() {
          detailRow.style.display = 'none';
          row.setAttribute('aria-expanded', false);
        });
      }
    }

    // Animate the description
    var description = row.querySelector('.column-description .contents');
    if (description) {
      if (description.classList.contains('clamped')) {
        var originalDescriptionHeight = description.getBoundingClientRect().height;
        var targetDescriptionHeight;

        // Keep track of current collapsed height for collapse animation.
        description.dataset.originalHeight = originalDescriptionHeight;

        // Remove ellipsification and determine target height
        description.classList.remove('clamped');
        description.style.height = 'auto';
        targetDescriptionHeight = description.getBoundingClientRect().height;

        // Set height to original and animate to target
        description.style.height = `${originalDescriptionHeight}px`;
        velocity(description, {
          height: targetDescriptionHeight
        }, function() {
          description.style.height = 'auto';
        });
        row.setAttribute('aria-expanded', true);
      } else {
        // Animate to collapsed height, ellipsify when done
        velocity(description, {
          height: description.dataset.originalHeight
        }, function() {
          description.classList.add('clamped');
          row.setAttribute('aria-expanded', false);
        });
      }
    }
  },

  render: function() {
    var { view, showAsLayer } = this.props;
    var toggleColumn = this.toggleColumn;

    var title;
    var toggles;
    var tableRows;

    if (_.isEmpty(view.columns) || view.rowCount === 0) {
      return null;
    }

    if (showAsLayer) {
      title = (
        <h3 className="landing-page-section-header">
          {I18n.schema_preview.geospatial_layer_title}
        </h3>
      );
    } else {
      title = (
        <h2 className="landing-page-section-header">
          {I18n.schema_preview.title}
        </h2>
      );
    }

    if (_.isArray(view.columns) && view.columns.length > SCHEMA_TABLE_COLUMN_COUNT) {
      toggles = (
        <div className="table-collapse-toggles">
          <a
            className="table-collapse-toggle more"
            tabIndex="0"
            role="button"
            onClick={this.toggleTable}
            onKeyDown={handleKeyPress(this.toggleTable)}>
            {I18n.schema_preview.show_all} ({view.columns.length})
          </a>

          <a
            className="table-collapse-toggle less"
            tabIndex="0"
            role="button"
            onClick={this.toggleTable}
            onKeyDown={handleKeyPress(this.toggleTable)}>
            {I18n.schema_preview.show_less}
          </a>
        </div>
      );
    }

    tableRows = _.map(view.columns, function(column) {
      var typeCell;

      if (column.dataTypeName) {
        typeCell = (
          <div>
            <span className="type-name" data-name={column.dataTypeName}>
              {I18n.data_types[column.dataTypeName]}
            </span>
            <span aria-hidden className={getIconClassForDataType(column.dataTypeName)}></span>
          </div>
        );
      }

      var documentationUrl = getDocumentationLinkForDataType(column.dataTypeName);
      var documentationText = I18n.schema_preview.data_types[column.dataTypeName];
      var documentationLink;

      if (documentationUrl) {
        documentationLink = <a href={documentationUrl} target="_blank">{documentationText}</a>;
      } else {
        documentationLink = documentationText;
      }

      return ([
        <tr
          className="column-summary"
          data-column={column.fieldName}
          aria-expanded="false"
          aria-haspopup="true"
          role="link"
          tabIndex="0"
          onClick={toggleColumn}
          onKeyDown={handleKeyPress(toggleColumn)}>
          <td className="column-name" scope="row">
            {column.name}
          </td>

          <td className="column-description">
            <div className="contents clamped">
              {column.description}
            </div>
          </td>

          <td className="column-type">
            {typeCell}
          </td>

          <td className="column-expand">
            <span className="icon-arrow-down"></span>
          </td>
        </tr>,

        <tr className="column-details" data-column={column.fieldName}>
          <td colSpan="4">
            <dl className="contents schema-detail-groups">
              <div className="schema-detail-group">
                <dt className="schema-detail-group-title">
                  {I18n.schema_preview.data_type}
                </dt>

                <dd className="schema-detail-group-value">
                  {documentationLink}
                </dd>
              </div>

              <div className="schema-detail-group">
                <dt className="schema-detail-group-title">
                  {I18n.schema_preview.api_field_name}
                </dt>

                <dd className="schema-detail-group-value">
                  {column.fieldName}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      ]);
    });

    return (
      <section className="landing-page-section schema-preview">
        {title}

        <div className="section-content collapsed">
          <div className="table-wrapper">
            <table className="table table-borderless table-condensed table-discrete schema-table">
              <thead>
                <tr>
                  <th scope="col" className="column-name">
                    {I18n.schema_preview.column_name}
                  </th>

                  <th scope="col" className="column-description">
                    {I18n.schema_preview.description}
                  </th>

                  <th scope="col" className="column-type">
                    {I18n.schema_preview.type}
                  </th>
                </tr>
              </thead>

              <tbody>
                {tableRows}
              </tbody>
            </table>
          </div>

          {toggles}
        </div>
      </section>
    );
  }
});

function mapDispatchToProps(dispatch) {
  return {
    onExpandColumn: function(event) {
      var row = $(event.target).closest('.column-summary');

      var payload = {
        name: 'Expanded Column Info',
        properties: {
          'Name': row.find('.column-name').text().trim(),
          'Type': _.upperFirst(row.find('.type-name').data('name'))
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandSchemaTable: function() {
      var payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Schema Preview Table'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(null, mapDispatchToProps)(SchemaPreview);
