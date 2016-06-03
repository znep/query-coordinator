import React from 'react';
import Responsive from './lib/Responsive';
import Navbar from './components/Navbar';
import PrivateNotice from './components/PrivateNotice';
import InfoPane from './components/InfoPane';
import PopularViewList from './containers/PopularViewList';
import MetadataTable from './components/MetadataTable';
import DatasetContents from './components/DatasetContents';
import ApiFlannel from './components/ApiFlannel';
import ContactModal from './containers/ContactModal';
import ShareModal from './components/ShareModal';
import ODataModal from './components/ODataModal';
import FeedbackPanel from './components/FeedbackPanel';

export default function() {
  return (
    <div>
      <Navbar />
      <PrivateNotice />
      <InfoPane />

      <main className="container landing-page-container">
        <MetadataTable />
        <DatasetContents />

        <Responsive>
          <PopularViewList />
        </Responsive>
      </main>

      <ApiFlannel />
      <ContactModal />
      <ShareModal />
      <ODataModal />
      <FeedbackPanel />
    </div>
  );
}
