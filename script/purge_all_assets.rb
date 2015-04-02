#!/usr/bin/env ruby
require 'yaml'

DRY_RUN = true

# BEGIN MANUAL CONFIG
def cachebust_key
  # Sample: 'd5af6cf2e3c49ed01983750698679cace754f58b.236.1427229395'
  #
  # HOW TO GET:
  # 1) Load any user-facing page on any domain in the environment you care about.
  # 2) Open the debugger, refresh. Look at the fetched styles. You will see a query parameter tacked on
  #    to each style request.
  # 3) Copy/paste it here, minus the ?.
  raise 'Please configure a cachebust key (edit the script).'
  'PASTE HERE'
end

def ats_hosts
  # Sample: [ '10.92.1.6', '10.92.1.7' ]
  #
  # HOW TO GET:
  # 1) knife search node "role:load_balancer AND environment:<YOUR ENVIRONMENT HERE>" -a ipaddress
  # 2) Paste the IPs here, as an array of strings.
  raise 'Please configure ATS hosts (edit the script).'
  [ 'PASTE IPS HERE' ]
end

def domains_and_aliases
  # Sample: [ 'opendata-demo.rc-socrata.com', 'dataspace-demo.rc-socrata.com' ]
  #
  # HOW TO GET:
  # 1) Find a metadb node:
  #    knife search node "role:*meta* AND environment:<YOUR ENVIRONMENT HERE>" -a ipaddress
  # 2) SSH in, run:
  #    sudo -u postgres
  # 3) Run:
  #    psql <DB_NAME> -c "\copy (select concat(cname, aliases) from domains) to STDOUT (DELIMITER ' ')" | tr '\n,' ' '
  #    (for example, DB_NAME is blist_azure_rc in RC)
  # 4) Paste the output below.
  raise 'Please configure domains to purge (edit the script).'
  'PASTE HERE'.split()
end
# END MANUAL CONFIG

def all_style_package_names
  YAML.load_file('../config/style_packages.yml').keys
end

def all_js_package_names
  YAML.load_file('../config/assets.yml')['javascripts'].keys
end

def all_angular_template_relpaths
  angular_template_dir = '../public/angular_templates/'
  Dir.glob("#{angular_template_dir}**/*").map { |path| path[angular_template_dir.length..-1] }
end

def all_style_package_paths
  all_style_package_names.map { |package_name| "/styles/merged/#{package_name}.css" }
end

def all_js_package_paths
  all_js_package_names.map { |package_name| "/packages/#{package_name}.js" }
end

def all_angular_template_paths
  all_angular_template_relpaths.map { |template_relpath| "/angular_templates/#{template_relpath}" }
end

def all_package_paths
  (all_style_package_paths + all_js_package_paths + all_angular_template_paths).map { |package_path| "#{package_path}?#{cachebust_key}" }
end


ats_hosts.each do |ats_host|
  # Generate a set of CURL commands to run on the ATS host.
  curl_commands = domains_and_aliases.map do |domain|
    all_package_paths.map do |path|
      "curl -s -w '%{http_code} ' -H 'Host: #{domain}' -X PURGE 'http://0.0.0.0:8080#{path}'"
    end
  end.flatten

  puts "#{ats_host}: "
  if DRY_RUN
    puts curl_commands
  else
    monster_command = "ssh #{ats_host} \"#{curl_commands.join(' ; ')}\""
    system(monster_command)
  end
  puts
end

if DRY_RUN
  puts 'DRY RUN COMPLETE'
end

