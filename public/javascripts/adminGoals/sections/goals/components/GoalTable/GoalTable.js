import _ from 'lodash';

import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as State from '../../state';
import * as Actions from '../../actions';
import * as Components from '../../../../components';

import GoalTableHead from './GoalTableHead';
import GoalTableBody from './GoalTableBody';
import PageSelector from './PageSelector';

import './GoalTable.scss';

class GoalTable extends React.Component {
  constructor(props) {
    super(props);
    this.paginationOptions = [25, 50, 100, 250];
    _.bindAll(this, ['handleOnRowsPerPageChanged']);
  }

  handleOnRowsPerPageChanged(goalsPerPage) {
    this.props.uiActions.setGoalsPerPage(goalsPerPage, this.props.goalsCount);
  }

  renderTable() {
    return (
      <table className="table table-borderless table-discrete op-admin-table">
        <GoalTableHead />
        <GoalTableBody />
      </table>
    );
  }

  renderLoadingSpinner() {
    return (
      <div className="op-table-load-in-progress">
        <span className="spinner-default spinner-large" />
      </div>
    );
  }

  renderFooter() {
    const { pagination, translations } = this.props;
    const perPageSelectorTitle = translations.getIn(['admin', 'listing', 'rows_per_page']);

    return (
      <div className="footer">
        <PageSelector />
        <Components.RowsPerPageSelector
          onChange={this.handleOnRowsPerPageChanged}
          options={this.paginationOptions}
          title={perPageSelectorTitle}
          value={pagination.get('goalsPerPage')}/>
      </div>
    );
  }

  render() {
    const { loadInProgress } = this.props;

    return (
      <div className="goal-table">
        { this.renderTable() }
        { loadInProgress ? this.renderLoadingSpinner() : null }
        { !loadInProgress ? this.renderFooter() : null }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  goalsCount: state.getIn(['goals', 'data']).count(),
  pagination: State.getPagination(state)
});

const mapDispatchToProps = dispatch => ({
  uiActions: Redux.bindActionCreators(Actions.UI, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GoalTable);
