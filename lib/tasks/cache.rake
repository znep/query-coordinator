namespace :cache do
  desc "Clear all page cache entries on this host"
  task :clear do
    FileUtils.rm_rf(Dir['public/cache/[^.]*',
                        'public/stylesheets/cache/[^.]*',
                        'public/javascripts/cache/[^.]*'])
  end
end
