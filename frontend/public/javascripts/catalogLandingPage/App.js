import React from 'react';
import { connect } from 'react-redux';
import { FeatureFlags } from 'common/feature_flags';
import Header from './components/Header';
import FeaturedContent from './components/FeaturedContent';
import Description from './components/Description';

export const App = () => {
  const description = FeatureFlags.value('clp_move_description_below_featured_content') ?
    <Description /> : null;

  return (
    <div>
      <Header />
      <FeaturedContent />
      {description}
    </div>
  );
};

export default connect((state) => (state))(App);
