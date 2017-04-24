import React from 'react';
import { connect } from 'react-redux';
import ActivityFeedTable from './components/ActivityFeedTable';
import Error from './components/Error';
import RestoreModal from './components/RestoreModal';
import DetailsModal from './components/DetailsModal';

import './App.scss';

class App extends React.Component {
  render() {
    const detailsModal = this.props.detailsModal ? <DetailsModal /> : null;
    const restoreModal = this.props.restoreModal ? <RestoreModal /> : null;

    return (
      <div>
        <Error />
        {detailsModal}
        {restoreModal}
        <ActivityFeedTable />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  detailsModal: state.get('detailsModal'),
  restoreModal: state.get('restoreModal')
});

export default connect(mapStateToProps, null)(App);
