import * as React from 'react';
import * as ReactRedux from 'react-redux';

import * as Actions from './actions';
import * as State from './state';
import * as Components from './components';

class GoalsPage extends React.Component {
  constructor(props) {
    super(props);

    this.isInitialDataLoaded = false;
  }

  componentDidMount() {
    if (!this.isInitialDataLoaded) {
      this.props.loadInitialData();
    }
  }

  render() {
    const { isBulkEditFormVisible, isQuickEditFormVisible } = this.props;

    return (
      <div>
        <Components.SocrataBulkActions />
        <Components.GoalTable />
        { isQuickEditFormVisible && <Components.QuickEditForm /> }
        { isBulkEditFormVisible && <Components.BulkEditForm /> }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isBulkEditFormVisible: State.getBulkEdit(state).get('visible'),
  isQuickEditFormVisible: State.getQuickEdit(state).get('visible')
});

const mapDispatchToProps = dispatch => ({
  loadInitialData: () => dispatch(Actions.Data.load())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GoalsPage);


