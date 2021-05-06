import { Todo } from "./types";
import { MutationObserver, QueryObserver } from "react-query";
import { deleteMutation, updateMutation } from "./mutations";
import { createMachine, assign } from "xstate";
import queryClient from "./queryClient";
import { fetchAll } from "./api/todos";

type Context = {
  readonly todo: Todo;
  editTitle: string;
};
type Event =
  | {
      type: "INPUT";
      value: string;
    }
  | {
      type: "SET_TODO";
      todo: Todo;
    }
  | {
      type: "TOGGLE_COMPLETE";
    }
  | {
      type: "EDIT";
    }
  | {
      type: "CANCEL";
    }
  | {
      type: "COMMIT";
    }
  | {
      type: "DELETE";
    };

export const todoMachine = createMachine<Context, Event>(
  {
    invoke: {
      id: "query-observer-todos",
      src: (ctx) => (sendBack) => {
        const observer = new QueryObserver(queryClient, {
          queryKey: "todos",
          queryFn: fetchAll,
        });

        return observer.subscribe(({ data: todos = [] }) => {
          const todo = todos.find((todo) => todo.id === ctx.todo.id);
          if (todo) {
            sendBack({ type: "SET_TODO", todo });
          }
        });
      },
    },
    context: {
      todo: null!,
      editTitle: "",
    },
    on: {
      SET_TODO: { actions: assign((_, { todo }) => ({ todo })) },
      TOGGLE_COMPLETE: {
        actions: (ctx) =>
          new MutationObserver(queryClient, updateMutation).mutate({
            ...ctx.todo,
            completed: !ctx.todo.completed,
          }),
      },
    },
    initial: "reading",
    states: {
      reading: {
        entry: assign((ctx) => ({ editTitle: ctx.todo.title })),
        on: {
          EDIT: {
            target: "editing",
            actions: "focusInput",
          },
          DELETE: {
            actions: (ctx) =>
              new MutationObserver(queryClient, deleteMutation).mutate(
                ctx.todo
              ),
          },
        },
      },
      editing: {
        on: {
          INPUT: { actions: assign((_, { value }) => ({ editTitle: value })) },
          CANCEL: { target: "reading" },
          COMMIT: { target: "saving" },
        },
      },
      saving: {
        invoke: {
            id: 'update-mutation',
          src: (ctx) =>
            new MutationObserver(queryClient, updateMutation).mutate({
              ...ctx.todo,
              title: ctx.editTitle,
            }),
          onDone: { target: "reading" },
          onError: { target: "editing" },
        },
      },
    },
  },
  { actions: { focusInput: () => {} } }
);