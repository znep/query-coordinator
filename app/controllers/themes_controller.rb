class ThemesController < ApplicationController
  skip_before_filter :require_logged_in_user
  force_ssl except: [:custom]

  layout 'blank'

  def custom
    @custom_themes = Theme.all_custom_for_current_domain
  end

end
