import React from "react";
import { Todo as TTodo } from "./types";
import cn from "classnames";
import { useMutation } from "react-query";
import { deleteMutation, updateMutation } from "./mutations";

export function Todo({ todo }: { todo: TTodo }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { id, title, completed } = todo;

  const deleteRecord = useMutation(deleteMutation);
  const update = useMutation(updateMutation);
  const toggleComplete = (todo: TTodo) => {
    update.mutate({ ...todo, completed: !todo.completed });
  };

  const [state, setState] = React.useState<"idle" | "editing">("idle");
  const [editTitle, setEditTitle] = React.useState(title);

  const executeEdit = () => {
    update.mutate(
      { ...todo, title: editTitle },
      {
        onSuccess: () => {
          setState("idle");
        },
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
        completed,
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
          onDoubleClick={() => {
            setState("editing");
          }}
        >
          {title}
        </label>{" "}
        <button
          className="destroy"
          onClick={() => {
            deleteRecord.mutate(todo);
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
