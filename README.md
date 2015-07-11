# cloudtrailindexer

this is a sample lambda function to monitor the events on your S3 bucket where CloudTrail log files are generated. It is going to load the zip file, uncompress it, parse the records and then insert it into ElasticSearch.

To use this function, create a lambda function deployment package. More details on AWS public docs http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-create-test-function-create-function.html.

1) Create the deployment package
2) Create the IAM Lamba Invocation Role
3) Create the IAM Lambda Execution Role
4) Create your function
