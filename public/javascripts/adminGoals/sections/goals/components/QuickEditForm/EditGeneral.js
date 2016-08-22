import _ from 'lodash';
import * as React from 'react';
import * as ReactRedux from 'react-redux';
import * as State from '../../state';
import * as Components from '../../../../components';

class EditGeneral extends React.Component {
  constructor(props) {
    super(props);

    const translations = props.translations;

    this.visibilityOptions = [
      {
        label: translations.getIn(['admin', 'goal_values', 'status_public']),
        value: 'public'
      },
      {
        label: translations.getIn(['admin', 'goal_values', 'status_private']),
        value: 'private'
      }
    ];
  }

  render() {
    const { translations, goal, formData } = this.props;

    return (
      <div>
        <h5>{ translations.getIn(['admin', 'quick_edit', 'goal_name']) }</h5>

        <div className="form-line">
          <label className="inline-label">{ translations.getIn(['admin', 'quick_edit', 'goal_name']) }</label>
          <input
            name="name"
            className="text-input"
            value={ formData.get('name', '') }
            onChange={ this.props.onInputChange }/>
        </div>

        <div className="form-line">
          <label className="inline-label">
            { translations.getIn(['admin', 'quick_edit', 'status'])}
          </label>
          { translations.getIn(['measure', 'progress', goal.get('status')]) || ' — '}
        </div>

        <div className="form-line">
          <label className="inline-label">
            { translations.getIn(['admin', 'quick_edit', 'visibility']) }
          </label>
          <Components.Select
            className="form-select-small"
            options={ this.visibilityOptions }
            value={ formData.get('visibility') }
            onChange={ _.wrap('visibility', this.props.onSelectChange) }
            searchable={ false }
            clearable={ false }/>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  formData: State.getQuickEdit(state).get('formData')
});

export default ReactRedux.connect(mapStateToProps)(EditGeneral);
