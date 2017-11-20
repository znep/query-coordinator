namespace :assets do
  desc 'Compile bundles with webpack for production'
  task :webpack do
    unless File.exist?('./node_modules/.bin/babel')
      raise RuntimeError.new('Unable to find babel binary. Install babel with "npm install"')
    end
    command = 'npm run build:prod'
    puts("Running NPM command: #{command}")
    fail($?.exitstatus) unless system(command)
  end

  desc 'compiles styleguide partials into plain css'
  task :compile_styleguide_modules do
    sh './public/javascripts/datasetManagementUI/compile_css.sh'
  end
end
