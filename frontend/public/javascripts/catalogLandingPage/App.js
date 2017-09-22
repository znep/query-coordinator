import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { FeatureFlags } from 'common/feature_flags';
import Header from './components/Header';
import FeaturedContent from './components/FeaturedContent';
import Description from './components/Description';

export const App = ({ store }) => {
  const description = FeatureFlags.value('clp_move_description_below_featured_content') ? (
    <Description />
  ) : null;

  return (
    <Provider store={store}>
      <div>
        <Header />
        <FeaturedContent />
        {description}
      </div>
    </Provider>
  );
};

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
