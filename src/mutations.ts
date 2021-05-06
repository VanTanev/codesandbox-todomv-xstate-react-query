import { UseMutationOptions } from "react-query";
import { Todo } from "./types";
import queryClient from "./queryClient";
import { v4 as uuid } from "uuid";

import {
  clearCompleted,
  create,
  markAll,
  deleteRecord,
  update,
} from "./api/todos";

export const markAllMutation: UseMutationOptions<
  Todo[],
  unknown,
  { completed: boolean },
  { previousTodos: Todo[] | undefined }
> = {
  mutationFn: markAll,
  onMutate: async ({ completed }) => {
    await queryClient.cancelQueries("todos");
    const previousTodos = queryClient.getQueryData<Todo[]>("todos");
    queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
      todos.map((todo) => ({ ...todo, completed }))
    );
    return { previousTodos };
  },
  onError: (_error, _variables, context) => {
    if (context) {
      queryClient.setQueryData("todos", context.previousTodos);
    }
  },
  onSuccess: (todos) => {
    queryClient.setQueryData("todos", todos);
  },
};

export const createMutation: UseMutationOptions<
  Todo,
  unknown,
  { title: string; completed?: boolean },
  { optimisticTodo: Todo }
> = {
  mutationFn: create,
  onMutate: async (todo) => {
    await queryClient.cancelQueries("todos");
    const optimisticTodo: Todo = {
      id: uuid(),
      title: todo.title,
      completed: todo.completed ?? false,
    };
    queryClient.setQueryData<Todo[]>("todos", (todos = []) => [
      ...todos,
      optimisticTodo,
    ]);
    console.log("onMutate", {
      todos: queryClient.getQueryData("todos"),
    });
    return { optimisticTodo };
  },
  onSuccess: (newTodo, _, ctx) => {
    queryClient.setQueryData<Todo[]>("todos", (todos = []) => {
      console.log("success", {
        newTodo,
        todos: queryClient.getQueryData("todos"),
      });

      return todos.map((todo) =>
        todo.id === ctx?.optimisticTodo.id ? newTodo : todo
      );
    });
  },
  onError: (error, _, context) => {
    console.log("error", { error, context });
    queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
      todos.filter((todo) => todo.id !== context?.optimisticTodo?.id)
    );
  },
};

export const clearCompletedMutation: UseMutationOptions<
  Todo[],
  unknown,
  void,
  { previousTodos: Todo[] | undefined }
> = {
  mutationFn: clearCompleted,
  onMutate: async () => {
    await queryClient.cancelQueries("todos");
    const previousTodos = queryClient.getQueryData<Todo[]>("todos");
    queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
      todos.filter((todo) => !todo.completed)
    );
    return { previousTodos };
  },
  onError: (_error, _variables, context) => {
    if (context) {
      queryClient.setQueryData("todos", context.previousTodos);
    }
  },
  onSuccess: (todos) => {
    queryClient.setQueryData("todos", todos);
  },
};

export const deleteMutation: UseMutationOptions<
  Todo,
  unknown,
  Todo,
  { previousTodos: Todo[] | undefined }
> = {
  mutationFn: deleteRecord,
  onMutate: async (todo) => {
    await queryClient.cancelQueries("todos");
    const previousTodos = queryClient.getQueryData<Todo[]>("todos");
    queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
      todos.map((t) => (t.id === todo.id ? { ...t, ...todo } : t))
    );
    return { previousTodos };
  },
  onError: (_error, _variables, context) => {
    if (context) {
      queryClient.setQueryData("todos", context.previousTodos);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries("todos");
  },
};

export const updateMutation: UseMutationOptions<
  Todo,
  unknown,
  Todo,
  { previousTodos: Todo[] | undefined }
> = {
  mutationFn: update,
  onMutate: async (todo) => {
    await queryClient.cancelQueries("todos");
    const previousTodos = queryClient.getQueryData<Todo[]>("todos");
    queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
      todos.map((t) => (t.id === todo.id ? { ...t, ...todo } : t))
    );
    return { previousTodos };
  },
  onError: (_error, _variables, context) => {
    if (context) {
      queryClient.setQueryData("todos", context.previousTodos);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries("todos");
  },
};
