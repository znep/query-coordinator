import _ from 'lodash';
import FilterConfig from 'components/FilterBar/FilterConfig';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import { mockTextColumn } from './data';

describe('FilterConfig', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockTextColumn,
      onUpdate: _.noop
    });
  }

  const getHiddenOption = (element) => element.querySelector('.filter-options #hidden');
  const getViewersCanEditOption = (element) => element.querySelector('.filter-options #viewers-can-edit');

  it('renders options', () => {
    const element = renderComponent(FilterConfig, getProps());
    assert.isNotNull(getHiddenOption(element));
    assert.isNotNull(getViewersCanEditOption(element));
  });

  it('calls the onUpdate prop when the hidden option is selected', () => {
    const onUpdate = sinon.spy();
    const element = renderComponent(FilterConfig, getProps({ onUpdate }));
    const expectedPayload = _.merge({}, mockTextColumn, {
      isHidden: true
    });
    assert.equal(onUpdate.called, false);
    Simulate.change(getHiddenOption(element), { target: { checked: true } });
    assert.equal(onUpdate.calledWith(expectedPayload), true);
  });

  it('calls the onUpdate prop when the visible option is selected', () => {
    const onUpdate = sinon.spy();
    const element = renderComponent(FilterConfig, getProps({ onUpdate }));
    const expectedPayload = _.merge({}, mockTextColumn, {
      isHidden: false
    });
    assert.equal(onUpdate.called, false);
    Simulate.change(getViewersCanEditOption(element), { target: { checked: true } });
    assert.equal(onUpdate.calledWith(expectedPayload), true);
  });
});
