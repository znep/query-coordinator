import React from 'react';
import Responsive from './lib/Responsive';
import Navbar from './components/Navbar';
import PrivateNotice from './components/PrivateNotice';
import InfoPane from './components/InfoPane';
import FeaturedViewList from './containers/FeaturedViewList';
import MetadataTable from './components/MetadataTable';
import DatasetContents from './components/DatasetContents';
import ApiFlannel from './components/ApiFlannel';
import ContactModal from './containers/ContactModal';
import ShareModal from './components/ShareModal';
import ODataModal from './components/ODataModal';
import FeedbackPanel from './components/FeedbackPanel';

export default React.createClass({

  render: function() {
    return (
      <div>
        <Navbar />
        <PrivateNotice />
        <InfoPane />

        <main className="container landing-page-container">
          <Responsive>
            <FeaturedViewList />
          </Responsive>

          <MetadataTable />
          <DatasetContents />
        </main>

        <ApiFlannel />
        <ContactModal />
        <ShareModal />
        <ODataModal />
        <FeedbackPanel />
      </div>
    );
  }
});
