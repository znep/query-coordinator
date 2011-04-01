namespace :deploy do
  desc "Remove cleartext javascripts from public so they don't get served"
  task :move_resources do
    IGNORE_FILES = ['plugins/bespin', 'domains', 'tiny_mce',
                    'plugins/jquery.socrata.js', '/javascripts/util/asteroids.min.js']
    Dir.glob('public/javascripts/**/*').each do |f|
      basename = f.sub('public/javascripts/', '')
      unless IGNORE_FILES.any? {|i| basename.start_with?(i) }
        FileUtils.rm f if File.exists?(f) && File.file?(f)
      end
    end
  end
end
