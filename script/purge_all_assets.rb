#!/usr/bin/env ruby
require 'yaml'

# BEGIN MANUAL CONFIG
def cachebust_key_for_templates_and_styles
  # Sample: 'd5af6cf2e3c49ed01983750698679cace754f58b.236.1427229395'
  #
  # HOW TO GET:
  # 1) Load any user-facing page on any domain in the environment you care about.
  # 2) Open the debugger, refresh. Look at the fetched styles. You will see a query parameter tacked on
  #    to each style request.
  # 3) Copy/paste it here, minus the ?.
  raise 'Please configure a cachebust key for template and style assets (edit the script).'
end

def cachebust_keys_for_js
  # Sample: [ '1427229395', '1427229995' ]
  #
  # HOW TO GET:
  # 1) Load any user-facing data lens page on any domain in the environment you care about.
  # 2) Open the debugger, refresh. Look at the fetched JS assets. You will see a query parameter tacked on
  #    to each JS request. Note that there are 2 - one for all the minified JS assets, another for all
  #    the unminified assets.
  # 3) Copy/paste both here, minus the ?.
  raise 'Please configure a cachebust key for JS assets (edit the script).'
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
  all_js_package_names.map do |package_name|
    [ "/packages/#{package_name}.js", "/packages/unminified/#{package_name}.js" ]
  end.flatten
end

def all_angular_template_paths
  all_angular_template_relpaths.map { |template_relpath| "/angular_templates/#{template_relpath}" }
end

def all_package_paths
  style_cachebust_paths = all_style_package_paths.map { |package_path| "#{package_path}?#{cachebust_key_for_templates_and_styles}" }
  js_cachebust_paths = all_js_package_paths.map do |package_path|
    cachebust_keys_for_js.map { |key| "#{package_path}?#{key}" }
  end.flatten
  angular_cachebust_paths = all_angular_template_paths.map { |package_path| "#{package_path}?assetRevisionKey=#{cachebust_key_for_templates_and_styles}" }
  style_cachebust_paths + js_cachebust_paths + angular_cachebust_paths
end

def generate_curl_commands
  domains_and_aliases.map do |domain|
    urls = all_package_paths.map do |path|
      "'http://0.0.0.0:8080#{path}'"
    end
    "echo -e '\\n#{domain}' && curl -s -w '%{http_code} ' -H 'Host: #{domain}' -X PURGE #{urls.join(' ')}"
  end
end

output_filename = 'purge_assets_generated.sh'
puts 'Writing script...'
File.write(output_filename, generate_curl_commands.join("\n"))
puts "Wrote script #{output_filename}"

puts 'Copying via SCP to each ATS host'
ats_hosts.each do |ats_host|
  system "scp #{output_filename} #{ats_host}:"
end

puts 'Please SSH in to each host and run the script (probably in a screen session)'

