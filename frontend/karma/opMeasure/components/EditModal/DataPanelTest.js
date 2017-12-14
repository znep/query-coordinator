import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { shallow, mount } from 'enzyme';

import { DataPanel, DataSourceStates, mapStateToProps } from 'components/EditModal/DataPanel';

describe('DataPanel', () => {
  describe('mapStateToProps', () => {
    it('passes all saved data source properties', () => {
      const state = {};
      _.set(state, 'editor.measure.metric.dataSource.uid', 'test-test');
      _.set(state, 'editor.measure.metric.dataSource.arbitrary', 'test value');

      const mappedProps = mapStateToProps(state);
      assert.propertyVal(mappedProps, 'uid', 'test-test');
      assert.propertyVal(mappedProps, 'arbitrary', 'test value');
    });

    it('passes selected info from non-saved properties', () => {
      const state = {};
      _.set(state, 'editor.cachedRowCount', 101);
      _.set(state, 'editor.dataSourceViewMetadata', { name: 'test value', description: 'not passed' });

      const mappedProps = mapStateToProps(state);
      assert.propertyVal(mappedProps, 'rowCount', 101);
      assert.propertyVal(mappedProps, 'dataSourceName', 'test value');
      assert.notPropertyVal(mappedProps, 'dataSourceDescription');
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

      describe('when an invalid dataset is selected', () => {
        beforeEach(() =>  {
          props = getProps({ dataSourceName: 'Invalid Dataset', rowCount: -1, uid: 'test-test' });
          element = shallow(<DataPanel {...props} />);
        });

        it('displays the correct messages', () => {
          assert.equal(getDatasetName(element).text(), 'test-test');
          assert.include(getText(element).last().text(), 'The selected dataset is not suitable');
        });

        it('renders a reset link', () => {
          assert.isTrue(getResetLink(element).exists());
        });
      });
    });

    describe('asset selector', () => {
      const getIframe = (element) => element.find('iframe');

      describe('when selecting a different dataset', () => {
        it('calls onChangeDataSource when the "Choose" button is clicked', () => {
          props = getProps({ uid: 'test-test', onChangeDataSource: sinon.spy() });
          element = mount(<DataPanel {...props} />);

          getIframe(element).node.onDatasetSelected({ id: 'four-four' });
          sinon.assert.calledWithExactly(props.onChangeDataSource, 'four-four');
        });
      });

      describe('when selecting an already-selected dataset', () => {
        it('does not call onChangeDataSource when the "Choose" button is clicked', () => {
          props = getProps({ uid: 'test-test', onChangeDataSource: sinon.spy() });
          element = mount(<DataPanel {...props} />);

          getIframe(element).node.onDatasetSelected({ id: 'test-test' });
          sinon.assert.notCalled(props.onChangeDataSource);
        });
      });
    });
  });
});
