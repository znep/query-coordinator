import React from 'react';
import Responsive from './lib/Responsive';
import PrivateNotice from './components/PrivateNotice';
import PublishNotice from './components/PublishNotice';
import InfoPane from './components/InfoPane';
import FeaturedContent from './components/FeaturedContent';
import MetadataTable from './components/MetadataTable';
import DatasetContents from './components/DatasetContents';
import DatasetPreview from './components/DatasetPreview';
import PopularViewList from './components/PopularViewList';

export default function() {
  return (
    <div>
      <PrivateNotice />
      <PublishNotice />
      <InfoPane />

      <main className="container landing-page-container">
        <FeaturedContent />
        <MetadataTable />
        <DatasetContents />
        <DatasetPreview />

        <Responsive>
          <PopularViewList />
        </Responsive>
      </main>
    </div>
  );
}
