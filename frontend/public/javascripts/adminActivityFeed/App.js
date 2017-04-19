import React from 'react';
import { connect } from 'react-redux';
import ActivityFeedTable from './components/ActivityFeedTable';
import Error from './components/Error';
import DetailsModal from './components/DetailsModal';

import './App.scss';

class App extends React.Component {
  render() {
    const detailsModal = this.props.detailsModal ? <DetailsModal /> : null;

    return (
      <div>
        <Error />
        {detailsModal}
        <ActivityFeedTable />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  detailsModal: state.get('detailsModal')
});

export default connect(mapStateToProps, null)(App);
