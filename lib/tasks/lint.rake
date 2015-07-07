def run_eslint(dir)
  system("npm run lint -- #{dir}") || fail($?.exitstatus)
end

namespace :lint do
  task :js do
    run_eslint('app/assets/javascripts')
  end
end
