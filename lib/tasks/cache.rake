require File.join(Rails.root, '/config/environment')

namespace :cache do
  desc "Clear all page cache entries on this host"
  task :clear do
    # Clear out whatever Rails cache is configured.
    Rails.cache.clear
    # Clear out whatever magic caches we've created
    # over the years.
    FileUtils.rm_rf(
      Dir[
        'public/cache/[^.]*',
        'public/stylesheets/cache/[^.]*',
        'public/javascripts/cache/[^.]*',
        StylesController::BLIST_STYLE_CACHE
      ]
    )
  end
end
