import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { factories, Dropdown } from 'common/components';
import I18n from 'common/i18n';

import { COLUMN_TYPES } from '../constants';

import {
  addBasemapFlyoutColumn,
  removeBasemapFlyoutColumn,
  setAdditionalFlyoutColumns
} from '../actions';
import { getAdditionalFlyoutColumns } from '../selectors/vifAuthoring';
import { hasData, getDisplayableColumns } from '../selectors/metadata';

const scope = 'shared.visualizations.panes.legends_and_flyouts.fields.additional_flyout_values';

export class ColumnSelector extends Component {
  constructor(props) {
    super(props);

    this.state = { isColumnPending:  false };
  }

  componentDidUpdate() {
    if (this.selector) {
      new factories.FlyoutFactory(this.selector);
    }
  }

  getListItemKey(relativeIndex) {
    return `${this.props.listItemKeyPrefix}:${relativeIndex}`;
  }

  handleOnClickAddColumn() {
    this.setState({ isColumnPending: true });
  }

  handleOnClickDeleteColumn(relativeIndex) {
    const { onRemoveColumnSelector } = this.props;

    onRemoveColumnSelector(relativeIndex);
  }

  handleOnClickDeletePendingColumn() {
    this.setState({ isColumnPending: false });
  }

  handleOnSelectionColumn(relativeIndex, option) {
    const { onSetColumn } = this.props;

    onSetColumn(relativeIndex, option.value);
  }

  handleOnSelectionPendingColumn(option) {
    const { onAddColumnSelector } = this.props;

    onAddColumnSelector(option.value);
    this.setState({ isColumnPending: false });
  }

  renderColumnSelectors() {
    const { metadata, vifAuthoring } = this.props;
    const { isColumnPending } = this.state;
    const additionalFlyoutColumns = getAdditionalFlyoutColumns(vifAuthoring);
    const displayableColumns = getDisplayableColumns(metadata);
    const options = displayableColumns.map((column) => ({
      title: column.name,
      value: column.fieldName,
      type: column.renderTypeName,
      render: this.renderColumnOption
    }));
    const columnSelectors = additionalFlyoutColumns.map((columnName, columnIndex) => {
      return this.renderColumnSelector(columnIndex, options, columnName);
    });
    const relativeIndex = columnSelectors.length;
    const pendingColumnSelector = isColumnPending ?
      this.renderPendingColumnSelector(options, relativeIndex) :
      null;
    const addColumnLink = this.renderAddColumnLink();

    return (
      <div id="column-selectors-container">
        <ul className="dropdowns-list">
          {columnSelectors}
          {pendingColumnSelector}
        </ul>
        {addColumnLink}
      </div>
    );
  }

  renderPendingColumnSelector(options, relativeIndex) {
    const { vifAuthoring, metadata } = this.props;
    const columnListItemAttributes = {
      className: 'list-item',
      key: this.getListItemKey(relativeIndex)
    };
    const disabled = options.length === 0;
    const columnAttributes = {
      disabled,
      id: `column-selection-${relativeIndex}`,
      onSelection: (option) => this.handleOnSelectionPendingColumn(option),
      options,
      placeholder: I18n.translate('select_column', { scope })
    };
    const attributes = {
      className: 'delete-link',
      onClick: () => { this.handleOnClickDeletePendingColumn(); }
    };
    const deleteColumnLink = this.renderDeleteColumnLink(attributes);

    return (
      <li {...columnListItemAttributes}>
        <div className="primary-dropdown-container">
          <Dropdown {...columnAttributes} />
        </div>
        {deleteColumnLink}
      </li>
    );
  }

  renderColumnSelector(relativeIndex, options, value) {
    const { shouldRenderDeleteColumnLink, vifAuthoring, metadata } = this.props;
    const columnListItemAttributes = {
      className: 'list-item',
      key: this.getListItemKey(relativeIndex)
    };
    const disabled = options.length === 0;
    const columnAttributes = {
      disabled,
      id: `column-selection-${relativeIndex}`,
      onSelection: (option) => {
        this.handleOnSelectionColumn(relativeIndex, option);
      },
      options,
      value
    };
    let deleteColumnLink = null;

    if (shouldRenderDeleteColumnLink) {
      const attributes = {
        className: 'delete-link',
        id: `column-delete-link-${relativeIndex}`,
        onClick: () => { this.handleOnClickDeleteColumn(relativeIndex); }
      };

      deleteColumnLink = this.renderDeleteColumnLink(attributes);
    }

    return (
      <li {...columnListItemAttributes}>
        <div className="primary-dropdown-container">
          <Dropdown {...columnAttributes} />
        </div>
        {deleteColumnLink}
      </li>
    );
  }

  renderColumnOption(option) {
    const columnType = _.find(COLUMN_TYPES, { type: option.type });
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  }

  renderDeleteColumnLink(attributes) {
    return (
      <div
        className="delete-link-container"
        aria-label={I18n.translate('remove_flyout_value', { scope })}>
        <a {...attributes}>
          <span className="socrata-icon-close" role="presentation" />
        </a>
      </div>
    );
  }

  renderAddColumnLink() {
    const { shouldRenderAddColumnLink, vifAuthoring } = this.props;
    const { isColumnPending } = this.state;
    const addFlyoutLinkAttributes = {
      id: 'column-add-flyout-link',
      className: isColumnPending ? 'disabled' : null,
      onClick: isColumnPending ? null : () => { this.handleOnClickAddColumn(); }
    };

    return shouldRenderAddColumnLink ? (
      <div className="add-link-container">
        <a {...addFlyoutLinkAttributes}>
          <span className="socrata-icon-add" />
          {I18n.translate('add_flyout_value', { scope })}
        </a>
      </div>
    ) : null;
  }

  render() {
    const { metadata } = this.props;

    return hasData(metadata) ? this.renderColumnSelectors() : null;
  }
}

ColumnSelector.propTypes = {
  listItemKeyPrefix: PropTypes.string.isRequired,
  shouldRenderAddColumnLink: PropTypes.bool,
  shouldRenderDeleteColumnLink: PropTypes.bool
};

ColumnSelector.defaultProps = {
  shouldRenderAddColumnLink: true,
  shouldRenderDeleteColumnLink: true
};

function mapDispatchToProps(dispatch) {
  return {
    onAddColumnSelector(columnName) {
      dispatch(addBasemapFlyoutColumn(columnName));
    },

    onRemoveColumnSelector(relativeIndex) {
      dispatch(removeBasemapFlyoutColumn(relativeIndex));
    },

    onSetColumn(relativeIndex, columnName) {
      dispatch(setAdditionalFlyoutColumns(columnName, relativeIndex));
    }
  };
}

function mapStateToProps(state) {
  return _.pick(state, ['metadata', 'vifAuthoring']);
}

export default connect(mapStateToProps, mapDispatchToProps)(ColumnSelector);
