class VisualizationEmbedV1Controller < ApplicationController
  skip_before_filter :require_user

  def loader
    redirect_to webpack_bundle_src('visualization-embed/loader')
  end

  def embed
    redirect_to webpack_bundle_src('visualization-embed/main')
  end
end
