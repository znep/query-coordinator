;(function($)
{


$(function()
{
    $('.deleteStoryButton').adminButton({
        confirmationText: 'Are you sure? This action cannot be undone.',
        callback: function(response, $row)
        {
            $row.slideUp().remove();
        }
    });
});


})(jQuery);