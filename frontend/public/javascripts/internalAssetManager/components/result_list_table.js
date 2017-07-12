import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ResultListRow from './result_list_row';
import { changeSortOrder } from '../actions/sort_order';
import _ from 'lodash';
import classNames from 'classnames';
import { handleEnter } from 'common/helpers/keyPressHelpers';

export class ResultListTable extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onColumnHeaderClick',
      'resultListRowProps'
    ]);
  }

  onColumnHeaderClick(columnName) {
    // Sorting on visibility is not supported by Cetera
    if (!_.includes(['visibility', 'actions'], columnName)) {
      this.props.changeSortOrder(columnName);
    }
  }

  resultListRowProps(result) {
    return _.merge(
      {
        category: result.classification.domain_category,
        datalensStatus: result.metadata.datalens_status,
        grants: result.metadata.grants,
        isDatalensApproved: result.metadata.is_datalens_approved,
        isExplicitlyHidden: result.metadata.is_hidden,
        isModerationApproved: result.metadata.is_moderation_approved,
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
    const { columns, order, results } = this.props;

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

    const columnTranslation = (key) => _.get(I18n, `result_list_table.columns.${_.snakeCase(key)}`);

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
          <ResultListRow {...this.resultListRowProps(result)} key={result.resource.id} />
        )}
      </tbody>
    );

    return (
      <table className="result-list-table table table-discrete table-condensed table-borderless">
        {tableHeader}
        {tableBody}
      </table>
    );
  }
}

ResultListTable.propTypes = {
  changeSortOrder: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  order: PropTypes.object,
  results: PropTypes.array.isRequired
};

ResultListTable.defaultProps = {
  order: undefined
};

const mapStateToProps = state => ({
  columns: state.catalog.columns,
  order: state.catalog.order,
  results: state.catalog.results
});

const mapDispatchToProps = dispatch => ({
  changeSortOrder: (columnName) => dispatch(changeSortOrder(columnName))
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultListTable);
