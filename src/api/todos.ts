import { Todo } from "../types";
import { v4 as uuid } from "uuid";

const DELAY = 100;
const LOCAL_STORAGE_KEY = "todos-database";

let todos: Todo[] = null!;
reload();
todos = todos ?? [
  {
    id: uuid(),
    title: "Do stuff",
    completed: true,
  },
  {
    id: uuid(),
    title: "Do other stuff",
    completed: false,
  },
];
persist();

function reload() {
  try {
    todos = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
  } catch (e) {}
}

function persist() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.warn(e);
  }
}

export const fetchAll = (): Promise<Todo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      reload();
      resolve(todos);
    }, DELAY);
  });
};

export const create = ({
  title,
  completed,
}: {
  title: string;
  completed?: boolean;
}): Promise<Todo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      reload();
      let todo: Todo = { id: uuid(), title, completed: completed ?? false };
      todos = [...todos, todo];
      persist();
      resolve(todo);
    }, DELAY);
  });
};

export const deleteRecord = (todo: Todo): Promise<Todo> => {
  return new Promise((resolve) => {
    reload();
    let deletedTodo = todos.find((t) => t.id === todo.id);
    if (!deletedTodo) {
      throw new Error("404");
    }
    todos = todos.filter((todo) => todo !== deletedTodo);
    persist();

    setTimeout(() => {
      resolve(deletedTodo!);
    }, DELAY);
  });
};

export const clearCompleted = (): Promise<Todo[]> => {
  return new Promise((resolve) => {
    reload();
    todos = todos.filter((todo) => !todo.completed);
    persist();
    setTimeout(() => {
      resolve(todos);
    }, DELAY);
  });
};

export const markAll = ({
  completed,
}: {
  completed: boolean;
}): Promise<Todo[]> => {
  return new Promise((resolve) => {
    reload();
    todos = todos.map((todo) => ({ ...todo, completed }));
    persist();
    setTimeout(() => {
      resolve(todos);
    }, 100);
  });
};

export const update = (todo: Todo): Promise<Todo> => {
  return new Promise((resolve) => {
    reload();
    let editedTodo = todos.find((t) => t.id === todo.id);
    if (!editedTodo) {
      throw new Error("404");
    }
    editedTodo!.completed = todo.completed;
    editedTodo!.title = todo.title;
    persist();

    setTimeout(() => {
      resolve(editedTodo!);
    }, 100);
  });
};
