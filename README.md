# Example repo

Code examples for the blog post `AWS Lambda code signing`

## Requirements

- `aws-cdk`
- `aws-cli`
- IAM role to deploy the CDK stack

## Commands

- `cdk boostrap`: Boostrap the CDK environment
- `cdk deploy`: Deploy the CDK stack
- `aws s3 cp function/function.zip s3://<your s3 bucket>/function.zip`: Copy the function to the S3 bucket
- `aws signer start-signing-job --cli-input-json file://scripts/start-signing-job.json`: Start a signing job
- `aws lambda update-function-code --cli-input-json file://scripts/update-function-code.json --profile aws-update-signed-code`: Update a function

## Resources created

- S3 Bucket with versioning enabled
- Lambda Code Signing Configuration
- Signer Profile
- IAM Policy
- IAM user

## Notes

When deleting the stack, make sure that you empty your S3 bucket. S3 buckets with objects will not be deleted.
