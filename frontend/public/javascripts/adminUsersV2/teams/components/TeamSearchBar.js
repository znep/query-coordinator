import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect, I18nPropType } from '../../utils';
import Button from 'common/components/Button';
import EditTeamModal from './EditTeamModal';
import * as Actions from '../actions';
import * as Selectors from '../../selectors';

class TeamSearchBar extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    addTeam: PropTypes.func.isRequired,
    modalTitle: PropTypes.string.isRequired,
    modalSubtitle: PropTypes.string.isRequired,
    submitButtonLabel: PropTypes.string.isRequired
  };

  render() {
    const { I18n, addTeam, submitButtonLabel, modalTitle, modalSubtitle } = this.props;
    return (
      <div className="team-search-bar search-bar">
        <div>{' '}</div>{/* Remove when team autocomplete is available */}
        <Button variant="primary" onClick={addTeam}>
          {I18n.t('users.add_new_team.add_team_label')}
        </Button>
        <EditTeamModal
          modalTitle={modalTitle}
          modalSubtitle={modalSubtitle}
          submitButtonLabel={submitButtonLabel} />
      </div>
    );
  }
}

const mapStateToProps = (state, { I18n }) => {
  const isEditing = !!Selectors.getTeamFormId(state);
  return {
    modalTitle: isEditing ?
      I18n.t('users.edit_team.edit_team_title') :
      I18n.t('users.add_new_team.add_team_title'),
    modalSubtitle: '',
    submitButtonLabel: isEditing ?
      I18n.t('users.edit_team.edit_team') :
      I18n.t('users.add_new_team.add_team')
  };
};

const mapDispatchToProps = ({
  addTeam: Actions.addTeam
});

export default fullConnect(mapStateToProps, mapDispatchToProps)(TeamSearchBar);
