import React from 'react';
import ApiFlannel from './components/ApiFlannel';
import ContactForm from './components/ContactForm';
import FeaturedContentModal from './components/FeaturedContentModal';
import ODataModal from './components/ODataModal';
import ShareModal from './components/ShareModal';

const DynamicContent = () => (
  <div>
    <ApiFlannel />
    <ContactForm />
    <FeaturedContentModal />
    <ODataModal />
    <ShareModal />
  </div>
);

export default DynamicContent;
