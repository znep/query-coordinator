$(function() {
  $(':checkbox').uniform();
  $('#user_session_login').focus();
  $('.signUpLink:not(.whyLink)').click(function(event) {
    event.preventDefault();
    $('.loginForm').hide();
    $('.signupForm').show();
    blist.util.loadCaptcha('captchaPlaceholder');
    $('.modalContentBox').removeClass('loginModal').addClass('signupModal');
  });

  // this only pertains to the signup screen to switch between creating an account
  // and linkin an existing one
  // (when clicking the Sign In button in the top-right,
  //  you're just redirected to /login for now)
  $('.signInLink[href=#login]').click(function(event) {
    event.preventDefault();
    $('.signupForm').hide();
    $('.loginForm').show();
  });
});
