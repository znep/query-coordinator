class ThemesController < ApplicationController
    skip_before_filter :require_user

    def theme
        respond_to do |format|
            format.css do
                render
            end
        end
    end
end
