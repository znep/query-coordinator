class EmailInterest < Model
  cattr_accessor :specification

  def self.create(user_id, tag)
    path = "/users/#{user_id}/#{self.service_name}.json"
    attributes = {eventTag: tag}
    CoreServer::Base.connection.create_request(path, attributes.to_json)
  end

  def delete(user_id)
    path = "/users/#{user_id}/#{self.class.service_name}/#{eventTag}"
    return CoreServer::Base.connection.delete_request(path)
  end

  @@specification = {
    'MAIL.ACCOUNT_CREATED_FROM_FUTURE_ACCOUNT' =>
      {right: 'manage_users',   description: 'A user creates their privileged account'},
    'MAIL.ANY_VIEW_CREATED' => {description: 'Any view is created'},
    'MAIL.COMMENT_NEEDS_MODERATION' =>
      {right: 'moderate_comments', description: 'A comment is submitted requiring moderation'},
    'MAIL.FUTURE_ACCOUNT_CREATED' =>
      {right: 'manage_users',   description: 'A privileged account is provisioned for future use'},
    'MAIL.NEW_NOMINATION' =>   {description: 'A new nomination is created'},
    'MAIL.NOMINATION_STATUS_CHANGED' => {description: 'Any nomination is moderated'},
    'MAIL.VIEW_MADE_PUBLIC' => {description: 'Any view is made public'},
  }
end
