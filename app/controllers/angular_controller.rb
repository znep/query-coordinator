class AngularController < ActionController::Base
  include ActionControllerExtensions

  layout 'angular'

  def serve_app
    raise 'Need an app parameter' unless request[:app]

    app_feature_flag = "app-#{request[:app]}"
    render_error(404) unless FeatureFlags.derive(nil, request)[app_feature_flag]
  end

end
