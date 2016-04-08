class ThemesController < ApplicationController
  layout 'blank'

  def custom
    @custom_themes = Theme.all_custom_for_current_domain
  end
end
