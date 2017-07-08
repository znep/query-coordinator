module Demos::DemosHelper
  def render_demos_javascript_environment
    render_demos_translations << render_feature_flags_for_javascript
  end

  def render_demos_translations
    translations = json_escape(LocaleCache.render_translations([LocalePart.shared]).to_json)
    javascript_tag("var translations = #{translations};", :id => 'translations')
  end
end
