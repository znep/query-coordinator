$(function() {
    $(':checkbox').uniform();
    $('#user_session_login').focus();
    $('.signUpLink').click(function(event)
    {
        event.preventDefault();
        $('.loginForm').slideUp();
        $('.signupForm').slideDown();
        $('.authAction').text('join');
        $('.modalHeader').toggle();
    });
    $('.signInLink').click(function(event)
    {
        event.preventDefault();
        $('.signupForm').slideUp();
        $('.loginForm').slideDown();
        $('.authAction').text('log in');
        $('.modalHeader').toggle();
    });
});
