import { MutationObserver, QueryObserver } from "react-query";
import * as todosApi from "./api/todos";
import { Todo } from "./types";
import { isEvent } from "xstate-helpers";
import { v4 as uuid } from "uuid";
import { assign, createMachine, forwardTo } from "xstate";

import queryClient from "./queryClient";
import { pure, send } from "xstate/lib/actions";

type Context = {
  todos: Todo[];
  editingTodo: Todo | null;
};
type Event =
  | {
      type: "SET_TODOS";
      todos: Todo[];
    }
  | {
      type: "CREATE_TODO";
      todo: { title: string; completed?: boolean };
    }
  | {
      type: "UPDATE_TODO";
      todo: Todo;
    }
  | {
      type: "CLEAR_COMPLETED";
      todo: Todo;
    }
  | {
      type: "TODO.DELETE";
      todo: Todo;
    }
  | {
      type: "TODO.TOGGLE_COMPLETE";
      todo: Todo;
    }
  | {
      type: "MARK_ALL";
      completed: boolean;
    };

export const todosMachine = createMachine<Context, Event>(
  {
    context: {
      todos: [],
      editingTodo: null
    },
    invoke: [
      {
        id: "todos-list-observer",
        src: () => (sendBack) => {
          console.log("setup query observer");
          let obs = new QueryObserver<Todo[]>(queryClient, {
            queryKey: ["todos"],
            queryFn: () => todosApi.fetchAll()
          });

          let unsubscribe = obs.subscribe((result) => {
            console.log("query-observer", result);
            if (result.data) {
              sendBack({ type: "SET_TODOS", todos: result.data });
            }
          });

          return unsubscribe;
        }
      },
      {
        id: "todos-creator",
        src: () => (sendBack, onReceive) => {
          let obs = new MutationObserver<
            Todo,
            unknown,
            { title: string; completed?: boolean },
            { optimisticTodo: Todo }
          >(queryClient, {
            mutationFn: todosApi.create,
            onMutate: async (todo) => {
              await queryClient.cancelQueries("todos");
              const optimisticTodo: Todo = {
                id: uuid(),
                title: todo.title,
                completed: todo.completed ?? false
              };
              queryClient.setQueryData<Todo[]>("todos", (todos = []) => [
                ...todos,
                optimisticTodo
              ]);
              console.log("onMutate", {
                todos: queryClient.getQueryData("todos")
              });
              return { optimisticTodo };
            },
            onSuccess: (newTodo, _, { optimisticTodo }) => {
              queryClient.setQueryData<Todo[]>("todos", (todos = []) => {
                console.log("success", {
                  newTodo,
                  optimisticTodo,
                  todos: queryClient.getQueryData("todos")
                });

                return todos.map((todo) =>
                  todo.id === optimisticTodo.id ? newTodo : todo
                );
              });
            },
            onError: (error, _, context) => {
              console.log("error", { error, context });
              queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
                todos.filter((todo) => todo.id !== context?.optimisticTodo?.id)
              );
            }
          });

          onReceive((event) => {
            if (isEvent(event, "CREATE_TODO")) {
              obs.mutate(event.todo);
            }
          });
        }
      },
      {
        id: "todos-updater",
        src: () => (sendBack, onReceive) => {
          let obs = new MutationObserver<
            Todo,
            unknown,
            Todo,
            { previousTodos: Todo[] | undefined }
          >(queryClient, {
            mutationFn: todosApi.update,
            onMutate: async (todo) => {
              await queryClient.cancelQueries("todos");
              const previousTodos = queryClient.getQueryData<Todo[]>("todos");
              queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
                todos.map((t) => (t.id === todo.id ? { ...t, ...todo } : t))
              );
              return { previousTodos };
            },
            onError: (error, variables, context) => {
              if (context) {
                queryClient.setQueryData("todos", context.previousTodos);
              }
            },
            onSettled: () => {
              queryClient.invalidateQueries("todos");
            }
          });

          onReceive((event) => {
            if (isEvent(event, "UPDATE_TODO")) {
              obs.mutate(event.todo);
            }
          });
        }
      },
      {
        id: "todos-deleter",
        src: () => (sendBack, onReceive) => {
          let obs = new MutationObserver<
            Todo,
            unknown,
            Todo,
            { previousTodos: Todo[] | undefined }
          >(queryClient, {
            mutationFn: todosApi.deleteRecord,
            onMutate: async (todo) => {
              await queryClient.cancelQueries("todos");
              const previousTodos = queryClient.getQueryData<Todo[]>("todos");
              queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
                todos.filter((t) => t.id !== todo.id)
              );
              return { previousTodos };
            },
            onError: (error, variables, context) => {
              if (context) {
                queryClient.setQueryData("todos", context.previousTodos);
              }
            },
            onSettled: () => {
              queryClient.invalidateQueries("todos");
            }
          });

          onReceive((event) => {
            if (isEvent(event, "TODO.DELETE")) {
              obs.mutate(event.todo);
            }
          });
        }
      },
      {
        id: "todos-clearer",
        src: () => (_, onReceive) => {
          let obs = new MutationObserver<
            Todo[],
            unknown,
            void,
            { previousTodos: Todo[] | undefined }
          >(queryClient, {
            mutationFn: todosApi.clearCompleted,
            onMutate: async () => {
              await queryClient.cancelQueries("todos");
              const previousTodos = queryClient.getQueryData<Todo[]>("todos");
              queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
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

          onReceive((event) => {
            if (isEvent(event, "CLEAR_COMPLETED")) {
              obs.mutate();
            }
          });
        }
      },
      {
        id: "todos-mark-all",
        src: () => (_, onReceive) => {
          let obs = new MutationObserver<
            Todo[],
            unknown,
            { completed: boolean },
            { previousTodos: Todo[] | undefined }
          >(queryClient, {
            mutationFn: todosApi.markAll,
            onMutate: async ({ completed }) => {
              await queryClient.cancelQueries("todos");
              const previousTodos = queryClient.getQueryData<Todo[]>("todos");
              queryClient.setQueryData<Todo[]>("todos", (todos = []) =>
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

          onReceive((event) => {
            if (isEvent(event, "MARK_ALL")) {
              obs.mutate(event);
            }
          });
        }
      }
    ],
    on: {
      SET_TODOS: { actions: "setTodos" },
      CREATE_TODO: { actions: forwardTo("todos-creator") },
      UPDATE_TODO: { actions: forwardTo("todos-updater") },
      MARK_ALL: { actions: forwardTo("todos-mark-all") },
      CLEAR_COMPLETED: { actions: forwardTo("todos-clearer") },
      "TODO.DELETE": { actions: forwardTo("todos-deleter") },
      "TODO.TOGGLE_COMPLETE": {
        actions: pure((_, { todo }) =>
          send(
            {
              type: "UPDATE_TODO",
              todo: { ...todo, completed: !todo.completed }
            },
            { to: "todos-updater" }
          )
        )
      }
    },
    initial: "loading",
    states: {
      loading: {
        on: {
          SET_TODOS: {
            target: "ready",
            actions: "setTodos"
          }
        }
      },
      ready: {}
    }
  },
  {
    actions: {
      setTodos: assign((_, e) => {
        if (!isEvent(e, "SET_TODOS")) return {};
        return { todos: e.todos };
      })
    }
  }
);
