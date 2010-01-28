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
        @options = view.displayFormat || {}
        @view = view
    end

    # This CSS class is applied to HTML anchors that reference views of this display type
    def link_css_class
        @view.displayType
    end

    # Is this display type publishable as a widget?  Theoretically all display types should be publishable but
    # this isn't currently the case
    def can_publish?
        true
    end

    # Whether or not the display type has an advanced option that loads a
    # separate UI for configuration
    def can_advanced_publish?
        false
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

    # Retrieve a list of stylesheet asset bundles that must be included for this display
    def required_stylesheets
        []
    end

    # Retrieve a list of javascript asset bundles that must be included for this display
    def required_javascripts
        []
    end

    # Name of partial to render if you don't want to write all your HTML in strings
    def render_partial
      return nil
    end

    # Render the body of the view as HTML.  Context is the "self" for the view
    # in which the display is embedded
    def render_body(context)
        return ''
    end

    # Render inline javascript to be included in the body *before* the bulk of javascript initializes.
    def render_inline_setup_js(context)
        # Set common base variables communicating display configuration to JS
        js = <<END
blist.namespace.fetch('blist.display');
blist.display.name = '#{name}';
blist.display.type = '#{type}';
blist.display.viewId = '#{@view.id}';
blist.display.options = #{@options.to_json};
blist.display.editable = #{@view.can_edit};
END

        # Disable scrolling if the display shouldn't scroll
        js << "$('#dataGrid').removeClass('scrollContent')" unless scrolls_inline?

        js
    end

    # Render inline javascript to be included *after* the bulk of javascript initializes.
    def render_inline_runtime_js(context)
        ''
    end

    # Partial for the publishing tab content
    def render_publishing_partial
      return 'displays/base_tab_publishing'
    end

    protected

    # Utility for escaping HTML
    def h(text)
        CGI.escapeHTML text
    end
end
