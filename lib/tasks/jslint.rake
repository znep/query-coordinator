namespace :js do
  JSLINT_JAR = File.join(Rails.root, '../build/jslint.jar')

  desc "Run JSLint on the javascript code"
  task :lint do
    require 'find'
    js_files_to_check = []

    Find.find(File.join(Rails.root, 'public/javascripts')) do |path|
      if (path !~ %r{/public/javascripts/plugins/} &&
          path !~ %r{jquery-\d+\.\d+\.\d+\.js$} &&
          !FileTest.directory?(path) &&
          File.extname(path) == '.js')
        js_files_to_check << path
      end
    end

    sh "$JAVA_HOME/bin/java -jar #{JSLINT_JAR} #{ENV['JSLINT_ARGS']} #{js_files_to_check.join(' ')}"
  end
end
