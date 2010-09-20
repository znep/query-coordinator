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
        $('.contentHeader').removeClass('signIn').addClass('signUp');
    });
    $('.signInLink').click(function(event)
    {
        event.preventDefault();
        $('.signupForm').slideUp();
        $('.loginForm').slideDown();
        $('.authAction').text('log in');
        $('.hintSwap .actionText').text('Sign in');
        $('.contentHeader').removeClass('signUp').addClass('signIn');
    });
});
