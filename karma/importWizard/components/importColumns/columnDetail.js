import TestUtils from 'react-addons-test-utils';

import {
  updateColumnName,
  updateColumnType,
  updateSourceColumn,
  showColumnTransforms,
  addColumnTransform,
  removeColumnTransform,
  changeColumnTransform
} from 'components/importColumns/columnDetail';

describe('columnDetail.js dispatchers', () => {
    let state;

    it('updateColumnName', () => {
        const result = updateColumnName('newName');
        expect(result).to.deep.equal({
            type: 'UPDATE_COLUMN_NAME',
            newName: 'newName'
        });
    });

    it('updateColumnType', () => {
        const result = updateColumnType('newType');
        expect(result).to.deep.equal({
            type: 'UPDATE_COLUMN_TYPE',
            newType: 'newType'
        });
    });

    it('updateSourceColumn', () => {
        const result = updateSourceColumn('newSourceColumn');
        expect(result).to.deep.equal({
            type: 'UPDATE_SOURCE_COLUMN',
            newSourceColumn: 'newSourceColumn'
        });
    });

    it('showColumnTransforms', () => {
        const result = showColumnTransforms(false);
        expect(result).to.deep.equal({
            type: 'UPDATE_COLUMN_SHOW_TRANSFORMS',
            showColumnTransforms: false
        });
    });

    it('addColumnTransform', () => {
        const result = addColumnTransform();
        expect(result).to.deep.equal({
            type: 'UPDATE_COLUMN_ADD_TRANSFORM'
        });
    });

    it('removeColumnTransform', () => {
        const result = removeColumnTransform(4);
        expect(result).to.deep.equal({
            type: 'UPDATE_COLUMN_REMOVE_TRANSFORM',
            removeIndex: 4
        });
    });

    it('changeColumnTransform', () => {
        const result = changeColumnTransform(5, {});
        expect(result).to.deep.equal({
            type: 'UPDATE_COLUMN_CHANGE_TRANSFORM',
            changeIndex: 5,
            newTransform: {}
        });
    });


});
