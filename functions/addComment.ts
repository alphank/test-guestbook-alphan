import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { Comment, MutationAddCommentArgs } from "../types/comments";

import KSUID = require("ksuid");

const documentClient = new DynamoDB.DocumentClient();

export const handler: AppSyncResolverHandler<
  MutationAddCommentArgs,
  Comment | null
> = async (event) => {
  try {
    console.log(event.arguments.comment.content);

    const ksuid = KSUID.randomSync();

    const year = ksuid.date.getFullYear();
    const month = ksuid.date.getMonth();

    const truncDate = year + "-" + (month < 10 ? "0" + month : month);

    var comment: Comment = {
      ...event.arguments.comment,
      pk: "COMMENT#" + truncDate,
      sk: "COMMENT#" + ksuid.string,
      createdAt: ksuid.date.toISOString(),
    };

    console.log(JSON.stringify(comment));

    if (!process.env.TABLE_NAME) {
      console.error("TABLE_NAME is not defined");
      return null;
    }

    await documentClient
      .put({
        TableName: process.env.TABLE_NAME,
        Item: comment,
      })
      .promise();

    return comment;
  } catch (error) {
    console.error("ERROR!!!", error);
    return null;
  }
};
