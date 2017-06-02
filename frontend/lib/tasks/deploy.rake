namespace :deploy do

  desc "Remove cleartext javascripts from public so they don't get served"
  task :move_resources do
    IGNORE_FILES = [
      'domains', 'tiny_mce', 'plugins/excanvas.compiled.js', 'plugins/squire.js'
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
end
