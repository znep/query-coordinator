$(function()
{
	// handle main tab clicks
    $('.mainTabs li a').click(function(event)
    {
        event.preventDefault();
        var $this = $(this);

        $('#interactive-tabs > .tabContainer')
            .filter(':visible')
                .fadeOut().end()
            .filter($this.attr('href').replace('tab', 'tabContainer'))
                .fadeIn();

        $('.mainTabs li a').removeClass('selected');
        $this.addClass('selected');
    });
    // handle option pane clicks
    $('#tabContainerMain ul li').click(function(event)
    {
        event.preventDefault();

        // find the appropriate mainTab and proxy to it
        $('.mainTabs .' + $(this).attr('class') + '-link a').click();
    });
    // handle close button clicks
    $.live('.gallery .close-button', 'click', function(event)
    {
        event.preventDefault();
        $('.mainTabs .main-link a').click();
    });

	// to start, show main
    $('.mainTabs .main-link a').click();

	//append close-button
	$('.slideInner').append('<a class="close-button">Close</a>');

    // add slideshow pagers
    $('#interactive-tabs .gallery').each(function()
    {
        var $container = $(this).find('.slideInner');
        var pageCount = $container.children('.gallery-item').length;

        if (pageCount == 1) return;

        // create the pager left, right, and container
        var $pager = $('<div class="pager-control"><div class="control leftControl">Move left</div><div class="pagebuttonContainer"></div><div class="control rightControl">Move right</div></div>');
        var $pagebuttonContainer = $pager.find('.pagebuttonContainer');
        $(this).append($pager);

        // create the page buttons
        for (var i = 0; i < pageCount; i++)
        {
            $pagebuttonContainer.append('<a class="pagebutton" href="#' + i + '"></a>');
        }

        // set up the default state
        $pagebuttonContainer.children(':first').addClass('selected');
        $pager.find('.leftControl').addClass('disabled');
        $container.children('.gallery-item:first').addClass('active');
    });

    // helper to update the state of the pager
    var updatePager = function($gallery)
    {
        var $activePage = $gallery.find('.gallery-item.active');
        var currentIndex = $activePage.prevAll().length;

        $gallery.find('.pagebuttonContainer .pagebutton').removeClass('selected')
                .filter(':nth-child(' + (currentIndex + 1) + ')').addClass('selected');

        $gallery.find('.pager-control .leftControl')
                .toggleClass('disabled', (currentIndex === 0));
        $gallery.find('.pager-control .rightControl')
                .toggleClass('disabled', (currentIndex === $activePage.siblings().length));
    };

    // helper to update the state of the slider
    var updatePosition = function($gallery)
    {
        var $activePage = $gallery.find('.gallery-item.active');
        $gallery.find('.slideInner').animate({
            marginLeft: -1 * $activePage.outerWidth(true) * $activePage.prevAll().length
        });

        // assume we also want to update the pager
        updatePager($gallery);
    };

    // handle slideshow left/right pagers
    $('#interactive-tabs .gallery .pager-control .leftControl').click(function(event)
    {
        event.preventDefault();
        var $this = $(this);

        if ($this.hasClass('disabled')) { return; }

        $this.closest('.gallery').find('.gallery-item.active').removeClass('active')
            .prev('.gallery-item').addClass('active');
        updatePosition($this.closest('.gallery'));
    });
    $('#interactive-tabs .gallery .pager-control .rightControl').click(function(event)
    {
        event.preventDefault();
        var $this = $(this);

        if ($this.hasClass('disabled')) { return; }

        $this.closest('.gallery').find('.gallery-item.active').removeClass('active')
            .next('.gallery-item').addClass('active');
        updatePosition($this.closest('.gallery'));
    });

    // handle slideshow pagebuttons
    $('#interactive-tabs .gallery .pager-control .pagebutton').click(function(event)
    {
        event.preventDefault();
        var $this = $(this);

        $this.closest('.gallery').find('.gallery-item').removeClass('active')
            .filter(':nth-child(' + ($this.prevAll().length + 1) + ')').addClass('active');
        updatePosition($this.closest('.gallery'));
    });

});
