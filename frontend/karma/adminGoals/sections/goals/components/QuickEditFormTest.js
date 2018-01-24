import sinon from 'sinon';
import { expect, assert } from 'chai';
import Immutable from 'immutable';
import translations from 'mockTranslations';
import mockGoalsByIds from '../../../data/cachedGoals';
import mockDatasets from '../../../data/datasets';
import QuickEditForm, { QuickEditFormComponent } from 'adminGoals/sections/goals/components/QuickEditForm/QuickEditForm';
import { shallow } from 'enzyme';

const mockGoals = Immutable.fromJS(mockGoalsByIds).valueSeq().toList().toJS();

var getDefaultStore = require('testStore').getDefaultStore;
let server;
let output;

//TODO: Test redux connectors.

describe('sections/goals/components/QuickEditForm/QuickEditForm', () => {
  let goalId = '7ndm-ubkq';
  let goal = mockGoalsByIds[goalId];
  let goalAsImmutable = Immutable.fromJS(goal);

  const render = (propOverrides) => {
    const props = _.merge(
      {},
      {
        formData: Immutable.fromJS({}),
        goal: goalAsImmutable,
        isGoalNotConfigured: false,
        saveError: false,
        saveInProgress: false,
        translations: Immutable.fromJS(translations),
        unsavedChanges: false
      },
      propOverrides
    );

    return shallow(React.createElement(QuickEditFormComponent, props));
  };

  it('should have correct title', () => {
    output = render();
    assert.include(output.find('Header').prop('title'), goal.name);
  });

  describe('save button', () => {
    let getButton = () => output.find('[type="submit"]');
    const itShouldBeDisabled = (state) => {
      it('should be disabled', () => {
        output = render(state);
        assert.isTrue(getButton().prop('disabled'));
      });
    };
    const itShouldBeEnabled = (state) => {
      it('should be enabled', () => {
        output = render(state);
        assert.isFalse(getButton().prop('disabled'));
      });
    };

    describe('save not in progress, no changes', () => {
      itShouldBeDisabled();
    });

    describe('save not in progress, changes', () => {
      itShouldBeEnabled({
        unsavedChanges: true,
        formData: Immutable.fromJS({ something: 'changed' })
      });
    });

    describe('save in progress, changes', () => {
      itShouldBeDisabled({
        unsavedChanges: true,
        saveInProgress: true
      });
    });

    describe('save in progress, no changes', () => {
      itShouldBeDisabled({
        saveInProgress: true
      });
    });
  });

  it('should pass goal to GoalDetails, EditGeneral and EditPrevailingMeasure', () => {
    output = render();
    const editGeneralProps = output.find('Content').dive().find('Connect(EditGeneral)').props();
    const detailsProps = output.find('Content').dive().find('Connect(GoalDetails)').props();
    assert.propertyVal(editGeneralProps, 'goal', goalAsImmutable);
    assert.propertyVal(editGeneralProps, 'goal', goalAsImmutable);
    assert.propertyVal(detailsProps, 'goal', goalAsImmutable);
  });
});

// Tests below use a full DOM render and test functionality of EditGeneral and EditPrevailingMeasure.
// Consider porting to Enzyme and reducing scope to QuickEditForm only.

describe('sections/goals/components/QuickEditForm/QuickEditForm Prevailing Measure - Increase - Absolute', () => {
  let goalId = 'g34u-2aa5';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure target edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('sections/goals/components/QuickEditForm/QuickEditForm Prevailing Measure - Increase - Relative', () => {
  let goalId = 'vefh-4ihb';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure delta edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target-delta')).to.have.length(1);
  });

  it('should have measure percent unit selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-percent-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('sections/goals/components/QuickEditForm/QuickEditForm Prevailing Measure - Reduce - Absolute', () => {
  let goalId = 'ykke-a4sz';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure target edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('sections/goals/components/QuickEditForm/QuickEditForm Prevailing Measure - Reduce - Relative', () => {
  let goalId = 'sgv4-zzaj';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure target type selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure delta edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target-delta')).to.have.length(1);
  });

  it('should have measure percent unit selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-percent-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('sections/goals/components/QuickEditForm/QuickEditForm Prevailing Measure - Maintain - Within', () => {
  let goalId = '59yh-53jg';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure maintain type selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-maintain-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure delta edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-target-delta')).to.have.length(1);
  });

  it('should have measure percent unit selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-percent-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('containers/QuickEditForm/QuickEditForm Prevailing Measure - Maintain - Below', () => {
  let goalId = 'jf7f-i9h8';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure maintain type selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-maintain-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('sections/goals/components/QuickEditForm/QuickEditForm Prevailing Measure - Maintain - Above', () => {
  let goalId = '7ndm-ubkq';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure maintain type selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-maintain-type')).to.have.length(1);
  });

  it('should have measure baseline edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-baseline')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('sections/goals/components/QuickEditForm/QuickEditForm Prevailing Measure - Measure', () => {
  let goalId = '63mm-ymcx';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-action')).to.have.length(1);
  });

  it('should have subject edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-subject')).to.have.length(1);
  });

  it('should have measure unit edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-unit')).to.have.length(1);
  });

  it('should have measure date range edit', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-date-range')).to.have.length(1);
  });

  it('should have measure override selection', () => {
    expect(output.querySelectorAll('div.prevailing-measure-container .measure-override')).to.have.length(1);
  });

});

describe('sections/goals/components/QuickEditForm/QuickEditForm Not Configured Goal', () => {
  let goalId = 'kd8s-mb3p';
  let goal = mockGoals[goalId];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify(mockDatasets[goal.datasetId]));
    });

    let state = {
      translations: translations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: { visible: false },
          initialFormData: {},
          formData: {}
        }
      }
    };

    output = renderComponentWithStore(QuickEditForm, {}, getDefaultStore(Immutable.fromJS(state)));
  });

  afterEach(() => {
    server.restore();
  });

  it('should have action selection', () => {
    expect(output.querySelectorAll('.unconfigured-goal-warning-message')).to.have.length(1);
  });
});
