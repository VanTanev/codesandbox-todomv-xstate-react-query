import React from "react";
import { Todo as TTodo } from "./types";
import cn from "classnames";
import { useMutation } from "react-query";
import { update, deleteRecord } from "./api/todos";
import queryClient from "./queryClient";

const useDeleteMutation = () => {
  return useMutation<
    TTodo,
    unknown,
    TTodo,
    { previousTodos: TTodo[] | undefined }
  >(deleteRecord, {
    onMutate: async (todo) => {
      await queryClient.cancelQueries("todos");
      const previousTodos = queryClient.getQueryData<TTodo[]>("todos");
      queryClient.setQueryData<TTodo[]>("todos", (todos = []) =>
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
};

const useUpdateMutation = () => {
  return useMutation<
    TTodo,
    unknown,
    TTodo,
    { previousTodos: TTodo[] | undefined }
  >({
    mutationFn: update,
    onMutate: async (todo) => {
      await queryClient.cancelQueries("todos");
      const previousTodos = queryClient.getQueryData<TTodo[]>("todos");
      queryClient.setQueryData<TTodo[]>("todos", (todos = []) =>
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
};

export function Todo({ todo }: { todo: TTodo }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { id, title, completed } = todo;

  const deleteMutation = useDeleteMutation();
  const updateMutation = useUpdateMutation();
  const toggleComplete = (todo: TTodo) => {
    updateMutation.mutate({ ...todo, completed: !todo.completed });
  };

  const [state, setState] = React.useState<"idle" | "editing">("idle");
  const [editTitle, setEditTitle] = React.useState(title);

  const executeEdit = () => {
    updateMutation.mutate(
      { ...todo, title: editTitle },
      {
        onSuccess: () => {
          setState("idle");
        }
      }
    );
  };

  React.useEffect(() => {
    if (state === "editing") inputRef.current?.select();
  }, [state]);

  return (
    <li
      className={cn({
        editing: state === "editing",
        completed
      })}
      data-todo-state={completed ? "completed" : "active"}
      key={id}
    >
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          onChange={(_) => {
            toggleComplete(todo);
          }}
          checked={completed}
        />
        <label
          onDoubleClick={(e) => {
            setState("editing");
          }}
        >
          {title}
        </label>{" "}
        <button
          className="destroy"
          onClick={() => {
            deleteMutation.mutate(todo);
          }}
        />
      </div>
      <input
        className="edit"
        value={editTitle}
        onBlur={(_) => {
          executeEdit();
        }}
        onChange={(e) => {
          setEditTitle(e.target.value);
        }}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            executeEdit();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setEditTitle(title);
            setState("idle");
          }
        }}
        ref={inputRef}
      />
    </li>
  );
}
