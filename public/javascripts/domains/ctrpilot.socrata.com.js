$(function()
{
    var $feedbackWidg = $('.footerWidget');
    $feedbackWidg.find('h2').click(function(event)
    {
        $(this).siblings('.widgetContent').toggle();
    });

    // social dropdown
    var $social = $('.worldBankSocialLinks .share');
    var $socialDropdown = $('.worldBankSocialLinks .socialDropdown');
    $social.click(function(event)
    {
        event.preventDefault();
        $socialDropdown.toggle();
        $social.toggleClass('active');
    });
});
