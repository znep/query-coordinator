$(function() {
    $(':checkbox').uniform();
    $('#user_session_login').focus();
    $('.signUpLink').click(function(event)
    {
        event.preventDefault();
        $('.loginForm').slideUp();
        $('.signupForm').slideDown();
        $('.authAction').text('join');
        $('.hintSwap .actionText').text('Sign up');
        $('.modalContentBox').removeClass('loginModal').addClass('signupModal');
    });
    $('.signInLink').click(function(event)
    {
        event.preventDefault();
        $('.signupForm').slideUp();
        $('.loginForm').slideDown();
        $('.authAction').text('log in');
        $('.hintSwap .actionText').text('Sign in');
        $('.modalContentBox').removeClass('signupModal').addClass('loginModal');
    });
});
