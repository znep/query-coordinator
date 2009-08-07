namespace :js do
  JSLINT_JAR = File.join(Rails.root, '../build/jslint.jar')

  desc "Run JSLint on the javascript code"
  task :lint do
    require 'find'
    js_files_to_check = []
    warnings_to_ignore = [
      "Unnecessary semicolon.",
      "is better written in dot notation.",
      "Be careful when making functions within a loop.",
      "eval is evil.",
      "The body of a for in",
      "The Function constructor is eval.",
      "Inner functions should be listed at the top",
      "Use '!==' to compare with ",
      "Use '===' to compare with " ]


    Find.find(File.join(Rails.root, 'public/javascripts')) do |path|
      if (path !~ %r{/public/javascripts/plugins/} &&
          path !~ %r{/public/javascripts/cache/} &&
          path !~ %r{swfobject\.js$} &&
          path !~ %r{extMouseWheel\.js$} &&
          path !~ %r{FusionMaps\.js$} &&
          path !~ %r{jquery-\d+\.\d+\.\d+\.js$} &&
          path !~ %r{\.min\.js$} &&
          !FileTest.directory?(path) &&
          File.extname(path) == '.js')
        js_files_to_check << path
      end
    end

    error_count = 0
    IO.popen("$JAVA_HOME/bin/java -jar #{JSLINT_JAR} #{ENV['JSLINT_ARGS']} #{js_files_to_check.join(' ')}").readlines.each do |line|
      next if warnings_to_ignore.any?{ |warning| line.match(warning) }
      puts line
      error_count += 1
    end

    puts "JSLint error count: #{error_count}"
    exit 1 if error_count > 0
  end
end
