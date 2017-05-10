class ThemesController < ApplicationController
  layout 'blank'

  def custom
    # We use `locals` because our view (custom.css.erb) is also invoked
    # by StoriesController. We didn't want to pollute StoriesController
    # with an extraneous @custom_themes instance variable.
    render(locals: { custom_themes: Theme.all_custom_for_current_domain })
  end
end
