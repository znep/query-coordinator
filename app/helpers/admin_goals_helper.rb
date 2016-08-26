module AdminGoalsHelper
  def render_admin_goals_session_data
    session_data = {
        :userId => current_user.try(:id) || 'N/A',
        :socrataEmployee => current_user.try(:is_superadmin?) || false,
        :userRoleName => current_user.try(:roleName) || 'N/A',
        :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end
end
