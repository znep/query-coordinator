namespace 'karma' do
  task :deps do
    npm('run check-dependencies') do |ok, res|
      unless ok
        npm('install') { |ok, res| exit(1) unless ok }
      end
    end
  end

  task :runonce do
    npm('run test') { |ok, res| exit(1) unless ok }
  end

  task :watch do
    npm('run watch') { |ok, res| exit(1) unless ok }
  end
end

desc 'Run all JavaScript tests (check prereqs)'
task karma: %w[karma:deps karma:runonce]

desc 'Run all JavaScript tests and re-run on file change'
task karma_watch: %w[karma:deps karma:watch]
