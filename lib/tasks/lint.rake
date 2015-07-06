namespace :lint do
  namespace :js do
    def run_eslint(dir)
      system('eslint --ignore-path .eslintignore -c package.json ' + dir)
    end

    task :all do
      run_eslint('public/javascripts')
    end

    task :dataCards do
      run_eslint('public/javascripts/angular')
    end

    task :oldUx do
      old_ux_dirs = [
        'public/javascripts/component',
        'public/javascripts/controls',
        'public/javascripts/domains',
        'public/javascripts/screens',
        'public/javascripts/util'
      ].join(' ')

      run_eslint(old_ux_dirs)
    end
  end
end
