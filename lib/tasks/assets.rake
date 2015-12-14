namespace :assets do
  desc 'Build unminified source packages (i.e. angular apps)'
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

  desc 'Transpile javascript with babel'
  task :babel do
    unless File.exist?('./node_modules/.bin/babel')
      raise RuntimeError.new('Unable to find babel binary. Install babel with "npm install"')
    end
    cmd = './node_modules/.bin/babel public/javascripts/src -d public/javascripts/dist'
    puts cmd
    fail($?.exitstatus) unless system(cmd)
  end
end

Rake::Task[:default].enhance do
  Rake::Task['assets:babel'].invoke
  Rake::Task['assets:unminified'].invoke
end

# compile assets before running tests
task 'test:js:oldUx' => 'assets:babel'
