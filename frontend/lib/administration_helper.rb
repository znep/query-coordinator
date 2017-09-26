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

  def show_site_appearance_admin_panel?
    !!current_user.try(:can_use_site_appearance?) &&
      !SocrataSiteChrome::CustomContent.new(CurrentDomain.cname).activated?
  end

  def render_admin_users_v2_data

    server_config = {
      airbrakeEnvironment: ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      csrfToken: form_authenticity_token.to_s,
      currentUser: current_user,
      domain: CurrentDomain.cname,
      environment: Rails.env,
      locale: I18n.locale.to_s,
      localePrefix: locale_prefix.to_s
    }

    translations = LocaleCache.render_partial_translations(:users)
    translations.deep_merge!(LocaleCache.render_partial_translations(:roles))

    javascript_tag(%Q(
      window.serverConfig = #{json_escape(server_config.to_json)};
      window.translations = #{json_escape(translations.to_json)};
    ))
  end

end
