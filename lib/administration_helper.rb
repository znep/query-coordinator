# Helper for AdministrationController.
#
# This file lives in lib/ (not app/helpers) to avoid the broken configuration of
# the rails autoloader (XOXO 2009 Socrata <3).
#
# For some unknown and undocumented reason, ApplicationController specifies
# "helper :all", which causes all helpers to be loaded for all views.
# We want to override view_url for Admin->Datasets specifically, but if this file
# lived in app/helpers, the override would take place for _all_ views.
module AdministrationHelper

  # Implement special-case behavior:
  # Stories should load in the editor if
  #   * opened from a profile page AND
  #   * the user is looking at their own profile page.
  def view_url(view)
    if view.story? && view.owner.id == current_user.id
      "/stories/s/#{view.id}/edit"
    else
      # Call the original implementation, presumably in ApplicationHelper.
      # If this is throwing, a base module with a view_url implementation
      # hasn't been loaded before this module.
      # Note: This should never happen since `view_url` is a built-in method provided by the routes url helpers.
      # See: Rails.application.routes.url_helpers.methods.grep(/view_url/)
      super
    end
  end
end
