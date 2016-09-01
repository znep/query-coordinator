import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import FlashMessage from './flashMessage';
import NavigationControl from './navigationControl';
import {socrataFetch, authenticityToken, appToken} from '../server';
import airbrake from '../airbrake';

type EsriSource
  = {url: string, contactEmail: string, privacy: string}

type EsriState
  = { type: 'NotStarted', esriSource: EsriSource }
  | { type: 'Started', esriSource: EsriSource}
  | { type: 'Cancelled' }
  | { type: 'Failed', error: string, esriSource: EsriSource }
  | { type: 'Created', esriSource: EsriSource, dataset: Object }
  | { type: 'Complete', esriSource: EsriSource, dataset: Object };


function renderErrorMessage(connectToEsri) {
  if (!connectToEsri.error) return;
  return <FlashMessage flashType="error" message={connectToEsri.error} />;
}

function createLayer(goToPrevious, onComplete) {
  return (dispatch, getState) => {
    const onUnknownError = (reason) => {
      goToPrevious();
      dispatch(onLayerError({
        message: I18n.screens.import_pane.unknown_error
      }));
      airbrake.notify({
        error: reason,
        context: { component: 'connectToEsri' }
      });
    };

    const {datasetId: draftViewUid, connectToEsri: {esriSource: {url}}} = getState();
    dispatch(onLayerStarted());
    socrataFetch(`/api/layers.json?method=createMapLayerDataset&url=${url}&draftViewUid=${draftViewUid}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': authenticityToken,
        'X-App-Token': appToken,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((result) => {
      if (isCancelled(getState())) {
        return;
      }

      switch (result.status) {
        case 200:
          return result.json().then((resp) => {
            dispatch(onLayerCreated(resp));
            dispatch(setViewMetadata(goToPrevious, onUnknownError, onComplete));
          });
        default:
          return result.json().then((resp) => {
            goToPrevious();
            dispatch(onLayerError(resp));
          }).catch(onUnknownError);
          // core usually times out and returns an html 504 because we are syncronously
          // crawling an esri server... .. .
      }
    }).catch(onUnknownError);
  };
}

function setViewMetadata(goToPrevious, onUnknownError, onComplete) {
  return (dispatch, getState) => {
    const {connectToEsri: {dataset, esriSource: {contactEmail, privacy}}} = getState();
    const payload = _.deepCopy(dataset);

    payload.privateMetadata = payload.privateMetadata || {};
    payload.privateMetadata.contactEmail = contactEmail;
    if (privacy === 'public') {
      payload.flags.push('dataPublicRead');
    }


    return socrataFetch(`/api/views/${payload.id}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    }).then((response) => {
      return response.json().then((body) => {
        if (response.status >= 200 && response.status < 300) {
          dispatch(onLayerCompleted(body));
          onComplete();
        } else {
          goToPrevious();
          dispatch(onLayerError(body));
        }
      }).catch(onUnknownError);
    }).catch(onUnknownError);
  };
}

function isCancelled(state) {
  return state.connectToEsri.type === 'Cancelled';
}

const LAYER_STARTED = 'LAYER_STARTED';
function onLayerStarted() {
  return {
    type: LAYER_STARTED
  };
}

const LAYER_CREATED = 'LAYER_CREATED';
function onLayerCreated(dataset) {
  return {
    type: LAYER_CREATED,
    dataset
  };
}

const LAYER_COMPLETE = 'LAYER_COMPLETE';
function onLayerCompleted(dataset) {
  return {
    type: LAYER_COMPLETE,
    dataset
  };
}

const LAYER_ERROR = 'LAYER_ERROR';
function onLayerError(result) {
  return {
    type: LAYER_ERROR,
    result
  };
}

const URL_UPDATE = 'URL_UPDATE';
function urlUpdate(url: string) {
  return {
    type: URL_UPDATE,
    url
  };
}

const EMAIL_UPDATE = 'EMAIL_UPDATE';
function contactEmailUpdate(contactEmail: string) {
  return {
    type: EMAIL_UPDATE,
    contactEmail
  };
}

const PRIVACY_UPDATE = 'PRIVACY_UPDATE';
function privacyUpdate(privacy: string) {
  return {
    type: PRIVACY_UPDATE,
    privacy
  };
}

export function update(state, action): EsriState {
  switch (action.type) {
    case URL_UPDATE:
      return {
        ...state,
        esriSource: {
          ...state.esriSource,
          url: action.url
        }
      };
    case EMAIL_UPDATE:
      return {
        ...state,
        esriSource: {
          ...state.esriSource,
          contactEmail: action.contactEmail
        }
      };
    case PRIVACY_UPDATE:
      return {
        ...state,
        esriSource: {
          ...state.esriSource,
          privacy: action.privacy
        }
      };
    case LAYER_CREATED:
      return {
        ...state,
        type: 'Created',
        dataset: action.dataset
      };
    case LAYER_COMPLETE:
      return {
        ...state,
        type: 'Complete'
      };
    case LAYER_ERROR:
      return {
        ...state,
        type: 'Failed',
        error: action.result.message
      };
    case LAYER_STARTED:
      return {
        ...state,
        type: 'Started'
      };
    default:
      return {
        type: 'NotStarted',
        esriSource: {
          url: '',
          contactEmail: '',
          privacy: false
        }
      };
  }
}

export function view({ dispatch, connectToEsri, goToPrevious, goToPage }) {
  function onUpdateUrl(event) {
    dispatch(urlUpdate(event.target.value));
  }
  function onUpdateContactEmail(event) {
    dispatch(contactEmailUpdate(event.target.value));
  }
  function onPrivacyChanged(event) {
    dispatch(privacyUpdate(event.target.value));
  }
  function onComplete() {
    dispatch(goToPage('Finish'));
  }

  const esriSource = connectToEsri.esriSource;
  var onNext = null;
  if (connectToEsri.esriSource.url.length) {
    onNext = () => {
      dispatch(createLayer(goToPrevious, onComplete));
      goToPage('Working');
    };
  }

  const t = I18n.screens.edit_metadata;

  return (
    <div>
      <ul>
        <li className="metadataPane">
          {renderErrorMessage(connectToEsri)}
          <p className="headline">
            {I18n.screens.dataset_new.metadata.prompt}
          </p>
          <div className="commonForm metadataForm">
            <div className="mapLayerMetadata">
              <div className="line clearfix">
                <label htmlFor="view_esri_src" className="required">
                  {I18n.screens.dataset_new.metadata.esri_map_layer_url}
                </label>
                <input
                  onChange={onUpdateUrl}
                  type="text"
                  value={connectToEsri.esriSource.url}
                  title="{I18n.screens.dataset_new.metadata.esri_source_url}" className="textPrompt required prompt" />
              </div>
            </div>
            <div className="attachmentsMetadata">
              <h2>{I18n.screens.dataset_new.metadata.attachments}</h2>
              <div className="attachmentsHowtoMessage">
                {t.attachmentsDisabledMessagePart1}
                <span> </span>
                <span className="about">
                  <span className="icon"></span>{t.about}
                </span>
                <span> </span>
                {t.attachmentsDisabledMessagePart2}
              </div>
            </div>
            <div className="privacyMetadata">
              <h2>{I18n.screens.dataset_new.metadata.privacy_security}</h2>
              <div className="line clearfix">
                <fieldset id="privacy-settings" className="radioblock">
                  <legend id="privacy-settings-legend">
                    {I18n.screens.dataset_new.metadata.privacy_settings}
                  </legend>
                  <div>
                    <div id="uniform-privacy_public" className="radio uniform">
                      <span>
                        <input
                          type="radio"
                          name="privacy"
                          checked={esriSource.privacy === 'public'}
                          onChange={onPrivacyChanged}
                          value="public" />
                      </span>
                    </div>
                    <label
                      htmlFor="privacy_public"
                      dangerouslySetInnerHTML={{__html: I18n.screens.dataset_new.metadata.public_explain}}>
                    </label>
                  </div>
                  <div>
                    <div id="uniform-privacy_private" className="radio uniform">
                      <span className="checked">
                        <input
                          type="radio"
                          name="privacy"
                          checked={esriSource.privacy === 'private'}
                          onChange={onPrivacyChanged}
                          value="private" />
                      </span>
                    </div>
                    <label
                      htmlFor="privacy_private"
                      dangerouslySetInnerHTML={{__html: I18n.screens.dataset_new.metadata.private_explain}}></label>
                  </div>
                </fieldset>
              </div>
              <div className="line clearfix">
                <label htmlFor="view_privateMetadata_contactEmail">
                  {t.contact_email}
                </label>
                <input
                  type="text"
                  onChange={onUpdateContactEmail}
                  value={connectToEsri.esriSource.contactEmail}
                  title="{t.email_address}"
                  className="textPrompt contactEmail prompt" />
                <div className="additionalHelp">
                  {t.email_help}
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <NavigationControl
        onPrev={goToPrevious}
        onNext={onNext}
        cancelLink="/profile" />
    </div>
  );
}

view.propTypes = {
  goToPrevious: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  goToPage: PropTypes.func.isRequired,
  connectToEsri: PropTypes.object.isRequired
};

