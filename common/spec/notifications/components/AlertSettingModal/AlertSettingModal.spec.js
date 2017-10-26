import _ from 'lodash';
import TestUtils from 'react-dom/test-utils';
import AlertSettingModal from 'common/notifications/components/AlertSettingModal/AlertSettingModal';
import AlertPreferenceAPI from 'common/notifications/api/AlertPreferenceAPI';
import renderLocalizationElement from '../../renderLocalizationComponent';

describe('AlertSettingModal', () => {
  let getPreference;

  beforeEach(() => {
    getPreference = sinon.stub(AlertPreferenceAPI, 'get').returns(Promise.resolve({ status: 200 }));
  });

  afterEach(() => {
    getPreference.restore();
  });

  it('renders an element', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, { onClose: spy });
    assert.isNotNull(element);
  });

  it('should renders an Modal with save, cancel buttons', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, { onClose: spy });
    assert.isNotNull(element.querySelectorAll('.alert-setting-modal'));
    assert.isNotNull(element.querySelectorAll('.btn-primary'));
    assert.isNotNull(element.querySelectorAll('.btn-simple'));
  });

  it('on load it should get all the saved preferences', () => {
    const spy = sinon.spy();
    renderLocalizationElement(AlertSettingModal, { onClose: spy });
    sinon.assert.calledOnce(getPreference);
  });

  it('on save should set alert preferences', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, { onClose: spy });
    const setPreference = sinon.stub(AlertPreferenceAPI, 'set').returns(Promise.resolve({ status: 200 }));
    const saveButton = element.querySelector('.save-button');
    assert.isNotNull(saveButton);
    TestUtils.Simulate.click(saveButton);
    sinon.assert.calledOnce(setPreference);
    setPreference.restore();
  });

  it('on cancel should close the modal', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(AlertSettingModal, { onClose: spy });
    const cancelButton = element.querySelector('.cancel-button');
    assert.isNotNull(cancelButton);
    TestUtils.Simulate.click(cancelButton);
    sinon.assert.calledOnce(spy);
  });

});
