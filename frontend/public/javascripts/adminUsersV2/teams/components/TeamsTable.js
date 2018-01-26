import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect as fullConnect, I18nPropType } from '../../utils';
import ResultsTable from '../../components/ResultsTable';
import DropdownButton, { DropdownItem } from '../../components/DropdownButton';
import * as Actions from '../actions';
import * as Selectors from '../../selectors';
import { Link } from 'react-router';

const memberShape = PropTypes.shape({
  displayName: PropTypes.string,
  email: PropTypes.string,
  id: PropTypes.string,
  teamRole: PropTypes.string
});

const teamShape = PropTypes.shape({
  createdAt: PropTypes.number,
  description: PropTypes.string,
  id: PropTypes.string,
  members: PropTypes.arrayOf(memberShape),
  screenName: PropTypes.string
});

export class TeamsTable extends Component {
  static propTypes = {
    loadingData: PropTypes.bool.isRequired,
    teams: PropTypes.arrayOf(teamShape).isRequired,
    onDeleteTeam: PropTypes.func.isRequired,
    onEditTeam: PropTypes.func.isRequired,
    I18n: I18nPropType.isRequired
  };

  handleDelete = (id, screenName ) => {
    const { I18n, onDeleteTeam } = this.props;
    if (window.confirm(I18n.t('users.actions.confirm_delete_team', { name: screenName }))) {
      onDeleteTeam(id);
    }
  };

  renderTeamNameCell = (screenName, { id }) => {
    const { getTeamViewPath } = this.props;
    return (<Link to={getTeamViewPath(id)}>{screenName}</Link>);
  };

  renderMembersCell = (members, { id }) => {
    const { getTeamViewPath } = this.props;
    return (<Link to={getTeamViewPath(id)}>{members.length}</Link>);
  };

  renderActionsCell = (id, { screenName })  => {
    const { I18n, onEditTeam } = this.props;
    return (
      <DropdownButton>
        <DropdownItem onClick={() => onEditTeam(id)}>
          {I18n.t('users.actions.edit_team')}
        </DropdownItem>
        <DropdownItem onClick={() => this.handleDelete(id, screenName)}>
          {I18n.t('users.actions.delete_team')}
        </DropdownItem>
      </DropdownButton>
    );
  };

  render() {
    const { I18n, loadingData, teams } = this.props;
    const noResultsMessage = I18n.t('users.no_results');

    return (
      <ResultsTable data={ teams } rowKey="id" loadingData={loadingData} noResultsMessage={noResultsMessage}>
        <ResultsTable.Column dataIndex="screenName" header={ I18n.t('users.headers.team_name') }>
          {this.renderTeamNameCell}
        </ResultsTable.Column>
        <ResultsTable.Column dataIndex="description" header={ I18n.t('users.headers.description') }/>
        <ResultsTable.Column dataIndex="owner" header={ I18n.t('users.headers.owner') }/>
        <ResultsTable.Column dataIndex="members" header={ I18n.t('users.headers.members') }>
          {this.renderMembersCell}
        </ResultsTable.Column>
        <ResultsTable.Column dataIndex="id" header={ I18n.t('users.headers.actions') }>
          {this.renderActionsCell}
        </ResultsTable.Column>
      </ResultsTable>
    );
  }
}

const mapStateToProps = state => ({
  teams: Selectors.getTeamsList(state),
  loadingData: Selectors.getTeamsLoadingData(state),
  getTeamViewPath: id => Selectors.getTeamViewPath(id, state)
});

const mapDispatchToProps = {
  onEditTeam: Actions.editTeam,
  onDeleteTeam: Actions.deleteTeam
};

export default fullConnect(mapStateToProps, mapDispatchToProps)(TeamsTable);
