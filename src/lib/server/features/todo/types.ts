export type Category = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Todo = {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  categoryId: string | null;
  category?: Category | null;
  createdAt: Date;
  updatedAt: Date;
};

