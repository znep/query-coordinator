import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ResultListRow from './ResultListRow';
import * as Actions from '../actions/catalog';
import _ from 'lodash';
import classNames from 'classnames';

export class ResultListTable extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onColumnHeaderClick',
      'resultListRowProps'
    ]);
  }

  onColumnHeaderClick(columnName) {
    const { changeOrder } = this.props;
    changeOrder(columnName);
  }

  resultListRowProps(result) {
    // TODO: Need "owner"
    return _.merge(
      {
        category: result.classification.domain_category,
        isDataLensApproved: result.metadata.is_datalens_approved,
        isHidden: result.metadata.is_hidden,
        isModerationApproved: result.metadata.is_moderation_approved,
        isPublic: result.metadata.is_public,
        // NOTE: this may change from a bool to a string for publication state "pending" vs "rejected":
        isPublished: result.metadata.is_published,
        isRoutingApproved: result.metadata.is_routing_approved,
        link: result.link,
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
        scope: 'col'
      };
    };

    const columnTranslation = (key) => _.get(I18n, `result_list_table.columns.${_.snakeCase(key)}`);

    const tableHeader = (
      <thead>
        <tr>
          {columns.map((columnName) => (
            <th {...columnHeaderProps(columnName)}>
              <span className="column-name">{columnTranslation(columnName)}</span>
              <span className="ascending-arrow socrata-icon-arrow-down" />
              <span className="descending-arrow socrata-icon-arrow-up" />
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
  changeOrder: PropTypes.func.isRequired,
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
  changeOrder: (columnName) => dispatch(Actions.changeOrder(columnName))
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultListTable);
