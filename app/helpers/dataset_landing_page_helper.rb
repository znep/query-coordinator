module DatasetLandingPageHelper
  include Socrata::UrlHelpers

  def meta_description
    if @view.description.present?
      "#{@view.name} - #{@view.description}"
    else
      @view.name
    end
  end

  def dataset_landing_page_translations
    LocaleCache.render_translations([LocalePart.dataset_landing_page])['dataset_landing_page'].
      merge({
        data_types: LocaleCache.render_translations([LocalePart.core.data_types])['core']['data_types']
      })
  end

  def render_dataset_landing_page_translations
    javascript_tag("var I18n = _.extend(I18n, #{json_escape(dataset_landing_page_translations.to_json)});")
  end

  def render_dataset_landing_page_session_data
    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :ownerId => @view.try(:owner).try(:id) || 'N/A',
      :userOwnsDataset => @view.owned_by?(current_user),
      :socrataEmployee => current_user.try(:is_superadmin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :viewId => @view.try(:id) || 'N/A',
      :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_dataset_landing_page_server_config
    server_config = {
      :airbrakeKey => ENV['DATASET_LANDING_PAGE_AIRBRAKE_API_KEY'] || APP_CONFIG.dataset_landing_page_airbrake_api_key,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags_as_json,
      :locale => I18n.locale.to_s,
      :localePrefix => (I18n.locale.to_sym == CurrentDomain.default_locale.to_sym) ? '' : "/#{I18n.locale}",
      :recaptchaKey => RECAPTCHA_2_SITE_KEY
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end
end
