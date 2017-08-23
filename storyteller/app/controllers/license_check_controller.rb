class LicenseCheckController < ApplicationController
  def user_has_stories_rights?
    if params[:email]
      begin
        options = {
          verb: :get,
          path: '/users',
          query_params: {
            method: 'getByEmail',
            email: params[:email]
          }
        }

        response = CoreServer.core_server_http_request(options)

        if response.ok?
          user = response.json
          rights = user['rights']

          # users with any of these rights are considered "stories users"
          # and can be added as co-owners of stories
          stories_rights = %w[
            create_story
            create_story_copy
            edit_story
            edit_story_title_desc
            delete_story
            manage_story_collaborators
            manage_story_visibility
            manage_story_public_version
          ]

          render :json => {
            userExists: true,
            hasStoriesRights:
              user.key?('rights') && (stories_rights & rights).any?
          }
        else
          render :json => {
            userExists: false,
            hasStoriesRights: false
          }
        end
      rescue StandardError => ex
        Rails.logger.warn(ex)
        render :nothing => true, :status => :internal_server_error
      end
    end

    render :nothing => true, :status => :bad_request unless performed?
  end
end
