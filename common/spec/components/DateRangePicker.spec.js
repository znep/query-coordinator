import _ from 'lodash';
import { renderComponent } from '../helpers';
import DateRangePicker from 'components/DateRangePicker';
import { Simulate } from 'react-dom/test-utils';

describe('DateRangePicker', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      value: {
        start: '1500-12-01T00:00:00',
        end: '1700-12-01T00:00:00'
      },
      onChange: _.noop
    });
  }

  const getInputs = (element) => element.querySelectorAll('input[value][type="text"]');

  it('renders an element', () => {
    const element = renderComponent(DateRangePicker, getProps());
    assert.isNotNull(element);
  });

  it('uses the start and end values if provided', () => {
    const element = renderComponent(DateRangePicker, getProps({
      value: {
        start: '1400-12-01T00:00:00',
        end: '1800-12-01T00:00:00'
      }
    }));

    const inputs = getInputs(element);

    assert.lengthOf(inputs, 2);
    assert.equal(inputs[0].value, '12/01/1400');
    assert.equal(inputs[1].value, '12/01/1800');
  });

  it('invokes the onChange handler on change', () => {
    const stub = sinon.stub();
    const element = renderComponent(DateRangePicker, getProps({
      onChange: stub
    }));

    const inputs = getInputs(element);
    inputs[0].value = '12/01/1600';
    Simulate.change(inputs[0]);

    assert.deepEqual(stub.called, true);
  });

  it('invokes the onChange handler with props start date if start date is invalid', () => {
    const stub = sinon.stub();
    const element = renderComponent(DateRangePicker, getProps({
      onChange: stub
    }));

    const inputs = getInputs(element);
    inputs[0].value = '';
    Simulate.change(inputs[0]);

    const expectedValues = {
      start: '1500-12-01T00:00:00',
      end: '1700-12-01T23:59:59'
    };

    assert.deepEqual(stub.calledWith(expectedValues), true);
  });

  it('invokes the onChange handler with props end date if end date is invalid', () => {
    const stub = sinon.stub();
    const element = renderComponent(DateRangePicker, getProps({
      onChange: stub
    }));

    const inputs = getInputs(element);
    inputs[1].value = '';
    Simulate.change(inputs[1]);

    const expectedValues = {
      start: '1500-12-01T00:00:00',
      end: '1700-12-01T23:59:59'
    };

    assert.deepEqual(stub.calledWith(expectedValues), true);
  });

  it('includes the entire day for the end date', () => {
    const stub = sinon.stub();
    const element = renderComponent(DateRangePicker, getProps({
      onChange: stub
    }));

    const inputs = getInputs(element);
    inputs[1].value = '12/01/1600';
    Simulate.change(inputs[1]);

    const expectedValues = {
      start: '1500-12-01T00:00:00',
      end: '1600-12-01T23:59:59'
    };

    assert.deepEqual(stub.calledWith(expectedValues), true);
  });

  it('includes the entire day for the start date', () => {
    const stub = sinon.stub();
    const element = renderComponent(DateRangePicker, getProps({
      onChange: stub
    }));

    const inputs = getInputs(element);
    inputs[0].value = '12/01/1600';
    Simulate.change(inputs[0]);

    const expectedValues = {
      start: '1600-12-01T00:00:00',
      end: '1700-12-01T23:59:59'
    };

    assert.deepEqual(stub.calledWith(expectedValues), true);
  });
});
