def run_eslint(dir)
  system("npm run lint --silent -- #{dir}")
end

namespace :lint do
  task :js do
    run_eslint('app/assets/javascripts')
  end
end
