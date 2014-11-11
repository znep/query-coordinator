class AngularController < ActionController::Base
  include ActionControllerExtensions
  include UnminifiedAssetsHelper

  layout 'angular'

  rescue_from ActionView::MissingTemplate do
    render :status => '400', :nothing => true, :content_type => 'text/html'
  end

  def serve_app
    raise 'Need an app parameter' unless request[:app]

    app_feature_flag = "app-#{request[:app]}"
    render_404 unless FeatureFlags.derive(nil, request)[app_feature_flag]
  end

end
