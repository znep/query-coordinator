require 'rake'
require 'mrdialog'
require 'git'
require 'semver'

require_relative 'storyteller_release'

class StorytellerReleasesUi
  attr_reader :dialog, :git

  def initialize
    @dialog = MRDialog.new
    @git = open_git_repo
  end

  def main_menu_entry_name
    'Manage Releases'
  end

  def main_menu_entry_description
    'Create releases and deploy them'
  end

  def show_main_menu
    begin
      Rake.application['ops:jenkins:check_creds'].invoke
      Rake.application['ops:check_aws_creds'].invoke
      dialog.infobox('Check VPN...')
      Rake.application['ops:check_vpn'].invoke
    rescue => e
      dialog.msgbox(e.message)
      return
    end

    loop do
      selected_version = show_version_select_menu

      break if selected_version == false

      if selected_version == 'New'
        Rake.application['ops:ui:new_release'].execute
      else
        show_version_action_menu(selected_version)
      end
    end
  end

  private

  def show_version_select_menu
     # Cache just for this method invocation
    marathon_instances_by_semver_cached = marathon_instances_by_semver
    git_releases_cached = git_releases

    dialog.infobox('Querying Consul for active versions...', 3, 50)
    items = git_releases_cached.map do |release_semver|
      marathon_instances = marathon_instances_by_semver_cached[release_semver.to_s] || []
      active = marathon_instances.select(&:active?)
      standby = marathon_instances - active

      status_line = ''
      status_line << "Serving: #{active.map(&:environment).sort.uniq.join(' ')}" unless active.empty?
      status_line << " Standby: #{standby.map(&:environment).sort.uniq.join(' ')}" unless standby.empty?

      [ release_semver.to_s, status_line ]
    end

    items.unshift([ 'New', 'Create a new release'])

    dialog.menu('Releases', items)
  end

  def show_version_action_menu(selected_version)
    instances = marathon_instances_by_semver[selected_version] || []
    by_environment = instances.group_by(&:environment)

    description_string = "Version: #{selected_version}"

    items = StorytellerRelease.all_environments.sort.map do |environment_name|
      in_this_environment = by_environment[environment_name] || []
      if in_this_environment.any?(&:active?)
        [ "Already serving #{environment_name}", '' ]
      elsif in_this_environment.blank?
        [ "Deploy to #{environment_name}", 'Deploy, but leave on standby' ]
      else
        [ "Activate #{environment_name}", 'Serve live traffic' ]
      end
    end

    loop do
      selection = (dialog.menu(description_string, items, 20, 80) || '').split
      selected_environment = selection.last

      case selection.first
        when 'Activate'
          make_active(by_environment[selected_environment])
        when 'Deploy'
          deploy_to_env(selected_environment, selected_version)
        when 'Already'
          dialog.msgbox("¯\_(ツ)_/¯\\n#{selected_version} is already serving traffic in #{selected_environment}.")
        else
          break
      end
    end
  end

  # All git release tags as SemVer instances.
  # We use SemVer instances because it makes sorting easy (and
  # we're using the library elsewhere).
  def git_releases
    dialog.infobox('Fetching origin...', 3, 40)
    git.fetch('origin', tags: true)

    git.tags.map(&:name).map do |tag_name|
      semver_parts = /^(0|[1-9]\d*)\.(\d+)\.(\d)+$/.match(tag_name)  # Yeah regex is simplistic, works for us.
      SemVer.new(semver_parts[1].to_i, semver_parts[2].to_i, semver_parts[3].to_i) if semver_parts
    end.compact.sort.reverse
  end

  def marathon_instances_by_semver
    marathon_instances.group_by(&:semver)
  end

  def marathon_instances
    all_instances = nil
    @dialog.gauge('Reticulating splines..', 8, 50) do |gauge|
      all_instances = StorytellerRelease.find_in_all_environments do |env_name, completed_count, total_count|
        gauge.puts('XXX') # Yes, this is how Dialog expects us to delimit percentage updates.
        gauge.puts(completed_count * 100 / total_count)
        gauge.puts("Querying marathon...\\n#{env_name}")
        gauge.puts('XXX')
      end

      gauge.puts('XXX')
      gauge.puts(99)
      gauge.puts('Querying consul for active versions...')
      gauge.puts('XXX')
    end

    all_instances
  end

  def deploy_to_env(environment, version)
    #TODO make this a separate rake task
    release_sha = git.tag(version.tr('v', '')).log.first.sha
    build_number = Jenkins.find_storyteller_release_build(release_sha)
    unless build_number
      dialog.msgbox("No Jenkins build found for this release (SHA: #{release_sha})")
      return
    end
    # - Update params in storyteller.toml
    # TODO
    # - Trigger/wait for marathon deploy
    # TODO
    dialog.msgbox("Sorry, not implemented yet. Refer to the Storyteller Deploy Guide in google docs for now. Generated parameters:
SHA: #{release_sha}
Jenkins build number: #{build_number}
");
  end

  def make_active(marathon_instances)
    #TODO make this a separate rake task
    environments = marathon_instances.map(&:environment).sort
    dialog.pause("About to activate #{marathon_instances[0].semver} in #{environments}...", 10, 50, 10)
    if dialog.exit_code == 0
      dialog.gauge('Writing to Consul...', 8, 50) do |gauge|
        # TODO this is mostly fake.
        marathon_instances.each do |release|
          release.activate!
        end
        gauge.puts('XXX')
        gauge.puts(10)
        gauge.puts('Waiting for traffic to cut over...')
        gauge.puts('XXX')
        sleep 5
      end

      dialog.msgbox('JK that was totally fake, still working on it. Refer to the Storyteller Deploy Guide in google docs for now.')
    end
  end

  def open_git_repo
    Git.open(Rake.application.original_dir)
  end
end
