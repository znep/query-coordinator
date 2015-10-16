class ClassicVisualizationController < ApplicationController
  include ApplicationHelper
  skip_before_filter :require_user
  layout false
  helper_method :render_inline_setup_js

  def show
    render
  end

  # Render inline javascript to be included in the body *before* the bulk of javascript initializes.  Called by view
  # logic. Access the viewCache directly here, since we're doing it wrong if that doesn't work anyway.
  def render_dataset_setup_js
    "blist.dataset = new Dataset(blist.viewCache['#{@view.id}']);"
  end

  def render_inline_setup_js(target_dom_id, context, debug = false)
    # Set common base variables communicating display configuration to JS
    js = <<END
blist.namespace.fetch('blist.configuration');
blist.configuration.development = #{Rails.env.development?};
blist.configuration.useSoda2 = #{CurrentDomain.module_enabled?(:use_soda2)};
blist.assets = {libraries: #{debug ? ASSET_MAP.debug_javascripts : ASSET_MAP.javascripts}, stylesheets: #{stylesheet_assets.to_json}};
$(function()
{
  blist.$container = $('##{target_dom_id}');
});
END
  end

end
