import { Todo } from "../types";
import {v4 as uuid} from "uuid";

const DELAY = 100;

let todos: Todo[] = [
  {
    id: uuid(),
    title: "Do stuff",
    completed: true
  },
  {
    id: uuid(),
    title: "Do other stuff",
    completed: false
  }
];

export const fetchAll = (): Promise<Todo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(todos);
    }, DELAY);
  });
};

export const create = ({
  title,
  completed
}: {
  title: string;
  completed?: boolean;
}): Promise<Todo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let todo: Todo = { id: uuid(), title, completed: completed ?? false };
      todos = [...todos, todo];
      resolve(todo);
    }, DELAY);
  });
};

export const deleteRecord = (todo: Todo): Promise<Todo> => {
  return new Promise((resolve, reject) => {
    let deletedTodo = todos.find((t) => t.id === todo.id);
    if (!deletedTodo) {
      throw new Error("404");
    }

    setTimeout(() => {
      todos = todos.filter((todo) => todo !== deletedTodo);
      resolve(deletedTodo!);
    }, DELAY);
  });
};

export const clearCompleted = (): Promise<Todo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      todos = todos.filter((todo) => !todo.completed);
      resolve(todos);
    }, DELAY);
  });
};

export const markAll = ({
  completed
}: {
  completed: boolean;
}): Promise<Todo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      todos = todos.map((todo) => ({ ...todo, completed }));
      resolve(todos);
    }, 100);
  });
};

export const update = (todo: Todo): Promise<Todo> => {
  return new Promise((resolve, reject) => {
    let editedTodo = todos.find((t) => t.id === todo.id);
    if (!editedTodo) {
      throw new Error("404");
    }

    setTimeout(() => {
      editedTodo!.completed = todo.completed;
      editedTodo!.title = todo.title;
      resolve(editedTodo!);
    }, 100);
  });
};
