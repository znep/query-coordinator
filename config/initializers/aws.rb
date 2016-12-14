# This configuration is used for connecting to S3 in the UploadsController

# Funfact:
#   AWS (all caps) is the namespace defined in aws-sdk-v1
#   Aws (pascal case) is the namespace defined in aws-sdk (v2)
aws_credentials = Aws::Credentials.new(
                      Rails.application.secrets.aws['access_key_id'],
                      Rails.application.secrets.aws['secret_access_key']
                  )

Aws.config.update(
  credentials: aws_credentials,
  region: Rails.application.secrets.aws['s3_region']
)
