# This "no-op" view is a placeholder for display types that currently render via conditional view logic.  This class
# is used so we don't have to say "if @display" all over the place.
#
# TODO - remove this once all display types are handled by display models
class Displays::Legacy < Displays::Base
    def type
        if @view.is_blist?
          'blist'
        elsif @view.is_visualization?
          'visualization'
        else
          'filter'
        end
    end

    def can_advanced_publish?
        true
    end
end
