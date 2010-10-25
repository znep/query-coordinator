;(function($)
{
    $(function()
    {
    // stories
        // measure and adjust story heights
        var targetHeight = $('.storyTextbox').height();
        $('.storyTexts').children().each(function()
        {
            var $this = $(this);

            $this.show();
            $this.find('p').css('margin-top', (targetHeight - $this.find('p').outerHeight(false)) / 2 -
                $this.find('h2').outerHeight(true));
            $this.hide();
        });

        // set up the pager as appropriate
        var $storyTexts = $('.storyTexts').children();
        var $storyImages = $('.storyImages').children();
        var storyCount = $storyTexts.length;

        _(storyCount).times(function(i)
        {
            $('.storyPager').append('<a href="#page' + (i + 1) + '" class="storyPageLink">' + (i + 1) + '</a>');
        });

        var $storyPagers = $('.storyPager a');
        $storyPagers.filter(':first-child').addClass('selected');

        $storyPagers.click(function(event)
        {
            event.preventDefault();

            var $this = $(this);
            if ($this.hasClass('selected')) { return; }

            var idxToActivate = $this.prevAll().length + 1;

            $storyTexts.filter(':visible').fadeOut();
            $storyTexts.filter(':nth-child(' + idxToActivate + ')').fadeIn();

            var $lastImage = $storyImages.filter(':visible');
            $storyImages.filter(':nth-child(' + idxToActivate + ')')
                .css('z-index', 1)
                .fadeIn('slow', function()
                {
                    $lastImage.hide();
                    $(this).css('z-index', '');
                });

            $storyPagers.removeClass('selected');
            $this.addClass('selected');
        });

        // show first story
        $storyTexts.filter(':first-child').fadeIn();
        $storyImages.filter(':first-child').fadeIn();

    // featured views
        var resizeFeaturedViews = function()
        {
            var $boxes = $('.featuredViews .featuredView');
            $boxes
                .css('height', 'auto')
                .height(_.max($boxes.map(function() { return $(this).height(); })));
        };
        resizeFeaturedViews();
        $(window).resize(resizeFeaturedViews);
    });
})(jQuery);