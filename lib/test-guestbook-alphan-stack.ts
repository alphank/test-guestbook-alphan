import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as appsync from "@aws-cdk/aws-appsync";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as nodejslambda from "@aws-cdk/aws-lambda-nodejs";
import * as path from "path";

export class TestGuestbookAlphanStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, "GuestBookApi", {
      name: "guest-book-api",
      schema: appsync.Schema.fromAsset("graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            name: "Guest Book API Key",
            expires: cdk.Expiration.after(cdk.Duration.days(360)),
          },
        },
      },
    });

    // Create DynamoDB
    const commentsTable = new dynamodb.Table(this, "CommentsTable", {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // In case, if we decide to use an existing DynamoDB Table
    // const commentsTable = dynamodb.Table.fromTableAttributes(this, "CommentsTable", {
    //   tableName: "TestGuestbookAlphanStack-CommentsTableBBDBF0A8-10BAHSILH2NJH"
    // });

    // List Comments
    const listCommentsLambda = new lambda.Function(
      this,
      "listCommentsHandler",
      {
        code: lambda.Code.fromAsset("functions"),
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "listComments.handler",
        environment: {
          TABLE_NAME: commentsTable.tableName,
        },
      }
    );

    // commentsTable.grantReadData(listCommentsLambda);
    commentsTable.grantReadWriteData(listCommentsLambda);

    // listCommentsLambda.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     actions: ["dynamodb:Query"],
    //     resources: ["TestGuestbookAlphanStack-CommentsTableBBDBF0A8-10BAHSILH2NJH/index/*"],
    //   })
    // );

    const listCommentsDataSource = api.addLambdaDataSource(
      "listCommentsDataSource",
      listCommentsLambda
    );

    listCommentsDataSource.createResolver({
      typeName: "Query",
      fieldName: "listComments",
    });

    // const commonLambdaProps: Omit<lambda.FunctionProps, "handler"> = {
    //   code: lambda.Code.fromAsset("functions"),
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   memorySize: 2048,
    //   architecture: lambda.Architecture.ARM_64,
    //   environment: {
    //     BOOKS_TABLE: commentsTable.tableName,
    //   },
    // };

    // Add Comment
    const addCommentLambda = new nodejslambda.NodejsFunction(
      this,
      "addCommentHandler",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        memorySize: 2048,
        architecture: lambda.Architecture.ARM_64,
        environment: {
          TABLE_NAME: commentsTable.tableName,
        },
        entry: path.join(__dirname, "../functions/addComment.ts"),
      }
    );

    commentsTable.grantReadWriteData(addCommentLambda);

    const addCommentDataSource = api.addLambdaDataSource(
      "addCommentDataSource",
      addCommentLambda
    );

    addCommentDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addComment",
    });

    // Remove Comment
    const removeCommentLambda = new nodejslambda.NodejsFunction(
      this,
      "removeCommentHandler",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        memorySize: 2048,
        architecture: lambda.Architecture.ARM_64,
        environment: {
          TABLE_NAME: commentsTable.tableName,
        },
        entry: path.join(__dirname, "../functions/removeComment.ts"),
      }
    );

    commentsTable.grantReadWriteData(removeCommentLambda);

    const removeCommentDataSource = api.addLambdaDataSource(
      "removeCommentDataSource",
      removeCommentLambda
    );

    removeCommentDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "removeComment",
    });

  }
}
