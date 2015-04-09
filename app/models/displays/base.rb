# Base class for all displays
class Displays::Base
  attr_reader :options

    # Access the human readable name for this type of display
    def name
      self.class.name[10..-1]
    end

    def title
      self.class.name[10..-1].capitalize
    end

    # Access the internal name for this type of display
    def type
      name.underscore
    end

    # Initialize the display.  Stores the view and initializes model fields from the view's display format object
    def initialize(view)
      @options = view.displayFormat || Hashie::Mash.new
      @view = view
    end

    # Is this display type publishable as a widget?  Theoretically all display types should be publishable but
    # this isn't currently the case
    def can_publish?
      true
    end

    # Does the display scroll inline?  Return false to disable default management of the display container's size
    def scrolls_inline?
      # !! DEPRECATED !! This is only used in the embed code now. The rest is handled
      # in JS, see $.fn.renderTypeManager
      true
    end

    # Is the view properly configured to work with the underlying dataset?
    def valid?
      true
    end

    # If the data can be read
    def data_valid?
      @view.message.blank?
    end

    # Message to display if the view is invalid
    def invalid_message
      'There is a problem with displaying this view'
    end

    # Is the view publicly accessible?
    def is_public?
      @view.grants && @view.grants.any? {|p| p.flag?('public')}
    end

    # What type of public to use for toggling permissions
    def public_perm_type
      'read'
    end

    # Render inline javascript to be included in the body *before* the bulk of javascript initializes.  Called by view
    # logic. Access the viewCache directly here, since we're doing it wrong if that doesn't work anyway.
    def render_dataset_setup_js
      "blist.dataset = new Dataset(blist.viewCache['#{@view.id}']);"
    end

    def render_inline_setup_js(target_dom_id, context, debug = false)
      # Set common base variables communicating display configuration to JS
      js = <<END
blist.namespace.fetch('blist.configuration');
blist.configuration.development = #{Rails.env.development?};
blist.configuration.useSoda2 = #{CurrentDomain.module_enabled?(:use_soda2)};
#{render_dataset_setup_js}
blist.assets = {libraries: #{debug ? ASSET_MAP.debug_javascripts : ASSET_MAP.javascripts}, stylesheets: #{@@app_helper.stylesheet_assets.to_json}};
$(function()
{
    blist.$container = $('##{target_dom_id}');
});
END
      # When our JS is bundled, tinymce can't figure out where to load components
      # from; so we have to tell it before it loads up
      js << "window.tinyMCEPreInit = {base: '/javascripts/tiny_mce', suffix: '', query: ''};"
      js
    end

    # Name of partial to render if you don't want to write all your HTML in strings
    def render_partial
      return nil
    end

    # Allow for customization of the CSS icon class, e.g. for icon font
    def icon_class
      'icon'
    end

    protected

    # Utility for escaping HTML
    def h(text)
      CGI.escapeHTML text
    end

    private

    @@app_helper = Class.new do
      include ApplicationHelper
      include ActionView::Helpers
    end.new
end
