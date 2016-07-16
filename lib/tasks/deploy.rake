namespace :deploy do

  desc "Remove cleartext javascripts from public so they don't get served"
  task :move_resources do
    IGNORE_FILES = [
      'domains', 'tiny_mce', 'plugins/jquery.socrata.js',
      'plugins/excanvas.compiled.js', 'plugins/squire.js'
    ]
    Dir.glob('public/javascripts/**/*').each do |js_package|
      basename = js_package.sub('public/javascripts/', '')
      unless IGNORE_FILES.any? { |file| basename.start_with?(file) }
        if File.exists?(js_package) && File.file?(js_package)
          FileUtils.rm(js_package)
        end
      end
    end
  end

  desc 'Validate non-zero size of jammit derived javascript assets'
  task :validate_resources do
    Dir.glob('public/packages/*.js').each do |js_package|
      if File.size(js_package) <= 0
        puts "Jammit-built asset #{js_package} has zero size. Something strange is brewin'."
        exit
      end
    end
  end
end
