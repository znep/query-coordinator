$(function() {
  $(':checkbox').uniform();
  $('#user_session_login').focus();
  $('.signUpLink:not(.whyLink)').click(function(event) {
    event.preventDefault();
    $('.loginForm').hide();
    $('.signupForm').show();
    blist.util.loadCaptcha('captchaPlaceholder');
    $('.rpxPrompt').text($.t('account.common.rpx.prompt.sign_up'));
    $('.thirdPartyLinks .authProvider .description').each(function() {
      var $this = $(this);
      $this.html($.t('account.common.rpx.providers.' + $this.attr('data-providerid') + '.sign_up_html'));
    });
    $('.modalContentBox').removeClass('loginModal').addClass('signupModal');
  });
});
