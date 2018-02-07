window.$ = window.jQuery = require('jquery');

var inProgress = false;

function updateButtonDisplay() {
  const busyBtn = $('#create-spinner');
  const disabledBtn = $('#create-text-disabled');
  const readyBtn = $('#create-text');
  const errorMessage = $('#error-message');
  const datasetTitle = document.getElementById('dataset-title-input').value;

  busyBtn.hide();
  disabledBtn.hide();
  readyBtn.hide();

  if (inProgress) {
    busyBtn.show();
    errorMessage.hide();
  } else if (datasetTitle != '') {
    readyBtn.show();
  } else {
    disabledBtn.show();
  }
}

function handleError(xhr, textStatus, errorThrown, fromApi, reason) {
  // TODO: airbrake this
  console.error(
    'An error occurred while making a request to ' + fromApi + '.',
    xhr,
    textStatus,
    errorThrown
  );
  var message = $('#error-message');
  message.show();
  if (reason) {
    message.text(reason);
  }
  inProgress = false;

  updateButtonDisplay();
}

function handleRevisionError(
  view,
  xhr,
  textStatus,
  errorThrown,
  headers,
  fromApi
) {
  $.ajax({
    type: 'DELETE',
    url: '/api/views/' + view.id,
    headers: headers
  });

  handleError(xhr, textStatus, errorThrown, fromApi);
}

function createDataset() {
  var datasetTitle = document.getElementById('dataset-title-input').value;
  const revisionData = { action: {type: 'replace'}, is_parent: window.urlParams.isDataAsset};

  if (inProgress || datasetTitle == '') return false;
  inProgress = true;
  updateButtonDisplay();
  var headers = {
    'X-CSRF-Token': window.serverConfig.csrfToken,
    'X-App-Token': window.serverConfig.appToken
  };
  var deletedAt = window.urlParams.deletedAt;

  $.ajax({
    type: 'POST',
    url: '/api/views' + ((deletedAt && deletedAt.length != 0) ? '?deleted_at=' + deletedAt : ''),
    headers: headers,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    data: JSON.stringify({
      displayType: 'draft',
      name: datasetTitle
    }),
    success: function(newView) {
      var locale = document.location.pathname.match(/^\/[a-zA-Z]{2}\//);

      $.ajax({
        type: 'POST',
        url: '/api/publishing/v1/revision/' + newView.id,
        headers: headers,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(revisionData),
        success: function() {
          document.location =
            (locale ? locale[0] : '/') + 'd/' + newView.id + '/revisions/0';
        },
        error: function(xhr, textStatus, errorThrown) {
          handleRevisionError(
            newView,
            xhr,
            textStatus,
            errorThrown,
            headers,
            'dsmapi'
          );
        }
      });
    },
    error: function(xhr, textStatus, errorThrown) {
      handleError(xhr, textStatus, errorThrown, 'core', xhr.responseJSON.message);
    }
  });
  return false;
}

const form = $('#dataset-form');
form.on('submit', createDataset);

const titleTextBox = $('#dataset-title-input');
titleTextBox.on('input', updateButtonDisplay);

updateButtonDisplay();
