import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import {
  RevisionActivity,
  SourceActivity,
  TaskSetActivity,
  TaskSetFinishedActivity,
  TaskSetFailedActivity,
  OutputSchemaActivity
} from 'datasetManagementUI/components/RecentActionItems/RecentActionItems';

describe('components/RecentActionItems', () => {
  let initialConfig;

  before(() => {
    initialConfig = window.serverConfig;

    window.serverConfig = {
      currentUser: {id: 'bigg-deal'}
    };
  });

  after(() => {
    window.serverConfig = initialConfig;
  });

  describe('RevisionActivity', () => {
    const props = {
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'user'
    };

    const component = shallow(<RevisionActivity details={props} />);

    it('renders the right icon', () => {
      assert.equal(component.find('SocrataIcon').prop('name'), 'plus2');
    });

    it('renders the right message', () => {
      assert.equal(
        component.find('p').text(),
        `${props.createdBy} opened a revision`
      );
    });

    it('renders a timestamp', () => {
      assert.equal(component.find('RecentActionsTimestamp').length, 1);
    });
  });

  describe('SourceActivity', () => {
    const props = {
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'user',
      source: {
        source_type: {
          type: 'upload'
        }
      }
    };



    it('renders the right icon', () => {
      const component = shallow(<SourceActivity details={props} />);
      assert.equal(component.find('SocrataIcon').prop('name'), 'data');
    });

    it('renders the right message', () => {
      const component = shallow(<SourceActivity details={props} />);
      assert.equal(
        component.find('p').first().text(),
        `${props.createdBy} uploaded a file`
      );
    });

    it('renders a change message when there is a previous source', () => {
      const component = shallow(<SourceActivity details={{
        ...props,
        previousSource: {
          source_type: {
            type: 'upload'
          }
        }
      }} />);

      assert.equal(
        component.find('p').first().text(),
        `${props.createdBy} changed the file configuration`
      );
    });


    it('renders a timestamp', () => {
      const component = shallow(<SourceActivity details={props} />);
      assert.equal(component.find('RecentActionsTimestamp').length, 1);
    });
  });

  describe('OutputSchemaActivity', () => {
    const props = {
      details: {
        createdAt: new Date('2017-08-31T20:20:01.942Z'),
        createdBy: 'user',
        sourceId: 10,
        isid: 11,
        osid: 12
      },
      params: {
        category: 'dataset',
        name: 'test dataset',
        fourfour: 'abcd-1234'
      }
    };

    const component = shallow(<OutputSchemaActivity {...props} />);

    it('renders the right icon', () => {
      assert.equal(component.find('SocrataIcon').prop('name'), 'edit');
    });

    it('renders a link to the output schema', () => {
      const linkPath = component.find('Link').prop('to');
      assert.equal(
        linkPath,
        '/dataset/test dataset/abcd-1234/revisions/undefined/sources/10/schemas/11/output/12'
      );
    });

    it('renders a timestamp', () => {
      assert.equal(component.find('RecentActionsTimestamp').length, 1);
    });
  });

  describe('TaskSetActivity', () => {
    const props = {
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'user'
    };

    const component = shallow(<TaskSetActivity details={props} />);

    it('renders the right icon', () => {
      assert.equal(component.find('SocrataIcon').prop('name'), 'dataset');
    });

    it('renders the right message', () => {
      assert.equal(
        component.find('p').text(),
        `${props.createdBy} started data processing`
      );
    });

    it('renders a timestamp', () => {
      assert.equal(component.find('RecentActionsTimestamp').length, 1);
    });
  });

  describe('TaskSetFinishedActivity', () => {
    const props = {
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'user'
    };

    const component = shallow(<TaskSetFinishedActivity details={props} />);

    it('renders the right icon', () => {
      assert.equal(component.find('SocrataIcon').prop('name'), 'checkmark3');
    });

    it('renders the right message', () => {
      assert.equal(
        component.find('p').text(),
        'Data processing successfully finished'
      );
    });

    it('renders a timestamp', () => {
      assert.equal(component.find('RecentActionsTimestamp').length, 1);
    });
  });

  describe('TaskSetFailedActivity', () => {
    const props = {
      createdAt: new Date('2017-08-31T20:20:01.942Z'),
      createdBy: 'user'
    };

    const component = shallow(<TaskSetFailedActivity details={props} />);

    it('renders the right icon', () => {
      assert.equal(component.find('SocrataIcon').prop('name'), 'failed');
    });

    it('renders the right message', () => {
      assert.equal(component.find('p').text(), 'Data processing failed');
    });

    it('renders a timestamp', () => {
      assert.equal(component.find('RecentActionsTimestamp').length, 1);
    });
  });
});
