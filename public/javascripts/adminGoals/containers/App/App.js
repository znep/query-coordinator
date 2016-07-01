import React  from 'react';
import GoalTable from './../GoalTable/GoalTable';
import GoalQuickEdit from '../../components/GoalQuickEdit';
import './App.scss';

export default function() {
  return (
    <div>
      <GoalTable />
      <GoalQuickEdit />
    </div>
  );
}
