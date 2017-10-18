import React from 'react';
import ContactForm from './components/ContactForm';
import FeaturedContentModal from './components/FeaturedContentModal';
import CartoModal from './components/CartoModal';
import PlotlyModal from './components/PlotlyModal';

const DynamicContent = () => (
  <div>
    <CartoModal />
    <PlotlyModal />
    <ContactForm />
    <FeaturedContentModal />
  </div>
);

export default DynamicContent;
