var scheme = document.location.protocol;
var hostURL = scheme + "//" + "discussions.zoho.com";
document.write(unescape("%3Cscript src='" + hostURL + "/js/discussions.feedbackwidget.js' type='text/javascript'%3E%3C/script%3E")); //No I18N

var zdFBWSettings = {};
zdFBWSettings.alignment = "fbLeft";
zdFBWSettings.tabColor = "#7FBF5D";
zdFBWSettings.textColor = "#fff";
zdFBWSettings.fbURL = "http://discuss.baltimorecity.gov/fbw?fbwId=47048000000006055";
zdFBWSettings.defaultDomain = "discussions.zoho.com";
zdFBWSettings.jQuery = 'false';
zdFBWSettings.display = "popout";

$(function() {
    var zdFBW = new ZDiscussions.loadZDFeedbackTab();
});

