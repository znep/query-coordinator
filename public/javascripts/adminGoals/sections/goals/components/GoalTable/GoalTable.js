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

  renderLoadingSpinner() {
    return (
      <div className="op-table-load-in-progress">
        <span className="spinner-default spinner-large" />
      </div>
    );
  }

  render() {
    const { pagination, translations, loadInProgress } = this.props;
    const perPageSelectorTitle = translations.getIn(['admin', 'listing', 'rows_per_page']);

    return (
      <div>
        <table className="table table-borderless op-admin-table">
          <GoalTableHead />
          <GoalTableBody />
        </table>
        { loadInProgress ? this.renderLoadingSpinner() : null }
        <div>
          <PageSelector />
          <Components.RowsPerPageSelector
            onChange={this.handleOnRowsPerPageChanged}
            options={this.paginationOptions}
            title={perPageSelectorTitle}
            value={pagination.get('goalsPerPage')}/>
        </div>
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
