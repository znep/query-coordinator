class VisualizationEmbedV1Controller < ApplicationController
  skip_before_filter :require_user

  def loader
    redirect_to APP_CONFIG.socrata_visualizations_v1_loader_url
  end

  def embed
    redirect_to APP_CONFIG.socrata_visualizations_v1_embed_url
  end
end

