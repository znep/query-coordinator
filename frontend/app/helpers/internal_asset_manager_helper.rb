module InternalAssetManagerHelper

  def internal_asset_manager_translations
    translations = LocaleCache.
      render_translations([LocalePart.internal_asset_manager])['internal_asset_manager']
    translations.deep_merge(
      common: LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_internal_asset_manager_translations
    javascript_tag("window.I18n = _.extend(I18n, #{json_escape(internal_asset_manager_translations.to_json)});")
  end

  def render_internal_asset_manager_mixpanel_config
    mixpanel_config = { :token => APP_CONFIG.mixpanel_token }

    if CurrentDomain.feature?(:mixpanelTracking)
      mixpanel_config[:options] = { :cookie_expiration => nil }
    elsif CurrentDomain.feature?(:fullMixpanelTracking)
      mixpanel_config[:options] = { :cookie_expiration => 365 }
    else
      mixpanel_config[:disable] = true
    end

    javascript_tag("window.mixpanelConfig = #{json_escape(mixpanel_config.to_json)};")
  end

  def render_internal_asset_manager_session_data
    session_data = {
      :userId => current_user.try(:id),
      :socrataEmployee => !!current_user.try(:is_admin?),
      :userRoleName => current_user.try(:roleName),
      :email => current_user.try(:email)
    }

    javascript_tag("window.sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_internal_asset_manager_server_config
    feature_flags = FeatureFlags.derive(nil, request).slice(
      # TODO: need any flags?
    )

    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      # :airbrakeKey => # TODO ,
      # :airbrakeProjectId => # TODO,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags,
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix.to_s,
      :recaptchaKey => RECAPTCHA_2_SITE_KEY
    }

    javascript_tag("window.serverConfig = #{json_escape(server_config.to_json)};")
  end

  def render_internal_asset_manager_initial_state
    javascript_tag(%Q(
      window.initialState = {
        catalog: {
          columns: #{internal_asset_manager_table_columns},
          results: #{@catalog_results.try(:to_json)}
        }
      };
    ))
  end

  # Defines the default order of the columns for the internal asset manager table.
  # Eventually this will be configurable on a per-user basis.
  def internal_asset_manager_table_columns
    %w(type name lastUpdatedDate ownedBy accessLevel category visibility discoverable)
  end

end
