import React from 'react';
import Responsive from './lib/Responsive';
import PrivateNotice from './components/PrivateNotice';
import InfoPane from './components/InfoPane';
import FeaturedContent from './containers/FeaturedContent';
import FeaturedContentModal from './containers/FeaturedContentModal';
import MetadataTable from './components/MetadataTable';
import DatasetContents from './components/DatasetContents';
import PopularViewList from './containers/PopularViewList';
import ApiFlannel from './components/ApiFlannel';
import ContactForm from './components/ContactForm';
import ShareModal from './components/ShareModal';
import ODataModal from './components/ODataModal';
import FeedbackPanel from './components/FeedbackPanel';

export default function() {
  return (
    <div>
      <PrivateNotice />
      <InfoPane />

      <main className="container landing-page-container">
        <FeaturedContent />
        <MetadataTable />
        <DatasetContents />

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
