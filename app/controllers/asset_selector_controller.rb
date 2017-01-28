class AssetSelectorController < ApplicationController

  layout 'styleguide'

  def show
    @translations =
      {
        asset_selector: LocaleCache.render_translations([LocalePart.asset_selector])['asset_selector']
      }.merge(
        external_resource_wizard: LocaleCache.
          render_translations([LocalePart.external_resource_wizard])['external_resource_wizard']
      ).merge(
        dataset_landing_page: LocaleCache.
          render_translations([LocalePart.dataset_landing_page])['dataset_landing_page']
      )
  end
end
