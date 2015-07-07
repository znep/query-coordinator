namespace :lint do
  namespace :js do
    def run_eslint(dirs, format)
      format = 'stylish' if format.nil?
      system("npm run lint -- --ignore-path .eslintignore -c package.json -f #{format} #{dirs}")
    end

    task :all, :format do |task, args|
      run_eslint('public/javascripts', args[:format])
    end

    task :dataCards, :format do |task, args|
      run_eslint('public/javascripts/angular', args[:format])
    end

    task :oldUx, :format do |task, args|
      old_ux_dirs = [
        'public/javascripts/component',
        'public/javascripts/controls',
        'public/javascripts/domains',
        'public/javascripts/screens',
        'public/javascripts/util'
      ].join(' ')

      run_eslint(old_ux_dirs, args[:format])
    end
  end
end
