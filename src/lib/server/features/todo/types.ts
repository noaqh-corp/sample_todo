export type Todo = {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

