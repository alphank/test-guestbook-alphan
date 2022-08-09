import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { Comment, MutationRemoveCommentArgs } from "../types/comments";

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationRemoveCommentArgs,
  Comment | null
> = async (event) => {
  try {
    if (!process.env.TABLE_NAME) {
      console.error("TABLE_NAME is not defined");
      return null;
    }

    const params: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: process.env.TABLE_NAME,
      Key: {
        pk: event.arguments.comment.pk,
        sk: event.arguments.comment.sk,
      },
    };

    const data = await documentClient
      .delete(params, function (err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data.Attributes);
        }
      })
      .promise();

    return data.Attributes as Comment;
  } catch (error) {
    console.error("Whoops", error);
    return null;
  }
};
