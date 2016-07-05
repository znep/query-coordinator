import TestUtils from 'react-addons-test-utils';

import * as CD from 'components/importColumns/columnDetail';
import * as ExampleData from '../exampleData';

describe('columnDetail component', () => {

  const A_SOURCE_COLUMN = ExampleData.translationWithoutTransforms[0].columnSource.sourceColumn;
  const A_RESULT_COLUMN = ExampleData.translationWithoutTransforms[0];

  describe('action creators', () => {

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

    it('setColumnSourceSingleColumn', () => {
      const result = CD.setColumnSourceSingleColumn(A_SOURCE_COLUMN);
      expect(result).to.deep.equal({
        type: CD.SET_COLUMN_SOURCE_SINGLE_COLUMN,
        sourceColumn: A_SOURCE_COLUMN
      });
    });

    it('updateShowTransforms', () => {
      const result = CD.updateShowTransforms(false);
      expect(result).to.deep.equal({
        type: CD.UPDATE_SHOW_TRANSFORMS,
        showColumnTransforms: false
      });
    });

    it('addTransform', () => {
      const result = CD.addTransform();
      expect(result).to.deep.equal({
        type: CD.ADD_TRANSFORM
      });
    });

    it('removeTransform', () => {
      const result = CD.removeTransform(4);
      expect(result).to.deep.equal({
        type: CD.REMOVE_TRANSFORM,
        removeIndex: 4
      });
    });

    it('updateTransform', () => {
      const result = CD.updateTransform(5, {});
      expect(result).to.deep.equal({
        type: CD.UPDATE_TRANSFORM,
        changeIndex: 5,
        newTransform: {}
      });
    });
  });

  describe('reducer', () => {

    describe('basics', () => {

      it('handles name update', () => {
        const result = CD.update(A_RESULT_COLUMN, CD.updateColumnName('newName'));
        expect(result).to.deep.equal({
          ...A_RESULT_COLUMN,
          name: 'newName'
        });
      });

      it('handles type update', () => {
        const result = CD.update(A_RESULT_COLUMN, CD.updateColumnType('notmy'));
        expect(result).to.deep.equal({
          ...A_RESULT_COLUMN,
          chosenType: 'notmy'
        });
      });

      it('handles new source column', () => {
        const result = CD.update(A_RESULT_COLUMN, CD.setColumnSourceSingleColumn(A_SOURCE_COLUMN));
        expect(result).to.deep.equal({
          ...A_RESULT_COLUMN,
          columnSource: {
            type: 'SingleColumn',
            sourceColumn: A_SOURCE_COLUMN
          }
        });
      });

    });

    describe('transforms', () => {

      it('shows column transforms', () => {
        const result = CD.update(A_RESULT_COLUMN, CD.updateShowTransforms(true));
        expect(result).to.deep.equal({
          showColumnTransforms: true,
          ...A_RESULT_COLUMN
        });
      });

      it('adds the first transform', () => {
        const result = CD.update(A_RESULT_COLUMN, CD.addTransform());
        expect(result.transforms).to.deep.equal([
          { type: 'title' }
        ]);
      });

      it('adds the second transform', () => {
        const resultColumn = {
          ...A_RESULT_COLUMN,
          transforms: [ {type: 'lower'} ]
        };
        const result = CD.update(resultColumn, CD.addTransform());
        expect(result.transforms).to.deep.equal([
          { type: 'lower' },
          { type: 'title' }
        ]);
      });

      it('removes the only transform', () => {
        const resultColumn = {
          ...A_RESULT_COLUMN,
          transforms: [ { type: 'upper' } ]
        };
        const result = CD.update(resultColumn, CD.removeTransform(0));
        expect(result.transforms).to.deep.equal([]);
      });

      it('removes the third of five transforms', () => {
        const resultColumn = {
          ...A_RESULT_COLUMN,
          transforms: [
            {type: 'first'},
            {type: 'second'},
            {type: 'third'},
            {type: 'fourth'},
            {type: 'fifth'}
          ]
        };
        const result = CD.update(resultColumn, CD.removeTransform(2));
        expect(result.transforms.length).to.equal(4);
        expect(result.transforms[1].type).to.equal('second');
        expect(result.transforms[2].type).to.equal('fourth');
      });

      it('changes a transform', () => {
        const resultColumn = {
          ...A_RESULT_COLUMN,
          transforms: [
            {type: 'first'},
            {type: 'second'},
            {type: 'third'}
          ]
        };
        const result = CD.update(resultColumn, CD.updateTransform(1, {type: 'new'}));
        expect(result.transforms).to.deep.equal([
          {type: 'first'},
          {type: 'new'},
          {type: 'third'}
        ]);
      });

    });

    describe('composite columns', () => {

      const EMPTY_COMPOSITE_COLUMN_SOURCE = {
        type: 'CompositeColumn',
        components: []
      };

      const RESULT_COLUMN_COMPOSITE_SOURCE = {
        ...A_RESULT_COLUMN,
        columnSource: EMPTY_COMPOSITE_COLUMN_SOURCE
      };

      it('changes the column source to composite', () => {
        const result = CD.update(A_RESULT_COLUMN, CD.setColumnSourceToComposite());
        expect(result.columnSource).to.deep.equal(EMPTY_COMPOSITE_COLUMN_SOURCE);
      });

      it('adds a source column component to the composite column', () => {
        const action = CD.updateColumnSourceComposite(CD.addComponent(A_SOURCE_COLUMN));
        const result = CD.update(RESULT_COLUMN_COMPOSITE_SOURCE, action);
        expect(result.columnSource).to.deep.equal({
          type: 'CompositeColumn',
          components: [
            A_SOURCE_COLUMN
          ]
        });
      });

      it('changes a source column component to a constant component', () => {
        const action = CD.updateColumnSourceComposite(CD.updateComponent(0, 'constant'));
        const result = CD.update(
          {
            ...A_RESULT_COLUMN,
            columnSource: {
              type: 'CompositeColumn',
              components: [
                A_SOURCE_COLUMN
              ]
            }
          },
          action
        );
        expect(result.columnSource).to.deep.equal({
          type: 'CompositeColumn',
          components: [
            'constant'
          ]
        });
      });

      it('removes a component from the middle of the list', () => {
        const action = CD.updateColumnSourceComposite(CD.removeComponent(1));
        const result = CD.update(
          {
            ...A_RESULT_COLUMN,
            columnSource: {
              type: 'CompositeColumn',
              components: [
                A_SOURCE_COLUMN,
                'constant',
                A_SOURCE_COLUMN
              ]
            }
          },
          action
        );
        expect(result.columnSource).to.deep.equal({
          type: 'CompositeColumn',
          components: [
            A_SOURCE_COLUMN,
            A_SOURCE_COLUMN
          ]
        });
      });

    });

  });


});
