import React  from 'react';
import GoalTable from './../GoalTable/GoalTable';
import Alert from '../../components/Alert';
import './App.scss';

export default function() {
  return (
    <div>
      <Alert />
      <GoalTable />
    </div>
  );
}
