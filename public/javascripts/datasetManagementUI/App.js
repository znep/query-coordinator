import React from 'react';
import HomePane from './components/HomePane';
import AppBar from './components/AppBar';
import ManageMetadata from './components/ManageMetadata';

export default function App() {
  return (
    <div className="dataset-management-ui">
      <AppBar />
      <HomePane />
      <ManageMetadata />
    </div>
  );
}
