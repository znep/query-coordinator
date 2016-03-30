class ThemesController < ApplicationController
  skip_before_filter :require_logged_in_user

  layout 'blank'

  def custom
    # We use `locals` because our view (custom.css.erb) is also invoked
    # by StoriesController. We didn't want to pollute StoriesController
    # with an extraneous @custom_themes instance variable.
    render(locals: { custom_themes: Theme.all_custom_for_current_domain })
  end

end
