# Base class for all displays
class Displays::Base
  attr_reader :options

    # Access the human readable name for this type of display
    def name
      self.class.name[10..-1]
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

    # This CSS class is applied to HTML anchors that reference views of this display type
    def link_css_class
      type
    end

    # Is this display type publishable as a widget?  Theoretically all display types should be publishable but
    # this isn't currently the case
    def can_publish?
      true
    end

    # Whether or not the display type has an advanced option that loads a
    # separate UI for configuration
    def can_advanced_publish?
      true
    end

    # Does the display scroll inline?  Return false to disable default management of the display container's size
    def scrolls_inline?
      true
    end

    # Controls for displaying the widget
    def render_widget_chrome?
      true
    end

    def render_widget_tabs?
      true
    end

    # Is the view properly configured to work with the underlying dataset?
    def valid?
      true
    end

    # If the invalid view can be edited; not permissions-related, but if it
    # is valid to show an edit button to fix a view
    def can_be_edited?
      true
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
    # logic
    def render_inline_setup_js(target_dom_id, context)
      # Set common base variables communicating display configuration to JS
      js = <<END
blist.namespace.fetch('blist.display');
blist.display.name = '#{name}';
blist.display.type = '#{type}';
blist.display.viewId = '#{@view.id}';
blist.display.view = JSON.parse($.htmlUnescape("#{h(@view.to_json.gsub(/\\/, '\\\\\\'))}"));
blist.display.options = #{@options.to_json};
blist.display.editable = #{@view.can_edit?};
blist.display.scrollsInline = #{scrolls_inline?};
blist.display.isInvalid = !blist.dataset.isValid(blist.display.view);
$(function() { blist.$display = $('##{target_dom_id}'); });
END

      # Disable scrolling if the display shouldn't scroll
      js << "$(function() { blist.$display.removeClass('scrollContent'); });" unless scrolls_inline?

      js
    end

    # Retrieve rendered CSS links to include in the page.  Called by view logic
    def render_stylesheet_includes
      return required_stylesheets.map { |css| @@asset_helper.stylesheet_link_merged css }.join +
        required_style_packages.map { |sass| @@app_helper.rendered_stylesheet_tag sass }.join
    end

    # Retrieve rendered JavaScript to include in the page.  Called by view logic
    def render_javascript_includes(context)
        includes = <<END
#{render_javascript_links}
<script type="text/javascript">
$(function() {
    #{render_inline_runtime_js context}
});
</script>
END
    end

    # Retrieve JavaScript for edit functionality to include in the page.
    # Called by view logic
    def render_edit_javascript_includes(context)
      render_edit_javascript_links
    end

    # Name of partial to render if you don't want to write all your HTML in strings
    def render_partial
      return nil
    end

    # Render the body of the view as HTML.  Context is the "self" for the view in which the display is embedded.  You
    # can use this to render partials if so desired.
    def render_body(context)
      return ''
    end

    # Partial for the publishing tab content
    def render_publishing_partial
      return 'displays/base_tab_publishing'
    end

    protected

    # Retrieve a list of stylesheet asset bundles that must be included for this display
    def required_stylesheets
      []
    end

    # List of style packages (sass bundles)
    def required_style_packages
      []
    end

    # Retrieve a list of javascript asset bundles that must be included for this display
    def required_javascripts
      []
    end

    # Retrieve a list of javascript asset bundles that must be included for
    # editing this display
    def required_edit_javascripts
      []
    end

    # Render links to javascript files
    def render_javascript_links
      required_javascripts.map { |js| @@asset_helper.javascript_include_merged js }.join
    end

    # Render links to javascript files for editing
    def render_edit_javascript_links
      required_edit_javascripts.map { |js| @@asset_helper.javascript_include_merged js }.join
    end

    # Render inline javascript to be included *after* the bulk of javascript initializes.
    def render_inline_runtime_js(context)
      ''
    end

    # Utility for escaping HTML
    def h(text)
      CGI.escapeHTML text
    end

    private

    @@asset_helper = Class.new do
      include Synthesis::AssetPackageHelper
      include ActionView::Helpers
    end.new

    @@app_helper = Class.new do
      include ApplicationHelper
      include ActionView::Helpers
    end.new
end
