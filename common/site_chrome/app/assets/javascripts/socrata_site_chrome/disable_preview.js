(function($) {
  if (!$) {
    return;
  }

  $(document).ready(function() {
    $('.disablePreviewMode').click(function(evt) {
      evt.preventDefault();
      // Apparently this is how you delete cookies?
      if ($.cookies) {
        $.cookies.del('socrata_site_chrome_preview');
      } else {
        document.cookie = 'socrata_site_chrome_preview=deleted; expires=' + new Date(0).toUTCString();
      }
      window.location.reload();
    });
  });
}(window.$));
