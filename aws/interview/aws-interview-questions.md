# AWS Interview Questions

This document contains a list of AWS (Amazon Web Services) interview questions ranging from junior to senior levels.

## Junior Developer Questions

1.  **What is AWS?**
    *   AWS is a comprehensive, evolving cloud computing platform provided by Amazon. It offers a mix of infrastructure as a service (IaaS), platform as a service (PaaS), and packaged software as a service (SaaS) offerings.

2.  **What is an EC2 instance?**
    *   EC2 (Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud. It is designed to make web-scale cloud computing easier for developers. It's essentially a virtual server in the cloud.

3.  **What is S3?**
    *   S3 (Simple Storage Service) is an object storage service that offers industry-leading scalability, data availability, security, and performance. You can use it to store and retrieve any amount of data, at any time, from anywhere on the web.

4.  **What is IAM?**
    *   IAM (Identity and Access Management) is a web service that helps you securely control access to AWS resources. You use IAM to control who is authenticated (signed in) and authorized (has permissions) to use resources.

5.  **What is a VPC?**
    *   A VPC (Virtual Private Cloud) is a virtual network dedicated to your AWS account. It is logically isolated from other virtual networks in the AWS Cloud. You can launch your AWS resources, such as Amazon EC2 instances, into your VPC.

6.  **What is RDS?**
    *   RDS (Relational Database Service) is a managed relational database service that makes it easy to set up, operate, and scale a relational database in the cloud. It supports several database engines like PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server.

## Mid-level Developer Questions

1.  **What is AWS Lambda?**
    *   AWS Lambda is a serverless compute service that lets you run code without provisioning or managing servers. You can run code for virtually any type of application or backend service with zero administration. You only pay for the compute time you consume.

2.  **What is API Gateway?**
    *   Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. It can act as a "front door" for applications to access data, business logic, or functionality from your back-end services, such as workloads running on EC2, code running on Lambda, or any web application.

3.  **What is the difference between a Security Group and a Network ACL (NACL)?**
    *   **Security Group**: Acts as a virtual firewall for your instance to control inbound and outbound traffic. It is stateful, meaning if you allow inbound traffic, the outbound return traffic is automatically allowed.
    *   **NACL**: An optional layer of security for your VPC that acts as a firewall for controlling traffic in and out of one or more subnets. It is stateless, meaning you must explicitly allow both inbound and outbound traffic.

4.  **What is AWS CloudFormation?**
    *   AWS CloudFormation is a service that helps you model and set up your Amazon Web Services resources so that you can spend less time managing those resources and more time focusing on your applications. You create a template that describes all the AWS resources that you want (like EC2 instances or RDS DB instances), and CloudFormation takes care of provisioning and configuring those resources for you. This is known as Infrastructure as Code (IaC).

5.  **What is the difference between S3 and EBS?**
    *   **S3**: Object storage. It's used for storing files, and it's accessible from anywhere on the web. It's highly durable and scalable.
    *   **EBS (Elastic Block Store)**: Block storage. It's a virtual hard drive that you attach to an EC2 instance. It provides low-latency access for workloads that require high performance.

6.  **What is DynamoDB?**
    *   Amazon DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance with seamless scalability. It's a key-value and document database.

## Senior Developer Questions

1.  **How would you design a highly available and scalable application on AWS?**
    *   Discuss a multi-tiered architecture using:
        *   **Elastic Load Balancer (ELB)** to distribute traffic across multiple EC2 instances.
        *   **Auto Scaling Groups** to automatically scale the number of EC2 instances up or down based on demand.
        *   **Multi-AZ (Availability Zone)** deployment for both EC2 instances and RDS databases to ensure high availability.
        *   **Route 53** for DNS management and routing traffic to the ELB.
        *   **CloudFront** as a CDN to cache content closer to users.

2.  **What is the AWS Well-Architected Framework?**
    *   The Well-Architected Framework is a guide for designing and operating reliable, secure, efficient, and cost-effective systems in the cloud. It is based on five pillars:
        1.  Operational Excellence
        2.  Security
        3.  Reliability
        4.  Performance Efficiency
        5.  Cost Optimization

3.  **What is the difference between ECS and EKS?**
    *   **ECS (Elastic Container Service)**: A fully managed container orchestration service from AWS. It's simpler to use and deeply integrated with the AWS ecosystem.
    *   **EKS (Elastic Kubernetes Service)**: A managed Kubernetes service. It allows you to run Kubernetes on AWS without needing to install and operate your own Kubernetes control plane. It's a good choice if you want to use the standard Kubernetes platform.

4.  **Explain different cost optimization strategies in AWS.**
    *   Discuss strategies like:
        *   **Right-sizing instances**: Choosing the correct instance type for your workload.
        *   **Using Reserved Instances or Savings Plans**: For predictable workloads to get a significant discount compared to On-Demand pricing.
        *   **Using Spot Instances**: For fault-tolerant workloads to take advantage of unused EC2 capacity at a steep discount.
        *   **Implementing lifecycle policies in S3**: To move data to cheaper storage classes (like S3 Glacier) as it ages.
        *   **Monitoring costs**: Using AWS Cost Explorer and setting up billing alerts.

5.  **What is a VPC Peering connection vs. a Transit Gateway?**
    *   **VPC Peering**: A networking connection between two VPCs that enables you to route traffic between them using private IPv4 or IPv6 addresses. It's a 1-to-1 connection.
    *   **Transit Gateway**: A network transit hub that you can use to interconnect your VPCs and on-premises networks. It simplifies your network architecture by acting as a central hub, so you don't need to create complex peering relationships.

6.  **How would you implement a CI/CD pipeline on AWS?**
    *   Describe a pipeline using AWS developer tools:
        *   **AWS CodeCommit**: As the source control repository.
        *   **AWS CodeBuild**: To compile source code, run tests, and produce software packages.
        *   **AWS CodeDeploy**: To automate software deployments to a variety of compute services such as EC2, Lambda, and ECS.
        *   **AWS CodePipeline**: To orchestrate the entire build, test, and deploy process.
