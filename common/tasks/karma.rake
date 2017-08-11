require 'fileutils'

# Warn the user if the cache is getting too big.
# See: https://github.com/babel/babel/issues/5667
# We can remove this workaround if babel starts
# managing its cache better.
BABEL_CACHE_MAX_SIZE_MB = 50
BABEL_CACHE_DIRECTORY = 'karma_config/babelCache'

namespace 'karma' do
  task :deps do
    npm('run check-dependencies') do |ok, res|
      unless ok
        npm('install') { |ok, res| exit(1) unless ok }
      end
    end
  end

  task :check_babel_cache do
    cache_size = Dir.glob("#{BABEL_CACHE_DIRECTORY}/*").map { |f| File.size(f) }.inject(:+)
    cache_size_mb = (cache_size || 0) / (1024 * 1024)
    if cache_size_mb > BABEL_CACHE_MAX_SIZE_MB
      puts "!! Warning: babelCache size (#{cache_size_mb}mb) larger than #{BABEL_CACHE_MAX_SIZE_MB}mb. Performance may suffer."
      puts 'run rake karma:clear_babel_cache to clean up.'
    end
  end

  desc 'Clean out the babel cache used to speed up suite startup'
  task :clear_babel_cache do
    abort 'No cache directory found - nothing to clear.' unless Dir.exists?(BABEL_CACHE_DIRECTORY)

    # Safety check - rm_rf is potentially dangerous.
    non_cache_contents = (Dir.entries(BABEL_CACHE_DIRECTORY) - [ '.', '..' ]).
      grep_v(/\.json\.gzip$/)

    if !non_cache_contents.empty?
      puts "Unexpected files in #{BABEL_CACHE_DIRECTORY}:\n#{non_cache_contents.join("\n")}"
      puts 'Delete anyway? (y/N)'
      unless STDIN.gets.chomp.downcase == 'y'
        abort "Aborting. Inspect #{BABEL_CACHE_DIRECTORY} and delete it if safe."
      end
    else
      puts "About to DELETE #{BABEL_CACHE_DIRECTORY}! Proceeding in 5 seconds. Ctrl-C to cancel."
      sleep 5
    end
    puts 'Proceeding...'
    FileUtils.rm_rf(BABEL_CACHE_DIRECTORY)
    puts 'Complete.'
  end

  task :runonce do
    npm('run test') { |ok, res| exit(1) unless ok }
  end

  task :watch do
    npm('run watch') { |ok, res| exit(1) unless ok }
  end
end

desc 'Run all JavaScript tests (check prereqs)'
task karma: %w[karma:deps karma:check_babel_cache karma:runonce]

desc 'Run all JavaScript tests and re-run on file change'
task karma_watch: %w[karma:deps karma:check_babel_cache karma:watch]
