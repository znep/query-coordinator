namespace :assets do
  desc "Build unminified source packages (i.e. angular apps)"
  task :unminified do
    require 'tempfile'

    config_fn = 'config/assets.yml'
    unminified_package_dir = 'public/packages/unminified/'

    # Derive a new assets.yml which disables compress_assets.
    config = File::open(config_fn)
    config_without_compression = Tempfile.new('assets.yml')

    config_without_compression << config.read
    config_without_compression.puts('compress_assets: off')

    config.close
    config_without_compression.close

    # Run Jammit with the derived config.
    system "bundle exec jammit -c #{config_without_compression.path} -o #{unminified_package_dir}"

    config_without_compression.unlink
  end
end

Rake::Task[:default].enhance { Rake::Task["assets:unminified"].invoke }
