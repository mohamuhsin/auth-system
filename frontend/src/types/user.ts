export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: "ADMIN" | "USER" | "CREATOR" | "MERCHANT";
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}
