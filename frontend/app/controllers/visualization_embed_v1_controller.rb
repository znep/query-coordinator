class VisualizationEmbedV1Controller < ApplicationController
  skip_before_filter :require_user

  def loader
    redirect_to webpack_bundle_src('shared-with-jquery/visualizationEmbedLoader')
  end

  def embed
    redirect_to webpack_bundle_src('shared-with-jquery/visualizationEmbedMain')
  end
end
