import React from 'react';
import ApiModal from './components/ApiModal';
import ContactForm from './components/ContactForm';
import FeaturedContentModal from './components/FeaturedContentModal';
import ODataModal from './components/ODataModal';
import ShareModal from './components/ShareModal';
import CartoModal from './components/CartoModal';
import PlotlyModal from './components/PlotlyModal';

const DynamicContent = () => (
  <div>
    <ApiModal />
    <CartoModal />
    <PlotlyModal />
    <ContactForm />
    <FeaturedContentModal />
    <ODataModal />
    <ShareModal />
  </div>
);

export default DynamicContent;
