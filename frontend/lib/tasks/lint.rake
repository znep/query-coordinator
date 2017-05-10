namespace :lint do
  namespace :eslint do
    def run_eslint(dirs, format)
      format ||= 'stylish'
      system("npm run -s lint -- --ignore-path .eslintignore -f #{format} #{dirs}")
    end

    desc 'run eslint on everything in public/javascripts'
    task :all, :format do |task, args|
      run_eslint('public/javascripts', args[:format])
    end

    desc 'run eslint on the common files'
    task :common, :format do |task, args|
      run_eslint('public/javascripts/common', args[:format])
    end

    desc 'run eslint on the adminActivityFeed files'
    task :adminActivityFeed, :format do |task, args|
      run_eslint('public/javascripts/adminActivityFeed', args[:format])
    end

    desc 'run eslint on the dataCards files'
    task :dataCards, :format do |task, args|
      run_eslint('public/javascripts/angular', args[:format])
    end

    desc 'run eslint on the datasetLandingPage files'
    task :datasetLandingPage, :format do |task, args|
      run_eslint('public/javascripts/datasetLandingPage', args[:format])
    end

    desc 'run eslint on the datasetManagementUI files'
    task :datasetManagementUI, :format do |task, args|
      run_eslint('public/javascripts/datasetManagementUI', args[:format])
    end

    desc 'run eslint on the visualizationCanvas files'
    task :visualizationCanvas, :format do |task, args|
      run_eslint('public/javascripts/visualizationCanvas', args[:format])
    end

    desc 'run eslint on the admin files'
    task :admin, :format do |task, args|
      run_eslint('public/javascripts/src', args[:format])
    end

    desc 'run eslint on the oldUx files'
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

    desc 'run a eslint diff on public/javascripts against master'
    task :diff do |task, args|
      files = `git diff --name-only \`git merge-base HEAD origin/master\` public/javascripts | xargs`
      run_eslint(files, args[:format])
    end
  end

  reek_dirs = %w(app lib test)
  desc "run reek on on #{reek_dirs.join(', ')}"
  task :ruby, :format do |task, args|
    def run_reek(dirs, format)
      format ||= 'text'
      system("bundle exec reek -f #{format} #{dirs}")
    end

    run_reek(reek_dirs.join(' '), args[:format])
  end

  task :all => ['eslint:all', 'ruby']
end

desc 'run all the lint tasks'
task :lint => 'lint:all'
