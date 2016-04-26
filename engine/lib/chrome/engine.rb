module Chrome
  class Engine < ::Rails::Engine
    isolate_namespace Chrome

    # Neither of the two configuration directives below appear to be necessary, but leaving them here for the
    # time being so we don't have to go look them up again.

    # config.autoload_paths += Dir["#{config.root}/lib/**/"]
    # config.assets.paths << File.expand_path('../../assets/javascripts', __FILE__)
  end
end
