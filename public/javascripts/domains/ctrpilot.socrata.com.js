$(function()
{
    var $feedbackWidg = $('.wbWidget');
    $feedbackWidg.find('h2').click(function(event)
    {
        $(this)
            .toggleClass('expanded')
            .siblings('.widgetContent').toggle();
    });

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
                .replace('{location}', self.document.location));
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
