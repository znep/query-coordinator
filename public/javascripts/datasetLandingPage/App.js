import React from 'react';
import Responsive from './lib/Responsive';
import PrivateNotice from './components/PrivateNotice';
import PublishNotice from './components/PublishNotice';
import InfoPane from './components/InfoPane';
import FeaturedContent from './components/FeaturedContent';
import MetadataTable from './components/MetadataTable';
import RowDetails from './components/RowDetails';
import SchemaPreview from './components/SchemaPreview';
import DatasetPreview from './components/DatasetPreview';
import RelatedViewList from './components/RelatedViewList';
import { VelocityComponent } from 'velocity-react';

export default function App() {
  return (
    <VelocityComponent animation={{ opacity: 1 }} runOnMount duration={275}>
      <div style={{ opacity: 0 }}>
        <PublishNotice />
        <PrivateNotice />
        <InfoPane />

        <main className="container landing-page-container">
          <FeaturedContent />
          <MetadataTable />
          <RowDetails />
          <SchemaPreview />
          <DatasetPreview />

          <Responsive>
            <RelatedViewList />
          </Responsive>
        </main>
      </div>
    </VelocityComponent>
  );
}