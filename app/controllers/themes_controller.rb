class ThemesController < ApplicationController
    def theme
        respond_to do |format|
            format.css do
                render
            end
        end
    end
end
