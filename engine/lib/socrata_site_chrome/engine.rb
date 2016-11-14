module SocrataSiteChrome
  class Engine < ::Rails::Engine
    isolate_namespace SocrataSiteChrome

    # Neither of the two configuration directives below appear to be necessary, but leaving them here for the
    # time being so we don't have to go look them up again.

    # config.autoload_paths += Dir["#{config.root}/lib/**/"]
    # config.assets.paths << File.expand_path('../../assets/javascripts', __FILE__)

    initializer "static assets" do |app|
      if Rails.application.config.serve_static_files
        app.middleware.insert_before(::ActionDispatch::Static, ::ActionDispatch::Static, "#{root}/public")
      end
    end

    initializer "socrata_site_chrome.add_middleware" do |app|
      # NOTE: any middlewares in the hosting app that expect to be able to use SocrataSiteChrome must come
      # after this middleware. Not entirely sure where in the middleware stack this will be loaded, worth
      # investigating if we ever need to use Site Chrome in another middleware.
      app.middleware.use SocrataSiteChrome::Middleware
    end
  end
end
