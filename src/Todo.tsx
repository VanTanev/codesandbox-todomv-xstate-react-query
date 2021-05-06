import React from "react";
import { Todo as TTodo } from "./types";
import cn from "classnames";
import { asEffect, useMachine } from "@xstate/react";
import { todoMachine } from "./todoMachine";

export function Todo({ todo }: { todo: TTodo }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [state, send] = useMachine(todoMachine, {
    id: `todo(${todo.title})`,
    context: {
      todo,
    },
    actions: {
      focusInput: asEffect(() => {
        inputRef.current?.select();
      }),
    },
    devTools: true,
  });
  const { id, title, completed } = todo;

  return (
    <li
      className={cn({
        editing: state.matches("editing"),
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
            send({ type: "TOGGLE_COMPLETE" });
          }}
          checked={completed}
        />
        <label
          onDoubleClick={() => {
            send({ type: "EDIT" });
          }}
        >
          {title}
        </label>{" "}
        <button
          className="destroy"
          onClick={() => {
            send({ type: "DELETE" });
          }}
        />
      </div>
      <input
        className="edit"
        value={state.context.editTitle}
        onBlur={(_) => {
          send({ type: "COMMIT" });
        }}
        onChange={(e) => {
          send({ type: "INPUT", value: e.target.value });
        }}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            send({ type: "COMMIT" });
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            send({ type: "CANCEL" });
          }
        }}
        ref={inputRef}
      />
    </li>
  );
}
