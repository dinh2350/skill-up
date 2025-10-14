## IAM - AWS

Category: Security, Identity, & Compliance

Date: October 4, 2025

## 🎯 What It Does

AWS Identity and Access Management (IAM) is a web service that helps you securely control access to AWS resources. You use IAM to control who is authenticated (signed in) and authorized (has permissions) to use resources.

## 🤔 Why It Exists / Problem It Solves

- **What problem does this service solve?** It solves the problem of managing and controlling user access to your AWS resources in a secure and granular way.
- **What pain points does it address?** It prevents the need to share the root account credentials, which is a major security risk. It allows you to grant specific permissions to specific users or services, following the principle of least privilege.
- **What would you have to do without this service?** You would have to share your root account, giving everyone full access to all your resources, or build a complex, custom authentication and authorization system from scratch.

## 🔑 Key Concepts & Features

### Core Features

- **Centralized Control:** Manage all your users and their permissions from a single place.
- **Granular Permissions:** Define exactly which resources users can access and what actions they can perform.
- **Identity Federation:** Allows you to use existing identities from your corporate directory (like Active Directory) or from web identity providers (like Google or Facebook) to grant access to your AWS account.
- **Multi-Factor Authentication (MFA):** Adds an extra layer of security for your root account and IAM users.

### Important Terms/Components

- **Users:** An entity representing a person or application that interacts with AWS.
- **Groups:** A collection of IAM users. Permissions applied to a group are inherited by all users in that group.
- **Roles:** An identity with specific permissions that can be assumed by trusted entities (users, applications, or other AWS services). Roles are ideal for granting temporary access.
- **Policies:** JSON documents that explicitly define permissions. Policies can be attached to users, groups, or roles.

## 💡 When to Use It

### Good Use Cases ✅

- **Securing the Root Account:** The first step in any AWS account is to create an IAM user for daily administration and lock away the root account credentials.
- **Granting Access to Developers:** Create IAM users for your developers with permissions limited to the services they need for their work.
- **Service-to-Service Access:** Use IAM Roles to allow an AWS service (like an EC2 instance) to access another service (like an S3 bucket) without embedding credentials in your code.

### NOT Good For ❌

- **Application-Level Authentication:** IAM is for controlling access to AWS resources, not for managing users for your own application (use Amazon Cognito for that).
- **Replacing a full-fledged Directory Service:** While it has user management features, it's not a replacement for Microsoft Active Directory for enterprise-wide identity management, though it can integrate with it.

## 🏗️ How It Works (Architecture)

IAM is a global service, meaning users and groups are created globally, but it operates on a regional basis when interacting with regional services.

**Example Flow:**

1.  A **User** (or an application assuming a **Role**) makes a request to an AWS service (e.g., S3).
2.  The AWS service checks with IAM to see if the user's attached **Policy** allows the requested action.
3.  IAM evaluates the policy and sends back an "allow" or "deny" decision.
4.  The AWS service either performs the action or returns an "access denied" error.

### Relationships with Other Services

- **Works with:** Nearly all AWS services. IAM is fundamental to the security of your entire AWS environment.
- **Common combinations:**
  - **IAM + EC2:** Use IAM Roles to give EC2 instances permissions to access other services.
  - **IAM + S3:** Use IAM policies to control who can read from or write to your S3 buckets.
- **Alternatives/Competitors:** While IAM is foundational in AWS, concepts are similar to role-based access control (RBAC) in other cloud providers like Azure AD or Google Cloud IAM.

## 💻 Practical Examples

### Basic Setup/Configuration

```bash
# Create a new IAM user named 'test-user'
aws iam create-user --user-name test-user

# Create a login profile for the user to enable console access
aws iam create-login-profile --user-name test-user --password "A-Secure-P@ssw0rd" --password-reset-required

# Attach a pre-built AWS managed policy to grant read-only access to S3
aws iam attach-user-policy --user-name test-user --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

### Real-World Example

**Scenario**: You have a web application running on an EC2 instance that needs to upload files to an S3 bucket.

**Implementation**:

1.  Create an IAM Role with a policy that grants `s3:PutObject` permissions for the specific bucket.
2.  Create an "instance profile" and attach this role to it.
3.  Launch the EC2 instance and associate it with the instance profile.
4.  The application code (using an AWS SDK) will automatically use the role's temporary credentials to access S3 securely, with no need to store access keys on the instance.

## ⚠️ Important Things to Know (Gotchas)

### Common Mistakes

- ❌ **Using the Root Account:** Never use the root account for daily tasks. It has unrestricted access and cannot be limited.
- ❌ **Overly Permissive Policies:** Avoid using wildcard (`*`) permissions. Always follow the principle of least privilege by granting only the permissions required.
- ❌ **Embedding Access Keys:** Don't hardcode access keys in your application code. Use IAM Roles for AWS services or load credentials from a secure location.

### Best Practices

- ✅ **Enable MFA on Root Account:** This is the single most important security step.
- ✅ **Use Roles for Applications:** Always use IAM Roles for applications running on EC2, ECS, Lambda, etc.
- ✅ **Regularly Rotate Credentials:** Rotate IAM user access keys and passwords periodically.
- ✅ **Use IAM Access Analyzer:** This tool helps you identify and remove unintended external access to your resources.

### Security Considerations

- **Credential Leakage:** If an access key is leaked, it can be used by anyone to access your resources. Rotate keys immediately if you suspect a compromise.
- **Privilege Escalation:** A poorly configured policy could allow a user to grant themselves more permissions than they should have.

## 💰 Pricing Model

- **Pricing Type**: Free.
- **What you pay for**: IAM itself is free of charge. You pay for the usage of other AWS services by your IAM users.

## 📊 Limits & Quotas

- **Users per Account:** 5,000
- **Groups per Account:** 300
- **Roles per Account:** 1,000
- These are soft limits and can often be increased by requesting it through the AWS Service Quotas console.

## 🔗 Related Services & Comparisons

| Service                   | Difference                                                      | When to Use Each                                                                            |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **IAM**                   | Manages **access to AWS resources**.                            | Use for controlling what users and services can do within your AWS account.                 |
| **Amazon Cognito**        | Manages **users of your applications**.                         | Use for user sign-up, sign-in, and access control for your web and mobile apps.             |
| **AWS Directory Service** | Provides a managed **Microsoft Active Directory** in the cloud. | Use when you need a managed directory service or want to extend your on-premises AD to AWS. |

## 📝 My Questions & Answers

**Q**: What's the difference between an IAM user and an IAM role?
**A**: A user has permanent credentials and represents a specific person or application. A role is meant to be temporarily assumed and does not have its own permanent credentials; it's for granting temporary, specific permissions.

## 🔖 Quick Reference

### Most Common Commands/Actions

```bash
# List users
aws iam list-users

# Create a user
aws iam create-user --user-name <username>

# Attach a policy to a user
aws iam attach-user-policy --user-name <username> --policy-arn <policy-arn>

# Create a role
aws iam create-role --role-name <rolename> --assume-role-policy-document file://trust-policy.json
```

## 📚 Resources & Links

- [Official AWS IAM Documentation](https://aws.amazon.com/iam/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [A Practical Guide to AWS IAM](https://www.youtube.com/watch?v=YQsK4MtsELU)

## ✅ My Understanding Checklist

- [x] I can explain what this service does to someone else
- [x] I understand when to use it vs alternatives
- [ ] I've tried a hands-on example
- [x] I know the basic pricing model
- [x] I understand how it connects to other services

## 📌 Personal Notes & Insights

IAM is the backbone of security in AWS. Mastering it is non-negotiable. The key takeaway is the "principle of least privilege"—always start with minimal permissions and only add more as needed. Roles are a more secure and flexible way to grant permissions than user access keys, especially for applications.
