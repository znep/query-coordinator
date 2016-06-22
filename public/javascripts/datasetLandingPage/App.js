import React from 'react';
import Responsive from './lib/Responsive';
import PrivateNotice from './components/PrivateNotice';
import PublishNotice from './components/PublishNotice';
import InfoPane from './components/InfoPane';
import FeaturedContent from './components/FeaturedContent';
import FeaturedContentModal from './components/FeaturedContentModal';
import MetadataTable from './components/MetadataTable';
import DatasetContents from './components/DatasetContents';
import DatasetPreview from './components/DatasetPreview';
import PopularViewList from './components/PopularViewList';
import ApiFlannel from './components/ApiFlannel';
import ContactForm from './components/ContactForm';
import ShareModal from './components/ShareModal';
import ODataModal from './components/ODataModal';
import FeedbackPanel from './components/FeedbackPanel';

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

      <ApiFlannel />
      <ContactForm />
      <FeaturedContentModal />
      <FeedbackPanel />
      <ODataModal />
      <ShareModal />
    </div>
  );
}
