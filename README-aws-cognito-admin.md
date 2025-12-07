## Step 1: Create an IAM User

1. **Go to AWS Console** → **IAM** → **Users**
2. Click **"Create user"**
3. Enter a username (e.g., `cloudflare-cognito-admin`)
4. **Do NOT** check "Provide user access to the AWS Management Console" (this is for programmatic access only)
5. Click **"Next"**

## Step 2: Create a Custom Policy for Cognito Admin Operations

1. In the permissions step, click **"Attach policies directly"**
2. Click **"Create policy"**
3. Switch to the **JSON** tab and paste this policy:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"cognito-idp:AdminSetUserPassword",
				"cognito-idp:AdminResetUserPassword",
				"cognito-idp:AdminDisableUser",
				"cognito-idp:AdminEnableUser",
				"cognito-idp:AdminUpdateUserAttributes",
				"cognito-idp:AdminConfirmSignUp",
				"cognito-idp:AdminGetUser",
				"cognito-idp:ListUsers",
				"cognito-idp:AdminListGroupsForUser",
				"cognito-idp:AdminAddUserToGroup",
				"cognito-idp:AdminRemoveUserFromGroup",
				"cognito-idp:ListUsersInGroup"
			],
			"Resource": ["arn:aws:cognito-idp:*:*:userpool/us-east-1_0XGT1858l"]
		}
	]
}
```

4. **Replace `YOUR_USER_POOL_ID`** with your actual Cognito User Pool ID
5. Click **"Next"**
6. Give it a name like `CognitoAdminPolicy`
7. Add a description: `Policy for Cognito admin operations via Cloudflare Worker`
8. Click **"Create policy"**

```zsh
# Policy DexpCfFeCognitoAdminPolicy created.
```

## Step 3: Attach the Policy to Your User

1. Go back to the user creation process
2. Search for your newly created policy (`CognitoAdminPolicy`)
3. Check the box next to it
4. Click **"Next"**
5. Review and click **"Create user"**

```zsh
# cloudflare-cognito-admin user
```

## Step 4: Generate Access Keys

1. Click on your newly created user
2. Go to the **"Security credentials"** tab
3. Scroll down to **"Access keys"**
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"**
7. Add a description tag (optional): `Cloudflare Worker Cognito Access`
8. Click **"Create access key"**

## Step 5: Save Your Credentials

**⚠️ IMPORTANT**: Copy both the **Access Key ID** and **Secret Access Key** immediately. The secret key will only be shown once!

```
Access Key ID: AKIA...
Secret Access Key: w...
```

## Step 6: Add Secrets to Cloudflare Worker

Run these commands in your project directory:

```bash
# Add the Access Key ID
wrangler secret put AWS_ACCESS_KEY_ID
# When prompted, paste your Access Key ID

# Add the Secret Access Key
wrangler secret put AWS_SECRET_ACCESS_KEY
# When prompted, paste your Secret Access Key
```

## Step 7: Find Your User Pool ID

If you don't know your User Pool ID:

1. Go to **AWS Console** → **Cognito** → **User pools**
2. Click on your user pool
3. The User Pool ID is shown at the top (format: `us-east-1_xxxxxxxxx`)

## Step 8: Update Your Policy with the Correct User Pool ID

1. Go back to **IAM** → **Policies**
2. Find your `CognitoAdminPolicy`
3. Click on it, then click **"Edit"**
4. Replace `YOUR_USER_POOL_ID` with your actual User Pool ID
5. Save the changes

## Alternative: More Restrictive Policy (Recommended)

If you want to be more specific about which user pool and region:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"cognito-idp:AdminSetUserPassword",
				"cognito-idp:AdminResetUserPassword",
				"cognito-idp:AdminDisableUser",
				"cognito-idp:AdminEnableUser",
				"cognito-idp:AdminUpdateUserAttributes",
				"cognito-idp:AdminConfirmSignUp",
				"cognito-idp:AdminGetUser",
				"cognito-idp:ListUsers",
				"cognito-idp:AdminListGroupsForUser",
				"cognito-idp:AdminAddUserToGroup",
				"cognito-idp:AdminRemoveUserFromGroup",
				"cognito-idp:ListUsersInGroup"
			],
			"Resource": "arn:aws:cognito-idp:us-east-1:YOUR_ACCOUNT_ID:userpool/YOUR_USER_POOL_ID"
		}
	]
}
```

Replace:

- `us-east-1` with your AWS region
- `YOUR_ACCOUNT_ID` with your AWS account ID (12-digit number)
- `YOUR_USER_POOL_ID` with your User Pool ID

## Security Best Practices

1. **Rotate credentials regularly** (every 90 days)
2. **Monitor usage** in CloudTrail
3. **Use least privilege** - only grant necessary permissions
4. **Consider using temporary credentials** with STS for production

## Testing

After setting up, test your configuration by deploying and checking if your Cognito operations work without authentication errors.

Your credentials are now ready to use with your Cloudflare Worker!
