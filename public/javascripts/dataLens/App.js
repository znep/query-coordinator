import React from 'react';
import { VelocityComponent } from 'velocity-react';

export default function App() {
  return (
    <VelocityComponent animation={{ opacity: 1 }} runOnMount duration={275}>
      <div style={{ opacity: 0 }}>
        <h1>Flexible Data Lens</h1>
      </div>
    </VelocityComponent>
  );
}
