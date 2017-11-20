namespace :css do
  desc 'compiles styleguide partials into plain css'
  task :compile_modules do
    sh './public/javascripts/datasetManagementUI/compile_css.sh'
  end
end
