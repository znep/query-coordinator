import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as Selectors from '../../selectors';
import * as Actions from '../actions';
import { connect as fullConnect, I18nPropType } from '../../utils';
import ErrorList from '../../components/ErrorList';

export class EditTeamFormInputs extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    errors: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    teamName: PropTypes.string,
    teamDescription: PropTypes.string
  };

  static defaultProps = {
    teamDescription: '',
    teamName: ''
  };

  handleChange = () => {
    const { onChange } = this.props;
    onChange(this.teamName.value, this.teamDescription.value);
  };

  render() {
    const { errors, teamDescription, teamName, I18n } = this.props;
    return (
      <div>
        <label className="inline-label" htmlFor="team-name">
          {I18n.t('users.add_new_team.name_label')}:
        </label>
        <input
          className="add-team-name text-input text-area"
          id="team-name"
          onChange={this.handleChange}
          placeholder={I18n.t('users.add_new_team.name_placeholder')}
          ref={ref => (this.teamName = ref)}
          type="text"
          value={teamName}
        />
        <label className="block-label" htmlFor="team-description">
          {I18n.t('users.add_new_team.description_label')}:
        </label>
        <input
          className="add-team-description text-input text-area"
          id="team-description"
          onChange={this.handleChange}
          placeholder={I18n.t('users.add_new_team.description_placeholder')}
          ref={ref => (this.teamDescription = ref)}
          type="text"
          value={teamDescription}
        />
        <ErrorList errors={errors} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  errors: Selectors.getTeamFormErrors(state),
  teamDescription: Selectors.getTeamFormDescription(state),
  teamName: Selectors.getTeamFormName(state)
});

const mapDispatchToProps = {
  onChange: Actions.updateTeamForm
};

export default fullConnect(mapStateToProps, mapDispatchToProps)(EditTeamFormInputs);
