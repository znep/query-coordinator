import _ from 'lodash';
import Immutable from 'immutable';
import moment from 'moment';
import GoalQuickEdit from 'components/GoalQuickEdit';
import translations from 'mockTranslations';
import mockGoals from '../data/cachedGoals';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalQuickEditTest', function() {
  let goal = mockGoals['7ndm-ubkq'];

  beforeEach(() => {

    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: '7ndm-ubkq',
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have correct title', () => {
    expect(this.output.querySelector('h1.modal-header-title').textContent).to.include(goal.name)
  });

  it('save button should have disabled', () => {
    expect(this.output.querySelector('button.btn-primary').hasAttribute('disabled')).to.be.true;
  });

  it('should have correct goal updated value', () => {
    expect(this.output.querySelectorAll('.goal-quick-edit-details div').item(0).textContent).
      to.eq(moment(goal.updated_at).format('ll'));
  });

  it('should have correct goal owner value', () => {
    expect(this.output.querySelectorAll('.goal-quick-edit-details div').item(1).textContent).
      to.eq(goal.created_by.displayName);
  });

  it('should have correct goal owner value', () => {
    expect(this.output.querySelectorAll('.goal-quick-edit-details div').item(2).textContent).
      to.eq(goal.dashboardName);
  });

  it('should have correct category name', () => {
    expect(this.output.querySelectorAll('.goal-quick-edit-details div').item(3).textContent).
    to.eq(goal.category.name);
  });

});
