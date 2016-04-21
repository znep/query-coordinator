module Chrome
  class ThemesController < Chrome::ApplicationController

    include Chrome::ApplicationHelper

    layout nil # We don't want to use any layout at all for the CSS response body

    def custom
    end

  end
end
