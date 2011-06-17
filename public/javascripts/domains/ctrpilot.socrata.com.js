$(function()
{
    var $feedbackWidg = $('.wbWidget');
    var toggleFeedback = function(event)
    {
        event.preventDefault();
        var $this = $(this);

        if (!$this.is('h2'))
        {
            $this = $feedbackWidg.find('h2');
        }
        $this.toggleClass('expanded')
             .siblings('.widgetContent').toggle();
    };
    $feedbackWidg.find('h2').click(toggleFeedback);
    $('#sidebarFeedbackLink').click(toggleFeedback);

    var title = document.title;
    if (title.indexOf('|') > -1)
    {
        title = title.substring(0, title.indexOf('|') - 1);
    }
    $('.worldBankSocialLinks .templatedLink').each(function()
    {
        $(this).attr('href',
            $(this).attr('href')
                .replace('{title}', title)
                .replace('{location}', document.location));
    });
    $('.worldBankSocialLinks .printLink').click(function(event)
    {
        event.preventDefault();
        window.print();
    });

    var patterns = {
        '/facet/countries': 'countries',
        '/page/organization': 'organization',
        '/page/funds': 'funds',
        '/page/faqs': 'faqs',
        '/browse': 'browse'
    };
    var match = 'home';
    for (var pattern in patterns)
    {
        if (window.location.pathname.indexOf(pattern) == 0)
        {
            match = patterns[pattern];
            break;
        }
    }
    $('.worldBankNav .textNav li.' + match).addClass('active');

    // // social dropdown
    // var $social = $('.worldBankSocialLinks .share');
    // var $socialDropdown = $('.worldBankSocialLinks .socialDropdown');
    // $social.click(function(event)
    // {
    //     event.preventDefault();
    //     $socialDropdown.toggle();
    //     $social.toggleClass('active');
    // });
});
