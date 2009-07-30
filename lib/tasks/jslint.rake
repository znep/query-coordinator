namespace :js do
  JSLINT_JAR = File.join(Rails.root, '../build/jslint.jar')

  desc "Run JSLint on the javascript code"
  task :lint do
    require 'find'
    js_files_to_check = []
    warnings_to_ignore = [
      "Unnecessary semicolon.",
      "Be careful when making functions within a loop.",
      "Use '!==' to compare with ",
      "Use '===' to compare with " ]


    Find.find(File.join(Rails.root, 'public/javascripts')) do |path|
      if (path !~ %r{/public/javascripts/plugins/} &&
          path !~ %r{/public/javascripts/cache/} &&
          ( path !~ %r{/public/javascripts/util/} || path =~ %r{humane-date\.js} ) &&
          path !~ %r{jquery-\d+\.\d+\.\d+\.js$} &&
          !FileTest.directory?(path) &&
          File.extname(path) == '.js')
        js_files_to_check << path
      end
    end

    error_count = 0
    lint_output = IO.popen("$JAVA_HOME/bin/java -jar #{JSLINT_JAR} #{ENV['JSLINT_ARGS']} #{js_files_to_check.join(' ')}")
    lint_lines = lint_output.readlines
    lint_lines.each do |line|
      ignored = false
      warnings_to_ignore.each do |warning|
        if ( line.match(warning) )
          ignored = true
        end
      end
      if ( ! ignored )
        puts line
        error_count += 1
      end
    end
    puts "JSLint error count: #{error_count}"
    exit 1 if error_count > 0
  end
end
