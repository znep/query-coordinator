function handleError(xhr, textStatus, errorThrown, fromApi) {
  // TODO: airbrake this
  console.error('An error occurred while making a request to ' + fromApi + '.', xhr, textStatus, errorThrown);
  var message = $('#error-message');
  message.show();
  $('#create-text').show();
  $('#create-spinner').hide();
}

function createDataset() {
  $('#error-message').hide();
  $('#create-text').hide();
  $('#create-spinner').show();
  var datasetTitle = document.getElementById('dataset-title-input').value;
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
      displayType: 'table',
      name: datasetTitle
    }),
    success: function(newView) {
      $.ajax({
        type: 'POST',
        url: '/api/update/' + newView.id,
        headers: headers,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function() {
          document.location = '/d/' + newView.id + '/updates/0';
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

const form = document.getElementById('dataset-form');
form.onsubmit = createDataset;
