class ThemesController < ApplicationController
  skip_before_filter :require_logged_in_user

  layout 'blank'

  def custom
    # TODO can we do caching at a controller method level?
    @custom_themes = Theme.all_custom_for_current_domain
  end

end
