import React from 'react';
import { connect } from 'react-redux';
import Header from './components/Header';
import CategoryStats from './components/CategoryStats';
import FeaturedContent from './components/FeaturedContent';

export const App = () => {
  return (
    <div>
      <Header />
      <CategoryStats />
      <FeaturedContent />
    </div>
  );
};

export default connect((state) => (state))(App);
