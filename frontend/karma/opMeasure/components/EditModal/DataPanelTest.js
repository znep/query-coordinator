import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import AssetSelector from 'common/components/AssetSelector';
import { DataPanel, mapStateToProps } from 'opMeasure/components/EditModal/DataPanel';

describe('DataPanel', () => {
  describe('mapStateToProps', () => {
    it('passes all saved data source properties', () => {
      const state = {};
      _.set(state, 'editor.measure.dataSourceLensUid', 'test-test');

      const mappedProps = mapStateToProps(state);
      assert.propertyVal(mappedProps.measure, 'dataSourceLensUid', 'test-test');
    });

    it('passes selected info from non-saved properties', () => {
      const state = {};
      _.set(state, 'editor.cachedRowCount', 101);
      _.set(state, 'editor.dataSourceView', { name: 'test value', description: 'not passed' });

      const mappedProps = mapStateToProps(state);
      assert.propertyVal(mappedProps, 'rowCount', 101);
      assert.propertyVal(mappedProps, 'dataSourceName', 'test value');
    });
  });

  describe('component', () => {
    let props;
    let element;

    const getProps = (propOverrides) => {
      return {
        onDataSourceChange: _.noop,
        ...propOverrides
      };
    };

    it('renders', () => {
      element = shallow(<DataPanel {...getProps()} />);
      assert.isTrue(element.exists());
    });

    describe('selection status notice', () => {
      const getDatasetName = (element) => element.find('.selected-dataset-name');
      const getText = (element) => element.find('.selected-dataset p');
      const getResetLink = (element) => element.find('a');
      const getSpinner = (element) => element.find('.selected-dataset .spinner-default');

      describe('when no dataset is selected', () => {
        beforeEach(() => {
          props = getProps({ rowCount: undefined });
          element = shallow(<DataPanel {...props} />);
        });

        it('displays the correct messages', () => {
          assert.equal(getDatasetName(element).text(), 'none');
          assert.include(getText(element).last().text(), 'Select the dataset');
        });

        it('does not render a reset link', () => {
          assert.isFalse(getResetLink(element).exists());
        });
      });

      describe('when fetching a dataset', () => {
        beforeEach(() => {
          props = getProps({ rowCount: null });
          element = shallow(<DataPanel {...props} />);
        });

        it('displays only a spinner', () => {
          assert.isTrue(getSpinner(element).exists());
          assert.isFalse(getDatasetName(element).exists());
          assert.isFalse(getText(element).exists());
          assert.isFalse(getResetLink(element).exists());
        });
      });

      describe('when dataset with data is selected', () => {
        beforeEach(() =>  {
          props = getProps({ dataSourceName: 'Valid Dataset', rowCount: 1 });
          element = shallow(<DataPanel {...props} />);
        });

        it('displays the correct messages', () => {
          assert.equal(getDatasetName(element).text(), 'Valid Dataset');
          assert.include(getText(element).last().text(), 'The dataset you\'ve selected is valid');
        });

        it('renders a reset link', () => {
          assert.isTrue(getResetLink(element).exists());
        });
      });

      describe('when a dataset without data is selected', () => {
        beforeEach(() =>  {
          props = getProps({ dataSourceName: 'Empty Dataset', rowCount: 0 });
          element = shallow(<DataPanel {...props} />);
        });

        it('displays the correct messages', () => {
          assert.equal(getDatasetName(element).text(), 'Empty Dataset');
          assert.include(getText(element).last().text(), 'The selected dataset doesn\'t have any data yet');
        });

        it('renders a reset link', () => {
          assert.isTrue(getResetLink(element).exists());
        });
      });

      describe('when a dataset with no date column is selected', () => {
        beforeEach(() =>  {
          props = getProps({
            measure: {
              dataSourceLensUid: 'test-test'
            },
            errors: {
              setDataSourceMetadataError: true
            }
          });
          element = shallow(<DataPanel {...props} />);
        });

        it('displays the correct messages', () => {
          assert.include(getText(element).last().text(), 'The selected dataset does not contain a date column');
        });
      });

      describe('when fetching dataset fails', () => {
        beforeEach(() =>  {
          props = getProps({
            measure: {
              dataSourceLensUid: 'test-test'
            },
            errors: {
              fetchDataSourceViewError: true
            }
          });
          element = shallow(<DataPanel {...props} />);
        });

        it('displays the correct messages', () => {
          assert.include(getText(element).last().text(), 'The selected dataset is not suitable');
        });
      });
    });

    describe('asset selector', () => {
      const fireOnAssetSelected = (asset) => element.find(AssetSelector).prop('onAssetSelected')(asset);
      beforeEach(() =>  {
        props = getProps({
          measure: {
            dataSourceLensUid: 'test-test'
          },
          onChangeDataSource: sinon.stub()
        });
        element = shallow(<DataPanel {...props} />);
      });

      it('onChangeDataSource called when different dataset is selected', () => {
        fireOnAssetSelected({ id: 'next-test' });
        sinon.assert.calledOnce(props.onChangeDataSource);
        sinon.assert.calledWith(props.onChangeDataSource, 'next-test');
      });

      it('onChangeDataSource NOT called when same dataset is selected', () => {
        fireOnAssetSelected({ id: 'test-test' });
        sinon.assert.notCalled(props.onChangeDataSource);
      });
    });
  });
});
