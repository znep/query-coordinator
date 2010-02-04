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
end
