import _ from 'lodash';
import TestUtils from 'react-dom/test-utils';
import AlertSettingModal from 'common/notifications/components/AlertSettingModal/AlertSettingModal';
import AlertPreferenceStore from 'common/notifications/store/AlertPreferenceStore';
import renderLocalizationElement from '../../renderLocalizationComponent';

describe('AlertSettingModal', () => {
  function getProps(props) {
    return props
  }

  let getPreference;

  beforeEach(() => {
    getPreference = sinon.stub(AlertPreferenceStore, 'get', _.constant(Promise.resolve({status: 200})));
  });

  afterEach(() => {
    getPreference.restore();
  });

  it('renders an element', () => {
    var spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, getProps({onClose: spy}));
    assert.isNotNull(element);
  });

  it('should renders an Modal with save, cancel buttons', () => {
    var spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, getProps({onClose: spy}));
    assert.isNotNull(element.querySelectorAll('.alert-setting-modal'));
    assert.isNotNull(element.querySelectorAll('.btn-primary'));
    assert.isNotNull(element.querySelectorAll('.btn-simple'));
  });

  it('on load it should get all the saved preferences', () => {
    var spy = sinon.spy();
    renderLocalizationElement(AlertSettingModal, getProps({onClose: spy}));
    sinon.assert.calledOnce(getPreference);
  });

  it('on save should set alert preferences', () => {
    var spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, getProps({onClose: spy}));
    var setPreference = sinon.stub(AlertPreferenceStore, 'set', _.constant(Promise.resolve({status: 200})));
    var saveButton = element.querySelector('.save-btn');
    assert.isNotNull(saveButton);
    TestUtils.Simulate.click(saveButton);
    sinon.assert.calledOnce(setPreference);
    setPreference.restore();
  });

  it('on cancel should close the modal', () => {
    var spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, getProps({onClose: spy}));
    var cancelButton = element.querySelector('.cancel-btn');
    assert.isNotNull(cancelButton);
    TestUtils.Simulate.click(cancelButton);
    sinon.assert.calledOnce(spy);
  });

});
