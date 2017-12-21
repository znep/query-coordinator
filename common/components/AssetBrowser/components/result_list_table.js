import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { changeSortOrder } from '../actions/sort_order';
import I18n from 'common/i18n';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import ResultListRow from './result_list_row';

export class ResultListTable extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onColumnHeaderClick',
      'resultListRowProps'
    ]);
  }

  onColumnHeaderClick(columnName) {
    // Sorting on the following columns is not supported by Cetera
    if (!_.includes(['actions', 'status', 'visibility'], columnName)) {
      this.props.changeSortOrder(columnName);
    }
  }

  resultListRowProps(result) {
    return _.merge(
      {
        approvals: result.metadata.approvals,
        category: result.classification.domain_category,
        datalensStatus: result.metadata.datalens_status,
        grants: result.metadata.grants,
        isDatalensApproved: result.metadata.is_datalens_approved,
        isExplicitlyHidden: result.metadata.is_hidden,
        isModerationApproved: result.metadata.is_moderation_approved,
        isOwner: result.owner.id === _.get(window.socrata, 'currentUser.id'),
        isPublic: result.metadata.is_public,
        isPublished: result.metadata.is_published,
        isRoutingApproved: result.metadata.is_routing_approved,
        link: result.link,
        moderationStatus: result.metadata.moderation_status,
        ownerName: result.owner.display_name,
        routingStatus: result.metadata.routing_status,
        uid: result.resource.id,
        visibleToAnonymous: result.metadata.visible_to_anonymous
      },
      _.pick(result.resource, ['description', 'name', 'provenance', 'type', 'updatedAt'])
    );
  }

  render() {
    const { actionElement, columns, order, results } = this.props;

    const columnHeaderProps = (columnName) => {
      const columnIsActive = columnName === _.get(order, 'value');

      return {
        className: classNames(_.kebabCase(columnName), {
          active: columnIsActive,
          ascending: columnIsActive && _.get(order, 'ascending'),
          descending: columnIsActive && !_.get(order, 'ascending')
        }),
        key: columnName,
        onClick: () => this.onColumnHeaderClick(columnName),
        onKeyDown: handleEnter(() => this.onColumnHeaderClick(columnName)),
        scope: 'col',
        tabIndex: 0
      };
    };

    const columnTranslation = (key) => I18n.t(
      `shared.asset_browser.result_list_table.columns.${_.snakeCase(key)}`
    );

    const tableHeader = (
      <thead>
        <tr>
          {columns.map((columnName) => (
            <th {...columnHeaderProps(columnName)}>
              <span className="column-name">{columnTranslation(columnName)}</span>
              <span className="ascending-arrow socrata-icon-arrow-up2" />
              <span className="descending-arrow socrata-icon-arrow-down2" />
            </th>
          ))}
        </tr>
      </thead>
    );

    const tableBody = (
      <tbody>
        {results.map((result) =>
          <ResultListRow
            {...this.resultListRowProps(result)}
            actionElement={actionElement}
            key={result.resource.id} />
        )}
      </tbody>
    );

    const tableClassNames = classNames('result-list-table table table-discrete table-condensed', {
      'table-borderless': !this.props.bordered
    });

    return (
      <table className={tableClassNames}>
        {tableHeader}
        {tableBody}
      </table>
    );
  }
}

ResultListTable.propTypes = {
  actionElement: PropTypes.func,
  bordered: PropTypes.bool,
  changeSortOrder: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  order: PropTypes.object,
  results: PropTypes.array.isRequired
};

ResultListTable.defaultProps = {
  bordered: false,
  order: undefined
};

const mapStateToProps = state => ({
  columns: state.assetBrowserProps.columns,
  order: state.catalog.order,
  results: state.catalog.results
});

const mapDispatchToProps = dispatch => ({
  changeSortOrder: (columnName) => dispatch(changeSortOrder(columnName))
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultListTable);
