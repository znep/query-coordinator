import * as React  from 'react';
import * as ReactRedux from 'react-redux';
import * as Goals from '../../sections/goals';
import * as Components from '../../components';

import './App.scss';

function App() {
  return (
    <div className="app-container admin-goals-page">
      <Components.PreviewBar />
      <div className="main-section" role="main">
        <Components.HeaderBar />
        <Goals.Page />
      </div>
    </div>
  );
}

const mapStateToProps = state => ({
  translations: state.get('translations')
});

export default ReactRedux.connect(mapStateToProps, null)(App);
