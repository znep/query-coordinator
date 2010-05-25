datasetControlsNS = blist.namespace.fetch('blist.dataset.controls');

blist.dataset.controls.hookUpShareMenu = function(view, $menu, buttonClass,
    isUnattached)
{
    var tweet = escape('Check out the ' + $.htmlEscape(view.name) +
        ' dataset on ' + blist.configuration.strings.company + ': ');
    var seoPath = window.location.hostname + $.generateViewUrl(view);
    var shortPath = window.location.hostname.replace(/www\./, '') + '/d/' + view.id;
    var opts = {
        attached: !isUnattached,
        menuButtonContents: 'Socialize',
        menuButtonTitle: 'Share this dataset',
        contents: [
            { text: 'Delicious', className: 'delicious', rel: 'external',
              href: 'http://del.icio.us/post?url=' + seoPath + '&title=' +
                $.htmlEscape(view.name) },
            { text: 'Digg', className: 'digg', rel: 'external',
              href: 'http://digg.com/submit?phase=2&url=' + seoPath +
                '&title=' + $.htmlEscape(view.name) },
            { text: 'Facebook', className: 'facebook', rel: 'external',
              href: 'http://www.facebook.com/share.php?u=' + seoPath },
            { text: 'Twitter', className: 'twitter', rel: 'external',
              href: 'http://www.twitter.com/home?status=' + tweet + shortPath },
            { text: 'Email', className: 'email', href: '#email',
                onlyIf: view.viewType != 'blobby'}
        ]
    };
    if (!$.isBlank(buttonClass)) { opts.menuButtonClass = buttonClass; }
    $menu.menu(opts);
};
