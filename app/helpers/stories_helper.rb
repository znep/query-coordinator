module StoriesHelper

  def user_story_json
    @story.as_json.merge(
      {
        :title => core_attributes['name'] || '',
        :description => core_attributes['description'] || ''
      }
    ).to_json
  end

  private

  def core_attributes
    CoreServer::get_view(@story.uid, CoreServer::headers_from_request(request)) || {}
  end

  def type_to_class_name_for_component_type(type)
    'component-' + type.gsub(/\./, '-').gsub(/[A-Z]/, '-$&').downcase();
  end

end
