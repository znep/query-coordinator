import Immutable from 'immutable';
import moment from 'moment';
import GoalQuickEdit from 'components/GoalQuickEdit';
import translations from 'mockTranslations';
import mockGoals from '../data/cachedGoals';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalQuickEditTest', function() {
  let goalId = '7ndm-ubkq';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
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

describe('components/GoalQuickEditTest Prevailing Measure - Increase - Absolute', function() {
  let goalId = 'g34u-2aa5';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure target edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('components/GoalQuickEditTest Prevailing Measure - Increase - Relative', function() {
  let goalId = 'vefh-4ihb';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure delta edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target-delta')).to.have.length(1);
  });

  it('should have measure percent unit selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-percent-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('components/GoalQuickEditTest Prevailing Measure - Reduce - Absolute', function() {
  let goalId = 'ykke-a4sz';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure target edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('components/GoalQuickEditTest Prevailing Measure - Reduce - Relative', function() {
  let goalId = 'sgv4-zzaj';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure delta edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target-delta')).to.have.length(1);
  });

  it('should have measure percent unit selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-percent-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('components/GoalQuickEditTest Prevailing Measure - Maintain - Within', function() {
  let goalId = '59yh-53jg';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure maintain type selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-maintain-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure delta edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-target-delta')).to.have.length(1);
  });

  it('should have measure percent unit selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-percent-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('components/GoalQuickEditTest Prevailing Measure - Maintain - Below', function() {
  let goalId = 'jf7f-i9h8';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure maintain type selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-maintain-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('components/GoalQuickEditTest Prevailing Measure - Maintain - Above', function() {
  let goalId = '7ndm-ubkq';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure maintain type selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-maintain-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('components/GoalQuickEditTest Prevailing Measure - Measure', function() {
  let goalId = '63mm-ymcx';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    let state = {
      goalTableData: {
        translations: translations,
        cachedGoals: mockGoals,
        goalQuickEditOpenGoalId: goalId,
        alert: {}
      }
    };

    this.output = renderComponentWithStore(GoalQuickEdit, { goal: Immutable.fromJS(goal) }, getDefaultStore(Immutable.fromJS(state)));
  });

  it('should have action selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(this.output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});
