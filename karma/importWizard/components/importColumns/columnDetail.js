import TestUtils from 'react-addons-test-utils';

import * as CD from 'components/importColumns/columnDetail';

describe('columnDetail.js dispatchers', () => {
    let state;

    it('updateColumnName', () => {
        const result = CD.updateColumnName('newName');
        expect(result).to.deep.equal({
            type: CD.UPDATE_COLUMN_NAME,
            newName: 'newName'
        });
    });

    it('updateColumnType', () => {
        const result = CD.updateColumnType('newType');
        expect(result).to.deep.equal({
            type: CD.UPDATE_COLUMN_TYPE,
            newType: 'newType'
        });
    });

    it('updateSourceColumn', () => {
        const result = CD.updateSourceColumn('newSourceColumn');
        expect(result).to.deep.equal({
            type: CD.UPDATE_SOURCE_COLUMN,
            newSourceColumn: 'newSourceColumn'
        });
    });

    it('showColumnTransforms', () => {
        const result = CD.showColumnTransforms(false);
        expect(result).to.deep.equal({
            type: CD.UPDATE_COLUMN_SHOW_TRANSFORMS,
            showColumnTransforms: false
        });
    });

    it('addColumnTransform', () => {
        const result = CD.addColumnTransform();
        expect(result).to.deep.equal({
            type: CD.UPDATE_COLUMN_ADD_TRANSFORM
        });
    });

    it('removeColumnTransform', () => {
        const result = CD.removeColumnTransform(4);
        expect(result).to.deep.equal({
            type: CD.UPDATE_COLUMN_REMOVE_TRANSFORM,
            removeIndex: 4
        });
    });

    it('changeColumnTransform', () => {
        const result = CD.changeColumnTransform(5, {});
        expect(result).to.deep.equal({
            type: CD.UPDATE_COLUMN_CHANGE_TRANSFORM,
            changeIndex: 5,
            newTransform: {}
        });
    });
});

describe('columnDetail.js reducer', () => {

    let dummyState = {'a': 1, 'b': 2};

    it('handles name update', () => {
        const action = {
            type: CD.UPDATE_COLUMN_NAME,
            newName: 'newName'
        };
        const result = CD.update(dummyState, action);
        expect(result).to.deep.equal({
            name: 'newName',
            ...dummyState
        });
    });

    it('handles type update', () => {
        const action = {
            type: CD.UPDATE_COLUMN_TYPE,
            newType: 'notmy'
        };
        const result = CD.update(dummyState, action);
        expect(result).to.deep.equal({
            chosenType: 'notmy',
            ...dummyState
        });
    });

    it('handles new source column', () => {
        const action = {
            type: CD.UPDATE_SOURCE_COLUMN,
            newSourceColumn: 'new'
        }
        const result = CD.update(dummyState, action);
        expect(result).to.deep.equal({
            sourceColumn: 'new',
            ...dummyState
        });
    });

    it('shows column transforms', () => {
        const action = {
            type: CD.UPDATE_COLUMN_SHOW_TRANSFORMS,
            showColumnTransforms: true
        };
        const result = CD.update(dummyState, action);
        expect(result).to.deep.equal({
            showColumnTransforms: true,
            ...dummyState
        });
    })

    it('adds the first transform', () => {
        const action = {
            type: CD.UPDATE_COLUMN_ADD_TRANSFORM
        };
        const result = CD.update(dummyState, action);
        expect(result.transforms.length).to.equal(1);
        expect(result.transforms[0].type).to.equal('title');
    });

    it('adds the second transform', () => {
        const action = {
            type: CD.UPDATE_COLUMN_ADD_TRANSFORM
        };
        dummyState.transforms = [ {type: 'notmy'} ];
        const result = CD.update(dummyState, action);
        expect(result.transforms.length).to.equal(2);
        expect(result.transforms[0].type).to.equal('notmy');
        expect(result.transforms[1].type).to.equal('title');
    });

    it('removes the only transform', () => {
        const action = {
            type: CD.UPDATE_COLUMN_REMOVE_TRANSFORM,
            removeIndex: 0
        };
        dummyState.transforms = [ {} ];
        const result = CD.update(dummyState, action);
        expect(result.transforms.length).to.equal(0);
    });

    it('removes the third of five transforms', () => {
        const action = {
            type: CD.UPDATE_COLUMN_REMOVE_TRANSFORM,
            removeIndex: 2
        };
        dummyState.transforms = [
            {type: 'first'},
            {type: 'second'},
            {type: 'third'},
            {type: 'fourth'},
            {type: 'fifth'}
        ];
        const result = CD.update(dummyState, action);
        expect(result.transforms.length).to.equal(4);
        expect(result.transforms[1].type).to.equal('second');
        expect(result.transforms[2].type).to.equal('fourth');
    });

    it('changes a transform', () => {
        const action = {
            type: CD.UPDATE_COLUMN_CHANGE_TRANSFORM,
            changeIndex: 1,
            newTransform: {type: 'new'}
        }
        dummyState.transforms = [
            {type: 'first'},
            {type: 'second'},
            {type: 'third'}
        ];
        const result = CD.update(dummyState, action);
        expect(result.transforms.length).to.equal(3);
        expect(result.transforms[0].type).to.equal('first');
        expect(result.transforms[1].type).to.equal('new');
        expect(result.transforms[2].type).to.equal('third');
    });
});
