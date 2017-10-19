# Helper for AdministrationController.
#
# This file lives in lib/ (not app/helpers) to avoid the broken configuration of
# the rails autoloader (XOXO 2009 Socrata <3).
#
# For some unknown and undocumented reason, ApplicationController specifies
# "helper :all", which causes all helpers to be loaded for all views.
# We want to override view_url for Admin->Datasets specifically, but if this file
# lived in app/helpers, the override would take place for _all_ views.

module AdminDatasetsHelper

  def view_url(view)
    if view.story?
      edit_story_url(view)
    elsif view.visualization_canvas?
      edit_visualization_canvas_url(view)
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
