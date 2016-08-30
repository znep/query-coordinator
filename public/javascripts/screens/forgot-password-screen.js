$(function() {
  $('#account_login').focus();

  // Form validation.
  $('#forgotPasswordForm').validate({
    rules: {
      'account[login]': 'required'
    }
  });
});
