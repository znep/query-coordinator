module Demos::DemosHelper
  def render_demos_javascript_environment
    render_demos_translations << render_feature_flags_for_javascript
  end

  def render_demos_translations
    # Standard cross-app translations.
    new_translations = json_escape(LocaleCache.render_partial_translations(:shared).to_json)
    javascript_tag("var translations = #{new_translations};")
  end
end
