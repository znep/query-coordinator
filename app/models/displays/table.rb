# This defines the default tabular display.  The actual code for the display is spread throughout the view layer
# because tables require deeper integration than other displays.
# TODO - confirm this is true or move rendering code here
class Displays::Table < Displays::Base
    def initialize(view)
        super
    end

    def type
        if @view.is_blist?
          'blist'
        elsif @view.is_grouped?
          'grouped'
        else
          'filter'
        end
    end

    def can_advanced_publish?
        true
    end

    def render_inline_setup_js(target_dom_id, context)
      js = super
      js << 'blist.display.isGrid = true;'
      js
    end

    def required_javascripts
      ['shared-table-render']
    end

    def required_style_packages
      ['grid']
    end

    def invalid_message
      @view.message
    end

    def valid?
      @view.message.blank?
    end
end
