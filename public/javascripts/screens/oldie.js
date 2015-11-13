$(function()
{
    // render the warning modal
    $.tag(
        { tagName: 'div', 'class': 'modalDialog noIeModal', contents: [
            { tagName: 'h2', contents: 'Outdated Browser Detected' },
            { tagName: 'p', 'class': 'modalParagraph', contents:
                'Socrata.com uses the latest in Web technologies to bring you ' +
                'the most advanced Social Data Discovery experience.  We\'ve ' +
                'noticed that you are using a very old Web browser, Internet ' +
                'Explorer version 8 or earlier.  Socrata.com may not work properly when ' +
                'viewed using this software.  To experience the next generation ' +
                'of data transparency we recommend you upgrade to a newer version ' +
                'of your Web browser.' },
            { tagName: 'div', 'class': 'finishButtons', contents: [
                { tagName: 'a', 'class': 'button default jqmClose', href: '#',
                    contents: 'Got it' },
                { tagName: 'a', 'class': 'button', href: 'http://update.microsoft.com',
                    contents: 'Upgrade my browser' }
            ]}
        ]}
    ).appendTo('#modals');

    // wait for modals.js to jqmize this one
    _.defer(function()
    {
        $('#modals .noIeModal').jqmShow();
    });
});
