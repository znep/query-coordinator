import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import SourceSidebar, {
  SourceList
} from 'components/SourceSidebar/SourceSidebar';

describe('components/SourceSidebar', () => {
  const defaultProps = {
    entities: {},
    params: {},
    sources: [
      {
        id: 178,
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: new Date('2017-06-22T23:06:03.233Z'),
        source_type: {
          filename: 'one.xlsx',
          type: 'upload'
        },
        percentCompleted: 100,
        finished_at: new Date('2017-06-22T23:06:03.816Z'),
        inputSchemaId: 159,
        outputSchemaId: 215,
        isCurrent: true
      },
      {
        id: 177,
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: new Date('2017-06-22T23:03:59.932Z'),
        source_type: {
          filename: 'austin_animal_center_stray_map.csv',
          type: 'upload'
        },
        percentCompleted: 100,
        finished_at: new Date('2017-06-22T23:04:01.551Z'),
        inputSchemaId: 158,
        outputSchemaId: 214
      }
    ]
  };

  const component = shallow(<SourceSidebar {...defaultProps} />);

  describe('SourceSidebar', () => {
    it('shows a SourceList if there are sources', () => {
      assert.isTrue(component.find('SourceList').exists());
    });

    it('shows nothing if there are no sources', () => {
      const newProps = {
        ...defaultProps,
        sources: []
      };

      const component = shallow(<SourceSidebar {...newProps} />);

      assert.isFalse(component.find('SourceList').exists());
    });
  });

  describe('SourceList', () => {
    const component = shallow(<SourceList {...defaultProps} />);

    it('shows a list of all sources', () => {
      assert.equal(
        component.find('SourceItem').length,
        defaultProps.sources.length
      );
    });

    it('shows the current source in bold type', () => {
      assert.isTrue(
        component
          .find('SourceItem')
          .filterWhere(item => item.prop('source').isCurrent)
          .first()
          .dive()
          .find('Link')
          .hasClass('bold')
      );
    });
  });
});
