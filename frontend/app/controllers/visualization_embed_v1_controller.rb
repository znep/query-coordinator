class VisualizationEmbedV1Controller < ApplicationController
  skip_before_filter :require_user

  def loader
    redirect_to webpack_bundle_src('visualization_embed/loader')
  end

  def embed
    redirect_to webpack_bundle_src('visualization_embed/main')
  end
end

