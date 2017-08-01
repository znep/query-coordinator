import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import {
  UploadSidebar,
  mapStateToProps
} from 'components/Uploads/UploadSidebar';
import dotProp from 'dot-prop-immutable';
import state from '../../data/initialState';

describe('components/Uploads/UploadSidebar', () => {

  describe('render', () => {

    const defaultProps = {
      currentUpload: {
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
        outputSchemaId: 215
      },
      otherUploads: [
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

    const component = shallow(<UploadSidebar {...defaultProps} />);

    it('shows current sources', () => {
      const { id: renderedItemId } = component
        .find('UploadItem')
        .first()
        .prop('source');

      assert.equal(renderedItemId, defaultProps.currentUpload.id);
      assert.equal(component.find('h2').first().text(), 'Current Upload');
    });

    it('shows previous sources', () => {
      assert.equal(component.find('h2').last().text(), 'Other Uploads');
      assert.equal(component.find('ul').last().length, 1);
    });

    it("hides previous sources if there aren't any", () => {
      const newProps = dotProp.set(defaultProps, 'otherUploads', []);
      const component = shallow(<UploadSidebar {...newProps} />);
      assert.isFalse(component.find('h2').last.text === 'Other Uploads');
    });

    it('shows no sources message if there are no sources', () => {
      const newProps = { currentUpload: null, otherUploads: [] };
      const component = shallow(<UploadSidebar {...newProps} />);
      assert.equal(component.find('span').text(), 'No uploads yet');
    });

  });

  describe('mapStateToProps', () => {

    it('splits out a current upload when there is one', () => {
      const entities = {
        revisions: {
          0: { id: 0, output_schema_id: 0 }
        },
        sources: {
          0: { id: 0 },
          1: { id: 1 }
        },
        output_schemas: {
          0: { id: 0, input_schema_id: 0 }
        },
        input_schemas: {
          0: { id: 0, source_id: 0 }
        }
      };

      const { currentUpload, otherUploads } = mapStateToProps({ entities });
      assert.deepEqual(currentUpload, {
        id: 0
      });
      assert.deepEqual(otherUploads, [
        { id: 1 }
      ]);
    });

    it('returns null for current upload when there is no current one', () => {
      // rare case where there is no output_schema_id on the revision
      const entities = {
        revisions: {
          0: { id: 0, output_schema_id: null }
        },
        sources: {
          0: { id: 0 },
          1: { id: 1 }
        }
      };

      const { currentUpload, otherUploads } = mapStateToProps({ entities });
      assert.isNull(currentUpload);
      assert.deepEqual(otherUploads, [
        { id: 0 },
        { id: 1 }
      ]);
    });

    it('returns defaults if there are no sources', () => {
      const newState = dotProp.set(state, 'entities', existing => ({
        ...existing,
        sources: {},
        output_schemas: {}
      }));
      const { currentUpload, otherUploads } = mapStateToProps(newState);
      assert.isNull(currentUpload);
      assert.equal(otherUploads.length, 0);
    });

  });

});
