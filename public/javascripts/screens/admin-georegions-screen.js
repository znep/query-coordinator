;$(function()
{
  var t = function(str, props) { return $.t('screens.admin.metadata.' + str, props); };

  $('.button', 'td.toggle-enabled, td.edit-action, td.remove-action').adminButton({
    callback: function(response, $line, $link) {
      alert('TBD');
    }
  });
});
