import _ from 'lodash';
import velocity from 'velocity-animate';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { getIconClassForDataType, getDocumentationLinkForDataType } from '../dataTypeMetadata';
import { handleKeyPress } from '../a11yHelpers';
import Linkify from 'react-linkify';  // eslint-disable-line no-unused-vars

const SCHEMA_TABLE_COLUMN_COUNT = 7;

export class SchemaPreview extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'toggleTable', 'toggleColumn');
  }

  toggleTable() {
    const { onExpandSchemaTable } = this.props;
    const el = ReactDOM.findDOMNode(this).querySelector('.section-content');
    const tableWrapper = el.querySelector('.table-wrapper');
    const wasCollapsed = el.classList.contains('collapsed');
    const originalScrollPosition = window.pageYOffset;

    // Calculate current height and the height we are going to animate to.
    const originalHeight = tableWrapper.getBoundingClientRect().height;
    el.classList.toggle('collapsed');
    const newHeight = tableWrapper.getBoundingClientRect().height;

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
    }, () => {
      // Let the wrapper set its own height after the animation is finished.  This allows the
      // wrapper height to naturally adjust as the nested collapsibles are animating.
      tableWrapper.style.height = '';

      // If we just collapsed the table, hide the contents at the end of the animation.
      if (!wasCollapsed) {
        el.classList.add('collapsed');
      }
    });
  }

  toggleColumn(event) {
    if (event.target.tagName === 'A') {
      return;
    }

    const { onExpandColumn } = this.props;
    const el = ReactDOM.findDOMNode(this);
    const row = event.currentTarget;

    // Expand and collapse each row of the table when clicked.  There are two elements that are
    // simultaneously animated: the row itself (animated to show the full description), and the
    // "details" row that immediately follows the "summary" row in the DOM, containing more
    // information about the column.
    const columnId = row.dataset.column;

    // Animate the sister row
    const detailRow = el.querySelector(`.column-details[data-column="${columnId}"]`);
    if (detailRow) {
      const detailRowIsHidden = detailRow.style.display === 'none' ||
        detailRow.style.display === '';

      const detailRowContents = detailRow.querySelector('.contents');

      if (detailRowIsHidden) {
        const originalRowHeight = 0;
        const padding = 15;

        // Show the row
        detailRow.style.display = 'table-row';

        // Temporarily set height to auto to determine the height to animate to
        detailRowContents.style.height = 'auto';
        const targetRowHeight = detailRowContents.getBoundingClientRect().height;
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
        }, () => {
          detailRow.style.display = 'none';
          row.setAttribute('aria-expanded', false);
        });
      }
    }

    // Animate the description
    const description = row.querySelector('.column-description .contents');
    if (description) {
      if (description.classList.contains('clamped')) {
        const originalDescriptionHeight = description.getBoundingClientRect().height;

        // Keep track of current collapsed height for collapse animation.
        description.dataset.originalHeight = originalDescriptionHeight;

        // Remove ellipsification and determine target height
        description.classList.remove('clamped');
        description.style.height = 'auto';
        const targetDescriptionHeight = description.getBoundingClientRect().height;

        // Set height to original and animate to target
        description.style.height = `${originalDescriptionHeight}px`;
        velocity(description, {
          height: targetDescriptionHeight
        }, () => {
          description.style.height = 'auto';
        });
        row.setAttribute('aria-expanded', true);
      } else {
        // Animate to collapsed height, ellipsify when done
        velocity(description, {
          height: description.dataset.originalHeight
        }, () => {
          description.classList.add('clamped');
          row.setAttribute('aria-expanded', false);
        });
      }
    }
  }

  render() {
    const { columns, headerButton } = this.props;
    const toggleColumn = this.toggleColumn;

    let toggles;
    let tableRows;

    if (_.isEmpty(columns)) {
      return null;
    }

    if (_.isArray(columns) && columns.length > SCHEMA_TABLE_COLUMN_COUNT) {
      toggles = (
        <div className="table-collapse-toggles">
          <a
            className="table-collapse-toggle more"
            tabIndex="0"
            role="button"
            onClick={this.toggleTable}
            onKeyDown={handleKeyPress(this.toggleTable)}>
            {I18n.common.schema_preview.show_all} ({columns.length})
          </a>

          <a
            className="table-collapse-toggle less"
            tabIndex="0"
            role="button"
            onClick={this.toggleTable}
            onKeyDown={handleKeyPress(this.toggleTable)}>
            {I18n.common.schema_preview.show_less}
          </a>
        </div>
      );
    }

    tableRows = _.map(columns, (column) => {
      let typeCell;

      if (column.dataTypeName) {
        typeCell = (
          <div>
            <span aria-hidden className={getIconClassForDataType(column.dataTypeName)}></span>
            <span className="type-name" data-name={column.dataTypeName}>
              {I18n.data_types[column.dataTypeName]}
            </span>
          </div>
        );
      }

      const documentationUrl = getDocumentationLinkForDataType(column.dataTypeName);
      const documentationText = I18n.common.schema_preview.data_types[column.dataTypeName];
      let documentationLink;

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
              <Linkify properties={{ rel: 'nofollow', target: '_blank' }}>
                {column.description}
              </Linkify>
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
                  {I18n.common.schema_preview.data_type}
                </dt>

                <dd className="schema-detail-group-value">
                  {documentationLink}
                </dd>
              </div>

              <div className="schema-detail-group">
                <dt className="schema-detail-group-title">
                  {I18n.common.schema_preview.api_field_name}
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
        <h2 className="landing-page-section-header">
          {I18n.common.schema_preview.title}
        </h2>

        {headerButton}

        <div className="section-content collapsed">
          <div className="table-wrapper">
            <table className="table table-borderless table-condensed table-discrete schema-table">
              <thead>
                <tr>
                  <th scope="col" className="column-name">
                    {I18n.common.schema_preview.column_name}
                  </th>

                  <th scope="col" className="column-description">
                    {I18n.common.schema_preview.description}
                  </th>

                  <th scope="col" className="column-type">
                    {I18n.common.schema_preview.type}
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
}

SchemaPreview.propTypes = {
  columns: PropTypes.array.isRequired,
  onExpandColumn: PropTypes.func.isRequired,
  onExpandSchemaTable: PropTypes.func.isRequired,
  headerButton: PropTypes.element
};

export default SchemaPreview;
