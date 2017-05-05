import React from 'react';
import ResultListTable from './ResultListTable';

export class CatalogResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tableView: 'list'
    };

    _.bindAll(this, [
      'renderTable',
      'renderTopbar'
    ]);
  }

  renderTopbar() {
    return (<div className="topbar">TODO: Searchbar</div>);
  }

  renderTable() {
    if (this.state.tableView === 'list') {
      return <ResultListTable />;
    } else {
      // Currently only support for the "list" view. TODO: add "card" view and the ability to toggle them.
      // return <ResultCardTable />;
    }
  }

  render() {
    return (
      <div className="catalog-results">
        {this.renderTopbar()}
        {this.renderTable()}
      </div>
    );
  }
}

export default CatalogResults;
