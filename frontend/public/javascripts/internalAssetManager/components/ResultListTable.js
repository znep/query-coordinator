import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ResultListRow from './ResultListRow';
import _ from 'lodash';

export class ResultListTable extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'resultListRowProps'
    ]);
  }

  resultListRowProps(result) {
    // TODO: Need "owned by"
    return _.merge(
      {
        category: result.classification.domain_category,
        isPublished: !!result.metadata.is_published,
        link: result.link,
        visibleToAnonymous: !!result.metadata.visible_to_anonymous
      },
      _.pick(result.resource, ['description', 'name', 'provenance', 'type', 'updatedAt'])
    );
  }

  render() {
    const { columns, results } = this.props;

    const columnTranslation = (key) => (
      _.get(I18n, `result_list_table.columns.${_.snakeCase(key)}`)
    );

    const tableHeader = (
      <thead>
        <tr>
          {columns.map((columnName) => (
            <th scope="col" key={columnName}>{columnTranslation(columnName)}</th>
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
  columns: PropTypes.array.isRequired,
  results: PropTypes.array.isRequired
};

const mapStateToProps = state => ({
  columns: state.catalog.columns,
  results: state.catalog.results
});

export default connect(mapStateToProps)(ResultListTable);
