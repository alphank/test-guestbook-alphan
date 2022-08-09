import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { QueryInput } from "aws-sdk/clients/dynamodb";
import { Comment } from "../types/comments";

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  null,
  Comment[] | null
> = async () => {
  if (!process.env.TABLE_NAME) {
    console.error("TABLE_NAME is not defined");
    return null;
  }

  try {
    // const dataAsync = await documentClient
    //   .scan({
    //     TableName: process.env.TABLE_NAME,
    //   })
    //   .promise();

    // console.log(JSON.stringify(dataAsync));

    const date = new Date();
    const month = date.getMonth();
    const truncDate =
      date.getUTCFullYear() + "-" + (month < 10 ? "0" + month : month);

    const params: QueryInput = {
      TableName: process.env.TABLE_NAME,
      //   IndexName: "sk",
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": "COMMENT#" + truncDate,
      },
      Limit: 10,
      ScanIndexForward: false,
    };

    console.log("params = " + JSON.stringify(params));

    const data = await documentClient
      .query(params, function (err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data.Items);
        }
      })
      .promise();

    return data.Items as Comment[];
  } catch (error) {
    console.error("ERROR!!!", error);

    return null;
  }
};
