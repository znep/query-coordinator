;(function() {
  /**
   * Functionality related to adding content via the
   * inspiration story
   */
  window.AddContentPanel = {
    init: function () {
      var addContentPanel = $('.add-content-panel').sidebar({
        side: 'right'
      });

      var addContentPanelButton = $('.add-content-panel-btn');

      addContentPanelButton.on('click', function() {
        addContentPanel.trigger('sidebar:toggle');
      });

      $('.close-content-panel-btn a').on('click', function() {
        addContentPanel.trigger('sidebar:close');
      });

      $(document).on('keydown', function(e) {
        if (e.ctrlKey && e.keyCode === 49) { // '1'
          addContentPanel.trigger('sidebar:toggle');
        }
      });

      addContentPanel.
        on('sidebar:open', function() {
          addContentPanelButton.addClass('active');
          addContentPanel.find('a').eq(0).focus();
        }).
      on('sidebar:close', function() {
        addContentPanelButton.removeClass('active');
      }).
      on('mousewheel', '.scrollable', function(e) {
        // Prevent mouse scrolls from bubbling
        // up to document.
        var target = $(this);
        var scrollTop = target.scrollTop();

        var delta = e.originalEvent.deltaY;
        if (delta < 0) {
          // Scrolling up.
          if (scrollTop === 0) {
            // Past top.
            e.preventDefault();
          }
        } else if (delta > 0) {
          // Scrolling down.
          var innerHeight = target.innerHeight();
          var scrollHeight = target[0].scrollHeight;

          if (scrollTop >= scrollHeight - innerHeight) {
            // Past bottom.
            e.preventDefault();
          }
        }
      });
    }
  };
})();
