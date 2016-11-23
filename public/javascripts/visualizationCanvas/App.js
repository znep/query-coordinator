import React from 'react';
import { VelocityComponent } from 'velocity-react';
import InfoPane from './components/InfoPane';
import VisualizationContainer from './components/VisualizationContainer';

export default function App() {
  return (
    <VelocityComponent animation={{ opacity: 1 }} runOnMount duration={275}>
      <div style={{ opacity: 0 }}>
        <div className="container">
          <InfoPane />
          <VisualizationContainer />
        </div>
      </div>
    </VelocityComponent>
  );
}
