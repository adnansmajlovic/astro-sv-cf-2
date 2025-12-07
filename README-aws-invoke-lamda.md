# Create IAM User for Lambda Function Invocation

## Step 1: Create IAM User

1. **Sign in to AWS Console** and navigate to **IAM**
2. Click **Users** in the left sidebar
3. Click **Create user**
4. **User name**: `cloudflare-sveltekit-lambda-invoker` (or your preferred name)
5. **Access type**: Select **Programmatic access** (Access key - Programmatic access)
6. Click **Next**

## Step 2: Create Custom Policy

1. On the **Set permissions** page, select **Attach policies directly**
2. Click **Create policy**
3. Switch to the **JSON** tab
4. Replace the default policy with:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": ["lambda:InvokeFunction"],
			"Resource": ["arn:aws:lambda:*:*:function:gpt-openai-matchmaking-*"]
		}
	]
}
```

5. Click **Next: Tags** (optional - you can skip tags)
6. Click **Next: Review**
7. **Policy name**: `LambdaInvokeGPTMatchmaking`
8. **Description**: `Allows invoking GPT OpenAI matchmaking Lambda functions`
9. Click **Create policy**

## Step 3: Attach Policy to User

1. Go back to the user creation tab
2. Refresh the policy list (click the refresh icon)
3. Search for `LambdaInvokeGPTMatchmaking`
4. Check the box next to your newly created policy
5. Click **Next: Tags** (optional)
6. Click **Next: Review**
7. Review the user details and click **Create user**

## Step 4: Save Credentials - Generate Access Keys

1. Click on your newly created user
2. Go to the **"Security credentials"** tab
3. Scroll down to **"Access keys"**
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"**
7. Add a description tag (optional): `Cloudflare Worker Lambda Access`
8. Click **"Create access key"**

⚠️ **Important**: This is the only time you'll see the secret access key!

1. **Copy** both the **Access key ID** and **Secret access key**
2. Store them securely (password manager, secure notes, etc.)
3. Click **Close**

## Step 5: Add to Cloudflare Workers Environment Variables

1. Go to your **Cloudflare Dashboard**
2. Navigate to **Workers & Pages**
3. Select your SvelteKit application
4. Go to **Settings** → **Environment variables**
5. Add these variables:

```
LAMBDA_AWS_ACCESS_KEY_ID = your_access_key_id_here
LAMBDA_AWS_SECRET_ACCESS_KEY = your_secret_access_key_here
AWS_REGION = your_aws_region (e.g., us-east-1)
```

```bash
# Add the Access Key ID
wrangler secret put LAMBDA_AWS_ACCESS_KEY_ID
# When prompted, paste your Access Key ID

# Add the Secret Access Key
wrangler secret put LAMBDA_AWS_SECRET_ACCESS_KEY
# When prompted, paste your Secret Access Key
```

6. Click **Save**

## Step 6: Update Your Code

Update your `+server.js` file to use the new credentials:

```javascript
const lambdaClient = new LambdaClient({
	region: awsmobile.aws_user_files_s3_bucket_region,
	credentials: {
		accessKeyId: process.env.LAMBDA_AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.LAMBDA_AWS_SECRET_ACCESS_KEY,
	},
});
```

## Step 7: Deploy and Test

1. Deploy your updated application
2. Test the Lambda invocation functionality
3. Check CloudWatch logs if there are any issues

## Security Notes

- ✅ This user can **only** invoke Lambda functions matching the pattern `gpt-openai-matchmaking-*`
- ✅ No other AWS services can be accessed with these credentials
- ✅ Keep these credentials separate from your Cognito credentials
- 🔄 Consider rotating these credentials periodically (every 90 days)

Your Lambda invocation should now work without the "Credential is missing" error!

Test
