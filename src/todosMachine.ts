import { Todo } from "./types";
import { MutationObserver, QueryObserver } from "react-query";
import { fetchAll } from "./api/todos";
import {
  createMutation,
  clearCompletedMutation,
  markAllMutation,
} from "./mutations";
import { createMachine, assign } from "xstate";
import queryClient from "./queryClient";

export type Filter = "active" | "completed" | "all";

type Context = {
  readonly todos: Todo[];
  readonly filter: Filter;
};

type Event =
  | {
      type: "CREATE_TODO";
      title: string;
    }
  | {
      type: "CLEAR_COMPLETED";
    }
  | {
      type: "MARK_ALL";
      completed: boolean;
    }
  | {
      type: "SET_CONTEXT";
      context: Partial<Context>;
    };

export const todosMachine = createMachine<Context, Event>({
  id: "todos",
  invoke: [
    {
      id: "query-observer-todos",
      src: () => (sendBack) => {
        const observer = new QueryObserver(queryClient, {
          queryKey: "todos",
          queryFn: fetchAll,
        });

        return observer.subscribe(({ data: todos = [] }) => {
          sendBack({ type: "SET_CONTEXT", context: { todos } });
        });
      },
    },
    {
      id: "hashchange",
      src: () => (sendBack) => {
        function onHashChange() {
          const filter: Filter =
            window.location.hash.slice(2) || ("all" as any);
          sendBack({ type: "SET_CONTEXT", context: { filter } });
        }

        // get initial value
        onHashChange();

        window.addEventListener("hashchange", onHashChange);

        return () => window.removeEventListener("hashchange", onHashChange);
      },
    },
  ],
  context: {
    todos: [],
    filter: "all",
  },
  on: {
    SET_CONTEXT: { actions: assign((_, { context }) => context) },
    CREATE_TODO: {
      actions: (_, event) => {
        if (event.title) {
          new MutationObserver(queryClient, createMutation).mutate(event);
        }
      },
    },
    CLEAR_COMPLETED: {
      actions: () => {
        new MutationObserver(queryClient, clearCompletedMutation).mutate();
      },
    },
    MARK_ALL: {
      actions: (_, event) => {
        new MutationObserver(queryClient, markAllMutation).mutate(event);
      },
    },
  },
  initial: "idle",
  states: {
    idle: {},
  },
});