namespace :deploy do
  desc "Remove cleartext javascripts from public so they don't get served"
  task :move_resources do
    IGNORE_FILES = ['domains', 'tiny_mce',
                    'plugins/jquery.socrata.js', 'plugins/excanvas.compiled.js',
                    'util/asteroids.min.js', 'plugins/squire.js']
    Dir.glob('public/javascripts/**/*').each do |f|
      basename = f.sub('public/javascripts/', '')
      unless IGNORE_FILES.any? {|i| basename.start_with?(i) }
        FileUtils.rm f if File.exists?(f) && File.file?(f)
      end
    end
  end
end
