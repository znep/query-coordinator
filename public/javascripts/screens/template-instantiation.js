/**
 * This contains the logic for instantiating a template
 */
(function($) {

    var $canvas = $('div.templateCanvas');
    var $form = $('#insertionForm');
    var $renderTo = $('div.socrata-root');
    var $body = $(document.body);

    var configuratorOptions = {
        canAdd: false,
        editOnly: true,
        mask: false
    };

    $form.find('div.line').hover(function() {
        var $t = $(this);
        $t.find('.socrata-component').socrataTip({
            content: $t.find('div.tooltip').html()
        }).show();
    }, function() {
        $(this).find('.socrata-component').socrataTip().hide();
    });

    // todo: disable when required fields are missing
    var $createButton = $form.find('a.createTheThing');

    $createButton.click(function(event) {
        event.preventDefault();

        var spinner = $body.loadingSpinner();
        spinner.showHide(true);
        $canvas.fadeOut(function() {
            $canvas.remove();
            $renderTo.fadeIn();
        });

        $body.removeClass('instantiating');

        var insertions = [];
        $.component.eachRoot(function(root) {
            insertions.push(root.properties());
            // de-register components
            root.destroy();
        });
        blist.configuration.page = $.cf.template(blist.configuration.template,
            insertions, $renderTo);

        // reset configuration
        $.cf.configuration({});
        $.cf.side.reset();
        spinner.showHide(false);
    })

    $.cf.initialize($('.socrata-cf-top'), configuratorOptions);

    _.defer(function() {
        $form.find('.socrata-component:first').trigger('mousedown');
    });

    $body.addClass('instantiating');

})(jQuery);
