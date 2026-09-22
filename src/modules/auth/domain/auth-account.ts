export interface AuthAccount {
  id: string;
  email: string;
  fullname: string;
  passwordHash: string;
  active: boolean;
  createdBy: string | null;
  createdAt: Date;
  modifiedBy: string | null;
  modifiedAt: Date;
  deletedBy: string | null;
  deletedAt: Date | null;
  deleted: boolean;
}
