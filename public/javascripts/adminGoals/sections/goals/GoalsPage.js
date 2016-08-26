import * as React from 'react';
import * as ReactRedux from 'react-redux';

import * as Actions from './actions';
import * as State from './state';
import * as Selectors from './selectors';
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
    const { translations, isBulkEditFormVisible, isQuickEditFormVisible, isInitialLoadInProgress } = this.props;

    return (
      <div className="goals-page">
        <div className="table-top">
          <h1>
            { translations.getIn(['admin', 'manage_performance_goals']) }
          </h1>
          <Components.SocrataBulkActions />
        </div>
        <Components.GoalTable loadInProgress={isInitialLoadInProgress} />
        { isQuickEditFormVisible && <Components.QuickEditForm /> }
        { isBulkEditFormVisible && <Components.BulkEditForm /> }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  isInitialLoadInProgress: Selectors.getLoading(state),
  isBulkEditFormVisible: State.getBulkEdit(state).get('visible'),
  isQuickEditFormVisible: State.getQuickEdit(state).get('visible')
});

const mapDispatchToProps = dispatch => ({
  loadInitialData: () => dispatch(Actions.Data.load())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GoalsPage);


