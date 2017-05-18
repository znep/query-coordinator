namespace 'karma' do
  task :deps do
    npm('karma_config', 'run check-dependencies') do |ok, res|
      unless ok
        npm('karma_config', 'install')
      end
    end
  end

  task :runonce do
    npm('karma_config', 'test') do |ok, res|
      raise 'Karma tests failed' unless ok
    end
  end

  task :watch do
    npm('karma_config', 'run watch')
  end
end

desc 'Run all JavaScript tests (check prereqs)'
task karma: %w[karma:deps karma:runonce]

desc 'Run all JavaScript tests and re-run on file change'
task karma_watch: %w[karma:deps karma:watch]
