import renderLocalizationElement from '../../renderLocalizationComponent';
import MyAlertsApi from 'common/notifications/api/MyAlertsApi';
import MyAlerts from 'common/notifications/components/AlertSettingModal/MyAlerts/MyAlerts';

describe('MyAlerts', () => {
  let alertsApi;

  beforeEach(() => {
    alertsApi = sinon.stub(MyAlertsApi, 'get').returns(Promise.resolve({ status: 200 }));
  });

  afterEach(() => {
    alertsApi.restore();
  });

  it('renders an element', () => {
    const element = renderLocalizationElement(MyAlerts, {});
    assert.isNotNull(element);
  });

  it('should render my alerts table', () => {
    const element = renderLocalizationElement(MyAlerts, {});
    assert.isNotNull(element.querySelector('table'));
  });

  it('on load it should get all the alerts', () => {
    renderLocalizationElement(MyAlerts, {});
    sinon.assert.calledOnce(alertsApi);
  });

});
