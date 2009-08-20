class ThemesController < ApplicationController
  skip_before_filter :require_user, :only => :theme
  skip_before_filter :ensure_proper_protocol, :only => :theme

  def theme
      respond_to do |format|
          format.css do
              render
          end
      end
  end

  def new_image
    respond_to do |format|
        format.data { render(:layout => 'modal_dialog') }
    end
  end
end
