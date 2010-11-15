;(function($)
{
    var animateSlices = function($storiesContainer, storiesContainerWidth, $lastImage, $nextImage, $slices)
    {
        // measure next image's width since we'll need it
        $nextImage.show();
        var nextImageWidth = $nextImage.children('img').width();
        $nextImage.hide();

        // set up slices
        $slices.css('background-color', $nextImage.css('background-color'))
               .css('background-image', 'url(' + $nextImage.children('img').attr('src') + ')')
               .css('opacity', 0)
               .width(Math.ceil(storiesContainerWidth / 30))
               .height($storiesContainer.height())
               .each(function(i)
        {
            var $slice = $(this);

            var targetBgOffset,
                targetPosition = (storiesContainerWidth / 30) * i;
            if ($storiesContainer.attr('data-orientation') == 'right')
            { targetBgOffset = -1 * targetPosition; }
            else
            { targetBgOffset = storiesContainerWidth - nextImageWidth - targetPosition; }

            $slice.css('left', targetPosition)
                  .css('background-position', targetBgOffset + 'px 0');

            $slice.css('top', 100 * ((i % 2 === 0) ? -1 : 1));

            setTimeout(function()
            {
                $slice
                    .show()
                    .animate({ top: 0 }, 400)
                    .animate({ opacity: 1 }, {
                        duration: 700,
                        complete: function()
                        {
                            if (i == ($slices.length - 1))
                            {
                                $slices.hide();
                                $nextImage.show();
                                $lastImage.hide();
                            }
                        },
                        queue: false });
            }, i * 40);
        });
    };

    $(function()
    {
    // stories
        // measure and adjust story heights
        var targetHeight = $('.storyTextbox').height();
        $('.storyTexts').children().each(function()
        {
            var $this = $(this);

            $this.show();
            $this.find('p').css('margin-top', Math.max(0, (targetHeight - $this.find('p').outerHeight(false)) / 2 -
                $this.find('h2').outerHeight(true)));
            $this.hide();
        });

        var $storiesContainer = $('.storiesContainer');

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

        // generate slices for the animation
        _(30).times(function() { $storiesContainer.append('<div class="slice"></div>'); });
        var $slices = $storiesContainer.children('.slice');
        $slices.css('z-index', 1)
               .css('position', 'absolute')
               .css('background-repeat', 'no-repeat')
               .hide();

    // stories events
        // autorotator
        var autoadvanceTimeout = parseFloat($storiesContainer.attr('data-autoadvance'));
        var autoadvancePtr;
        var autoadvancer = function()
        {
            var $targetLink,
                $selectedLink = $storyPagers.filter('.selected');
            if ($selectedLink.is(':last-child'))
            { $targetLink = $storyPagers.filter(':first-child'); }
            else
            { $targetLink = $selectedLink.next(); }

            $targetLink.click();
        };
        var autoadvanceInit = function()
        {
            if (!isNaN(autoadvanceTimeout))
            {
                clearTimeout(autoadvancePtr);
                autoadvancePtr = setTimeout(autoadvancer, autoadvanceTimeout * 1000);
            }
        };

        // pager click
        $storyPagers.click(function(event)
        {
            event.preventDefault();

            var $this = $(this);
            if ($this.hasClass('selected')) { return; }

            var idxToActivate = $this.prevAll().length + 1;

            // animate text
            $storyTexts.filter(':visible').fadeOut();
            $storyTexts.filter(':nth-child(' + idxToActivate + ')').fadeIn();

            // animate images
            var storiesContainerWidth = $storiesContainer.width();
            var $lastImage = $storyImages.filter(':visible');
            var $nextImage = $storyImages.filter(':nth-child(' + idxToActivate + ')');
            animateSlices($storiesContainer, storiesContainerWidth, $lastImage, $nextImage, $slices);

            // change selected page
            $storyPagers.removeClass('selected');
            $this.addClass('selected');

            // reset autorotator
            autoadvanceInit();
        });

        // show first story
        $storyTexts.filter(':first-child').fadeIn();
        $storyImages.filter(':first-child').fadeIn(autoadvanceInit);

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
