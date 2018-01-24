import { assert } from 'chai';
import Immutable from 'immutable';
import moment from 'moment';
import translations from 'mockTranslations';
import mockGoalsByIds from '../../../data/cachedGoals';
import GoalDetails from 'adminGoals/sections/goals/components/QuickEditForm/GoalDetails';
import { shallow } from 'enzyme';

describe('sections/goals/components/QuickEditForm/GoalDetails', () => {
  let goalId = '7ndm-ubkq';
  let goal = mockGoalsByIds[goalId];
  let goalAsImmutable = Immutable.fromJS(goal);

  const render = (propOverrides) => {
    const props = _.merge(
      {},
      {
        goal: goalAsImmutable,
        translations: Immutable.fromJS(translations)
      },
      propOverrides
    );

    return shallow(React.createElement(GoalDetails.WrappedComponent, props));
  };

  const findDivs = (output) => output.find('.goal-quick-edit-details').children().find('div');

  it('should have correct goal updated value', () => {
    const divs = findDivs(render());
    assert.equal(divs.at(0).text(), moment(goal.updated_at).format('ll'));
  });

  it('should have correct goal owner value', () => {
    const divs = findDivs(render());
    assert.equal(divs.at(1).text(), goal.created_by.displayName);
  });

  it('should have correct goal owner value', () => {
    const divs = findDivs(render());
    assert.equal(divs.at(2).text(), goal.dashboard.name);
  });

  it('should have correct category name', () => {
    const divs = findDivs(render());
    assert.equal(divs.at(3).text(), goal.category.name);
  });

});
