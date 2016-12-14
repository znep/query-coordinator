class AssetSelectorResource
  def self.from_cetera_result(view_results)
    view_results.to_a.map do |result|
      self.new(result)
    end
  end

  def initialize(result)
    @id = result.id
    @link = result.link

    @name = result.name
    @description = result.description
    @type = AssetSelectorResource.map_result_type(result.type)
    @display_title = result.display_title
    @categories = result.categories
    @tags = result.tags

    @preview_image_url = result.previewImageUrl

    @is_public = result.is_public?
    @is_federated = result.federated?

    @provenance = result.provenance

    @created_at = result.createdAt
    @updated_at = result.updatedAt
    @view_count = result.viewCount
  end

  private

  # Map Cetera's type 'datalens' to the expected type 'data_lens' used elsewhere in the FE
  def self.map_result_type(result_type)
    case result_type
    when 'datalens'
      'data_lens'
    else
      result_type
    end
  end
end
