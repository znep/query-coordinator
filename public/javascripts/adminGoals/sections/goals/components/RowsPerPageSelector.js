import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Actions from '../actions';
import * as State from '../state';

import Select from 'react-select';
import 'react-select/dist/react-select.css';

class RowsPerPageSelector extends React.Component {
  constructor(props) {
    super(props);

    this.handleValueChanged = this.handleValueChanged.bind(this);
  }

  handleValueChanged(selected) {
    this.props.actions.setGoalsPerPage(selected.value);
  }

  render() {
    let options = _.map([25, 50, 100, 250], value => ({ label: value, value }));

    return <div className="rowsPerPageContainer">
      { this.props.translations.getIn(['admin', 'listing', 'rows_per_page']) }:
      <Select
        options={ options }
        value={ this.props.goalsPerPage }
        clearable={ false }
        searchable={ false }
        onChange={ this.handleValueChanged }
      />
    </div>;
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  goalsPerPage: State.getPagination(state).get('goalsPerPage')
});

const mapDispatchToProps = dispatch => ({
  actions: Redux.bindActionCreators(Actions.UI, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(RowsPerPageSelector);
