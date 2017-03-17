import FilterConfig from 'components/FilterBar/FilterConfig';
import { Simulate } from 'react-addons-test-utils';
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
  const getRemoveButton = (element) => element.querySelector('.remove-btn');

  it('renders options', () => {
    const element = renderComponent(FilterConfig, getProps());
    expect(getHiddenOption(element)).to.exist;
    expect(getViewersCanEditOption(element)).to.exist;
  });

  it('calls the onUpdate prop when the hidden option is selected', () => {
    const onUpdate = sinon.spy();
    const element = renderComponent(FilterConfig, getProps({ onUpdate }));
    const expectedPayload = _.merge({}, mockTextColumn, {
      isHidden: true
    });
    expect(onUpdate.called).to.equal(false);
    Simulate.change(getHiddenOption(element), { target: { checked: true } });
    expect(onUpdate.calledWith(expectedPayload)).to.equal(true);
  });

  it('calls the onUpdate prop when the visible option is selected', () => {
    const onUpdate = sinon.spy();
    const element = renderComponent(FilterConfig, getProps({ onUpdate }));
    const expectedPayload = _.merge({}, mockTextColumn, {
      isHidden: false
    });
    expect(onUpdate.called).to.equal(false);
    Simulate.change(getViewersCanEditOption(element), { target: { checked: true } });
    expect(onUpdate.calledWith(expectedPayload)).to.equal(true);
  });
});
