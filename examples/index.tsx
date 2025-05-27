import React from 'react';
import { SharedFlowExample } from './SharedFlowExample';
import { StateFlowExample } from './StateFlowExample';

export const Examples: React.FC = () => {
  return (
    <div className="kotlineum-examples">
      <h1>Kotlineum Examples</h1>
      <p>This page demonstrates the usage of Kotlineum package components.</p>
      
      <SharedFlowExample />
      <hr />
      <StateFlowExample />
    </div>
  );
};

export { SharedFlowExample, StateFlowExample };
