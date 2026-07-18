export interface BoardResponse {
  id: string;
  title: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC" | "UNLISTED";
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}