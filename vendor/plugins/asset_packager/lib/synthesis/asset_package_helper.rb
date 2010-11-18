module Synthesis
  module AssetPackageHelper

    # clint.tseng@socrata.com, 2010/11/17:
    # Force html_safe in rails 2.3.8 (seems like they should be doing this anyway.)

    def should_merge?
      AssetPackage.merge_environments.include?(Rails.env)
    end

    def javascript_include_merged(*sources)
      options = sources.last.is_a?(Hash) ? sources.pop.stringify_keys : { }

      if sources.include?(:defaults) 
        sources = sources[0..(sources.index(:defaults))] + 
          ['prototype', 'effects', 'dragdrop', 'controls'] + 
          (File.exists?("#{Rails.root}/public/javascripts/application.js") ? ['application'] : []) + 
          sources[(sources.index(:defaults) + 1)..sources.length]
        sources.delete(:defaults)
      end

      sources.collect!{|s| s.to_s}
      sources = (should_merge? ? 
        AssetPackage.targets_from_sources("javascripts", sources) : 
        AssetPackage.sources_from_targets("javascripts", sources))

      sources = sources.collect {|source| javascript_include_tag(source, options) }.join("\n")

      sources = sources.html_safe if sources.respond_to? :html_safe
      return sources
    end

    def stylesheet_link_merged(*sources)
      options = sources.last.is_a?(Hash) ? sources.pop.stringify_keys : { }

      sources.collect!{|s| s.to_s}
      sources = (should_merge? ? 
        AssetPackage.targets_from_sources("stylesheets", sources) : 
        AssetPackage.sources_from_targets("stylesheets", sources))

      sources = sources.collect { |source| stylesheet_link_tag(source, options) }.join("\n")

      sources = sources.html_safe if sources.respond_to? :html_safe
      return sources
    end

  end
end