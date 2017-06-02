namespace 'karma' do
  task :deps do
    npm('run check-dependencies') do |ok, res|
      unless ok
        npm('install') { |ok, res| npm('install', path: 'autocomplete') if ok }
      end
    end
  end

  task :runonce do
    npm('run test') { |ok, res| npm('run test', path: 'autocomplete') if ok }
  end

  task :watch do
    npm('run watch') { |ok, res| npm('run watch', path: 'autocomplete') if ok }
  end
end

desc 'Run all JavaScript tests (check prereqs)'
task karma: %w[karma:deps karma:runonce]

desc 'Run all JavaScript tests and re-run on file change'
task karma_watch: %w[karma:deps karma:watch]
