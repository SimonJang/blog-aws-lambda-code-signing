import {Construct, Stack, StackProps, RemovalPolicy, Duration} from '@aws-cdk/core';
import {Bucket} from '@aws-cdk/aws-s3';
import {SigningProfile, Platform} from '@aws-cdk/aws-signer';
import {CodeSigningConfig, UntrustedArtifactOnDeployment} from '@aws-cdk/aws-lambda';
import {PolicyStatement, Effect, User, Policy} from '@aws-cdk/aws-iam';

export class CodeSigningStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

	// Create S3 bucket to contain the code artifacts
    const bucket = new Bucket(this, 'code-signing-artifact-bucket', {
		versioned: true,
		bucketName: process.env.S3_BUCKET_NAME,
		removalPolicy: RemovalPolicy.DESTROY
	});

	// Create a Signing profile
	const signingProfile = new SigningProfile(this, 'code-signing-profile', {
		platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
		signatureValidity: Duration.days(365),
		signingProfileName: process.env.PROFILE_NAME,
	});

	// Create the Code signing configuration for AWS Lambda
	const codeSigningConfig = new CodeSigningConfig(this, 'code-signing-lambda-configuration', {
		description: 'Example code signing configuration for AWS Lambda',
		untrustedArtifactOnDeployment: 'Enforce' as UntrustedArtifactOnDeployment.ENFORCE,
		signingProfiles: [signingProfile]
	});

	/**
	 * IAM user to be used for the examples
	 */
	const signingPolicy = new Policy(this, 'signer-user', {
		statements: [
			/**
			 * Permissions to start a signing job
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: [`${bucket.bucketArn}/*`, bucket.bucketArn],
				actions: ['s3:GetObjectVersion', 's3:PutObject', 's3:ListBucket']
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: [signingProfile.signingProfileArn],
				actions: ['signer:GetSigningProfile', 'signer:StartSigningJob']
			}),
			/**
			 * Guardrails
			 */
			new PolicyStatement({
				effect: Effect.DENY,
				resources: ['*'],
				actions: [
					'signer:PutSigningProfile',
					'lambda:DeleteFunctionCodeSigningConfig',
					'lambda:UpdateCodeSigningConfig',
					'lambda:DeleteCodeSigningConfig',
					'lambda:CreateCodeSigningConfig'
				]
			}),
			/**
			 * Permissions to create a function
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: ['*'],
				actions: ['lambda:CreateFunction', 'lambda:PutFunctionCodeSigningConfig'],
				conditions: {
					StringEquals: {
						'lambda:CodeSigningConfigArn': [codeSigningConfig.codeSigningConfigArn]
					}
				}
			}),
			/**
			 * Permissions to update a function
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: ['*'],
				actions: ['lambda:UpdateFunctionCode']
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: [codeSigningConfig.codeSigningConfigArn],
				actions: ['lambda:GetCodeSigningConfig']
			})
		]
	});

	const user = new User(this, 'user-signer');

	user.attachInlinePolicy(signingPolicy);
  }
}
