def run_eslint
  all_ok = system('npm run lint --silent')
  unless all_ok
    STDERR.puts("Lint pass failed with exit code: #{$?.exitstatus}")
    if ($?.exitstatus == 127)
      STDERR.puts('This exit code usually means the command was not found - is npm healthy?')
    end
  end
end

namespace :lint do
  task :js do
    run_eslint
  end
end

task lint: %w(lint:js)
