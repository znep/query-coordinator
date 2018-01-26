import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect, I18nPropType } from '../../utils';
import Pager from 'common/components/Pager';
import ResultsTable from '../../components/ResultsTable';
import MemberScreenName from './MemberScreenName';
import MemberEditControl from './MemberEditControl';
import { SORT_DIRECTION, SORT_KEYS } from 'common/users-api';
import * as Actions from '../actions';
import * as Selectors from '../../selectors';

// TODO: Add sorting/pagination once this data is available in catalog service

class TeamListTable extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    currentPage: PropTypes.number.isRequired,
    loadingData: PropTypes.bool,
    members: PropTypes.array,
    onChangePage: PropTypes.func.isRequired,
    resultCount: PropTypes.number,
    resultsPerPage: PropTypes.number,
    teamId: PropTypes.string
  };

  static defaultProps = {
    members: []
  };

  renderScreenNameCell = (screenName, { id }) => <MemberScreenName screenName={screenName} id={id} />;

  renderEditControl = (userId, { teamRole, displayName }) => (
    <MemberEditControl userId={userId} teamRole={teamRole} displayName={displayName} teamId={this.props.teamId} />
  );

  renderTeamRoleCell = teamRole => this.props.I18n.t(`users.team_roles.${teamRole}`);

  render() {
    const {
      I18n,
      currentPage,
      loadingData,
      members,
      onChangePage,
      // onSort,
      // orderBy,
      resultCount,
      resultsPerPage
      // sortDirection,
    } = this.props;
    const noResultsMessage = I18n.t('users.no_results');

    return (
      <div>
        <ResultsTable
          data={members}
          rowKey="id"
          loadingData={loadingData}
          noResultsMessage={noResultsMessage}
        >
          <ResultsTable.Column
            // isActive={orderBy === SORT_KEYS.SCREEN_NAME}
            // sortDirection={sortDirection}
            // onSort={() => onSort(SORT_KEYS.SCREEN_NAME)}
            header={I18n.t('users.headers.name')}
            dataIndex="displayName"
          >
            {this.renderScreenNameCell}
          </ResultsTable.Column>
          <ResultsTable.Column
            // isActive={orderBy === SORT_KEYS.EMAIL}
            // sortDirection={sortDirection}
            // onSort={() => onSort(SORT_KEYS.EMAIL)}
            header={I18n.t('users.headers.email')}
            dataIndex="email"
          />
          <ResultsTable.Column
            // isActive={orderBy === SORT_KEYS.ROLE_NAME}
            // sortDirection={sortDirection}
            // onSort={() => onSort(SORT_KEYS.ROLE_NAME)}
            header={I18n.t('users.headers.role')}
            dataIndex="teamRole"
          >
            {this.renderTeamRoleCell}
          </ResultsTable.Column>
          <ResultsTable.Column
            header={I18n.t('users.headers.actions')}
            dataIndex="id"
            dataClassName="action-menu-cell"
          >
            {this.renderEditControl}
          </ResultsTable.Column>
        </ResultsTable>
        <div className="results-list-footer">
          <Pager
            changePage={onChangePage}
            currentPage={currentPage}
            resultCount={resultCount}
            resultsPerPage={resultsPerPage}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  currentPage: 1, // Selectors.getTeamsCurrentPage(state),
  loadingData: Selectors.getTeamsLoadingTeam(state),
  orderBy: SORT_KEYS.SCREEN_NAME, // Selectors.getTeamsOrderBy(state),
  resultsPerPage: 1000, // Selectors.getTeamsResultsLimit(state),
  sortDirection: SORT_DIRECTION.ASC // Selectors.getTeamsSortDirection(state),
});

const mapDispatchToProps = {
  changeMemberRole: Actions.changeMemberRole,
  onChangePage: () => console.log('onChangePage'), // Actions.gotoPage,
  onSort: () => console.log('onSort') // Actions.sortColumn
};

export default fullConnect(mapStateToProps, mapDispatchToProps)(TeamListTable);
