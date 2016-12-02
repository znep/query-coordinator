import React from 'react';
import { VelocityComponent } from 'velocity-react';
import InfoPane from './components/InfoPane';
import VisualizationContainer from './components/VisualizationContainer';
import Table from './components/Table';

export default function App() {
  return (
    <VelocityComponent animation={{ opacity: 1 }} runOnMount duration={275}>
      <div style={{ opacity: 0 }}>
        <div className="container">
          <InfoPane />
          <VisualizationContainer />
          <Table />
        </div>
      </div>
    </VelocityComponent>
  );
}
