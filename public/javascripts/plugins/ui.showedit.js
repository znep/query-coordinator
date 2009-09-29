(function($) {

$.widget("ui.showEdit", {

  _init: function() {
    var self = this;
    this.element.find(".sectionShow p").hover(
      function() { $(this).addClass("hover"); },
      function() { $(this).removeClass("hover"); }
    );

    this.element.find(".sectionShow p, .sectionShow a.showAction").click(function(event) {
      event.preventDefault();
      self.displayEditSection();
    });

    this.element.find(".formListBoxClose a").click(function(event) {
      event.preventDefault();
      self.displayShowSection();
    });      
      
  },

  displayShowSection: function() {
    this.element.find(".sectionEdit").slideUp("fast");
    this.element.find(".sectionShow").slideDown("fast");

    this._trigger("displayShow", 0, this);
  },

  displayEditSection: function() {
    this.element.find(".sectionShow").slideUp("fast");
    this.element.find(".sectionEdit").slideDown("fast");

    this._trigger("displayEdit", 0, this);
  },

  clear: function() {
    this.element.find(".sectionEdit")
      .find("form :input")
        .val("")
        .removeClass('error')
      .end()
    var $form = this.element.find(".sectionEdit form");
    if ($form.length > 0)
    {
        $form.validate().resetForm();
        $form.find('.errorMessage').empty();
    }
  }
});

})(jQuery);


$.extend($.ui.showEdit, {});

