import React from 'react';
import FeedbackPanel from '../common/components/FeedbackPanel';
import ApiFlannel from './components/ApiFlannel';
import ContactForm from './components/ContactForm';
import FeaturedContentModal from './components/FeaturedContentModal';
import ODataModal from './components/ODataModal';
import ShareModal from './components/ShareModal';
import CartoModal from './components/CartoModal';
import PlotlyModal from './components/PlotlyModal';

const DynamicContent = () => (
  <div>
    <ApiFlannel />
    <CartoModal />
    <PlotlyModal />
    <ContactForm />
    <FeaturedContentModal />
    <FeedbackPanel {...window.serverConfig} />
    <ODataModal />
    <ShareModal />
  </div>
);

export default DynamicContent;
