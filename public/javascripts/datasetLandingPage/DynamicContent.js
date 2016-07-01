import React from 'react';
import ApiFlannel from './components/ApiFlannel';
import ContactForm from './components/ContactForm';
import FeaturedContentModal from './components/FeaturedContentModal';
import FeedbackPanel from './components/FeedbackPanel';
import ODataModal from './components/ODataModal';
import ShareModal from './components/ShareModal';
import Tour from './components/Tour';

var DynamicContent = function() {
  return (
    <div>
      <ApiFlannel />
      <ContactForm />
      <FeaturedContentModal />
      <FeedbackPanel />
      <ODataModal />
      <ShareModal />
      <Tour />
    </div>
  );
};

export default DynamicContent;
