import React from 'react';
import { CounterViewExample } from './CounterView';
import { UserViewExample } from './UserView';

export const ViewModelExamples: React.FC = () => {
  return (
    <div className="viewmodel-examples">
      <h1>Kotlineum ViewModel Examples</h1>
      <p>This page demonstrates the MVVM architecture pattern using Kotlineum's ViewModel implementation.</p>
      
      <CounterViewExample />
      <hr />
      <UserViewExample />
    </div>
  );
};

export { CounterViewExample, UserViewExample };
