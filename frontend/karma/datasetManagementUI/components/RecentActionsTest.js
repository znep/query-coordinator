import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import RecentActions from 'components/RecentActions/RecentActions';
import { Activity } from 'containers/RecentActionsContainer';

describe('components/RecentActions', () => {
  const params = {
    category: 'dataset',
    name: 'test dataset',
    fourfour: 'abcd-1234'
  };

  it('renders proper ui when given a revision activity', () => {
    const activity = Activity.Revision({
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'branweb'
    });

    const component = shallow(
      <RecentActions params={params} activities={[activity]} />
    );

    assert.equal(component.find('RevisionActivity').length, 1);
  });

  it('renders proper ui when given a source activity', () => {
    const activity = Activity.Source({
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'branweb'
    });

    const component = shallow(
      <RecentActions params={params} activities={[activity]} />
    );

    assert.equal(component.find('SourceActivity').length, 1);
  });

  it('renders proper ui when given an output schema activity', () => {
    const activity = Activity.OutputSchema({
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'branweb',
      sourceId: 22,
      isid: 33,
      osid: 44
    });

    const component = shallow(
      <RecentActions params={params} activities={[activity]} />
    );

    assert.equal(component.find('OutputSchemaActivity').length, 1);
  });

  it('renders proper ui when given a taskSet activity', () => {
    const activity = Activity.TaskSet({
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'branweb'
    });

    const component = shallow(
      <RecentActions params={params} activities={[activity]} />
    );

    assert.equal(component.find('TaskSetActivity').length, 1);
  });

  it('renders proper ui when given a finished taskSet activity', () => {
    const activity = Activity.FinishedTaskSet({
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'branweb'
    });

    const component = shallow(
      <RecentActions params={params} activities={[activity]} />
    );

    assert.equal(component.find('TaskSetFinishedActivity').length, 1);
  });

  it('renders proper ui when given a failed taskSet activity', () => {
    const activity = Activity.FailedTaskSet({
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'branweb'
    });

    const component = shallow(
      <RecentActions params={params} activities={[activity]} />
    );

    assert.equal(component.find('TaskSetFailedActivity').length, 1);
  });

  it('renders an empty container when given an Empty activity', () => {
    const activity = Activity.Empty;

    const component = shallow(
      <RecentActions params={params} activities={[activity]} />
    );

    assert.equal(component.find('div').children().length, 0);
  });
});
