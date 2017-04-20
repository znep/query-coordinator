window.$ = window.jQuery = require('jquery');

var inProgress = false;

function updateButtonDisplay() {
  const busyBtn = $('#create-spinner');
  const disabledBtn = $('#create-text-disabled');
  const readyBtn = $('#create-text');
  const errorMessage = $('#error-message');
  const datasetTitle = document.getElementById('dataset-title-input').value;

  busyBtn.hide(); disabledBtn.hide(); readyBtn.hide();

  if (inProgress) {
    busyBtn.show();
    errorMessage.hide();
  } else if (datasetTitle != '') {
    readyBtn.show();
  } else {
    disabledBtn.show();
  }
}

function handleError(xhr, textStatus, errorThrown, fromApi) {
  // TODO: airbrake this
  console.error('An error occurred while making a request to ' + fromApi + '.', xhr, textStatus, errorThrown);
  var message = $('#error-message');
  message.show();
  inProgress = false;
  updateButtonDisplay();
}

function createDataset() {
  var datasetTitle = document.getElementById('dataset-title-input').value;
  if (inProgress || datasetTitle == '') return false;
  inProgress = true;
  updateButtonDisplay();
  var headers = {
    'X-CSRF-Token': window.serverConfig.csrfToken,
    'X-App-Token': window.serverConfig.appToken
  };
  $.ajax({
    type: 'POST',
    url: '/api/views',
    headers: headers,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    data: JSON.stringify({
      displayType: 'draft',
      name: datasetTitle
    }),
    success: function(newView) {
      $.ajax({
        type: 'POST',
        url: '/api/publishing/v1/revision/' + newView.id,
        headers: headers,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function() {
          document.location = '/d/' + newView.id + '/revisions/0';
        },
        error: function(xhr, textStatus, errorThrown) {
          handleError(xhr, textStatus, errorThrown, 'dsmapi');
        }
      });
    },
    error: function(xhr, textStatus, errorThrown) {
      handleError(xhr, textStatus, errorThrown, 'core');
    }
  });
  return false;
}

const form = $('#dataset-form');
form.on('submit', createDataset);

const titleTextBox = $('#dataset-title-input');
titleTextBox.on('input', updateButtonDisplay);

updateButtonDisplay();
