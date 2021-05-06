import React from "react";
import { Todo } from "./Todo";
import { useMutation, useQuery } from "react-query";
import { clearCompleted, create, fetchAll, markAll } from "./api/todos";
import queryClient from "./queryClient";
import {v4 as uuid} from "uuid";
import { Todo as TTodo } from "./types";

const useMarkAllMutation = () => {
  return useMutation<
    TTodo[],
    unknown,
    { completed: boolean },
    { previousTodos: TTodo[] | undefined }
  >({
    mutationFn: markAll,
    onMutate: async ({ completed }) => {
      await queryClient.cancelQueries("todos");
      const previousTodos = queryClient.getQueryData<TTodo[]>("todos");
      queryClient.setQueryData<TTodo[]>("todos", (todos = []) =>
        todos.map((todo) => ({ ...todo, completed }))
      );
      return { previousTodos };
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData("todos", context.previousTodos);
      }
    },
    onSuccess: (todos) => {
      queryClient.setQueryData("todos", todos);
    }
  });
};
const useCreateMutation = () => {
  return useMutation<
    TTodo,
    unknown,
    { title: string; completed?: boolean },
    { optimisticTodo: TTodo }
  >(create, {
    onMutate: async (todo) => {
      await queryClient.cancelQueries("todos");
      const optimisticTodo: TTodo = {
        id: uuid(),
        title: todo.title,
        completed: todo.completed ?? false
      };
      queryClient.setQueryData<TTodo[]>("todos", (todos = []) => [
        ...todos,
        optimisticTodo
      ]);
      console.log("onMutate", {
        todos: queryClient.getQueryData("todos")
      });
      return { optimisticTodo };
    },
    onSuccess: (newTodo, _, ctx) => {
      queryClient.setQueryData<TTodo[]>("todos", (todos = []) => {
        console.log("success", {
          newTodo,
          todos: queryClient.getQueryData("todos")
        });

        return todos.map((todo) =>
          todo.id === ctx?.optimisticTodo.id ? newTodo : todo
        );
      });
    },
    onError: (error, _, context) => {
      console.log("error", { error, context });
      queryClient.setQueryData<TTodo[]>("todos", (todos = []) =>
        todos.filter((todo) => todo.id !== context?.optimisticTodo?.id)
      );
    }
  });
};

const useClearCompletedMutation = () => {
  return useMutation<
    TTodo[],
    unknown,
    void,
    { previousTodos: TTodo[] | undefined }
  >(clearCompleted, {
    onMutate: async () => {
      await queryClient.cancelQueries("todos");
      const previousTodos = queryClient.getQueryData<TTodo[]>("todos");
      queryClient.setQueryData<TTodo[]>("todos", (todos = []) =>
        todos.filter((todo) => !todo.completed)
      );
      return { previousTodos };
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData("todos", context.previousTodos);
      }
    },
    onSuccess: (todos) => {
      queryClient.setQueryData("todos", todos);
    }
  });
};

export function Todos() {
  const { data: todos = [] } = useQuery({
    queryKey: "todos",
    queryFn: fetchAll
  });

  const createMutation = useCreateMutation();
  const clearCompletedMutation = useClearCompletedMutation();
  const markAllMutation = useMarkAllMutation();

  const numActiveTodos = todos.filter((todo) => !todo.completed).length;
  const allCompleted = todos.length > 0 && numActiveTodos === 0;
  const mark = !allCompleted ? "completed" : "active";

  return (
    <section className="todoapp">
      <header className="header">
        <h1>todos</h1>
        <input
          className="new-todo"
          placeholder="What needs to be done?"
          autoFocus
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              let input = e.target as HTMLInputElement;
              createMutation.mutate({ title: input.value });
              input.value = "";
            }
          }}
        />
      </header>
      <section className="main">
        <input
          id="toggle-all"
          className="toggle-all"
          type="checkbox"
          checked={allCompleted}
          onChange={() => {
            markAllMutation.mutate({ completed: mark === "completed" });
          }}
        />
        <label htmlFor="toggle-all" title={`Mark all as ${mark}`}>
          Mark all as {mark}
        </label>
        <ul className="todo-list">
          {todos.map((todo) => (
            <Todo key={todo.id} todo={todo} />
          ))}
        </ul>
      </section>
      {!!todos.length && (
        <footer className="footer">
          <span className="todo-count">
            <strong>{numActiveTodos}</strong> item
            {numActiveTodos === 1 ? "" : "s"} left
          </span>
          {numActiveTodos < todos.length && (
            <button
              onClick={(_) => {
                clearCompletedMutation.mutate();
              }}
              className="clear-completed"
            >
              Clear completed
            </button>
          )}
        </footer>
      )}
    </section>
  );
}
