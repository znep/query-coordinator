$(function ()
{
    $(".fileInputContainer input[type='file']").change(function()
    {
        $(".fileInputContainer input[type='text']").val($(this).val());
    });

    var defaultInviteText = "Enter email addresses separated by commas";
    $("textarea#inviteOthers").focus(function()
    {
        var $this = $(this);
        if ($this.val() == defaultInviteText) { $this.val("").addClass("editing"); }
    });
    $("textarea#inviteOthers").blur(function()
    {
        var $this = $(this);
        if ($this.val() == "") { $this.val(defaultInviteText).removeClass("editing"); }
    });
});