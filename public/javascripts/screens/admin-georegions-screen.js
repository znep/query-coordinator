;$(function()
{
  var t = function(str, props) { return $.t('screens.admin.metadata.' + str, props); };

  $('.removeFieldsetButton').click(function(event)
  {
    if (!confirm(t('are_you_sure')))
    {
      event.preventDefault();
    }
  });

  var buttonMap = {
    'required': {
      'on': 'required',
      'off': 'optional'
    },
    'private': {
      'on': 'private',
      'off': 'public'
    }
  };

  $('.toggleButton').adminButton({
    callback: function(response,$line, $link)
    {
      $link
        .val(t('make_' + buttonMap[response.option][response.value ? 'off' : 'on']))
        .closest('.item')
        .toggleClass(response.option);
    }
  });

  $('.customFields .requiredCheckbox').uniform();
});
