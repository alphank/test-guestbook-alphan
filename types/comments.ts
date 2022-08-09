export type Comment = {
  pk: string;
  sk: string;
  subject?: string;
  content: string;
  author?: string;
  createdAt: string;
};

export type AddCommentInput = {
  subject?: string;
  content: string;
  author?: string;
};

export type MutationAddCommentArgs = {
  comment: AddCommentInput;
};

export type RemoveCommentInput = {
  pk: string;
  sk: string;
};

export type MutationRemoveCommentArgs = {
  comment: RemoveCommentInput;
};
