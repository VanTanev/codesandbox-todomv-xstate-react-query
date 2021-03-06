import React from "react";
import cn from "classnames"
import { Todo } from "./Todo";
import { useMutation, useQuery } from "react-query";
import { fetchAll } from "./api/todos";
import {
  createMutation,
  clearCompletedMutation,
  markAllMutation,
} from "./mutations";

import { Todo as TTodo } from "./types";
import { useHashChange } from "./useHashChange";

type Filter = "active" | "completed" | "all";

function filterTodos(filter: Filter, todos: TTodo[]) {
  if (filter === "active") {
    return todos.filter((todo) => !todo.completed);
  }

  if (filter === "completed") {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

export function Todos() {
  const { data: todos = [] } = useQuery({
    queryKey: "todos",
    queryFn: fetchAll,
  });

  const [filter, setFilter] = React.useState<Filter>("all");
  useHashChange(() => {
    setFilter(window.location.hash.slice(2) || "all" as any);
  });

  const create = useMutation(createMutation);
  const clearCompleted = useMutation(clearCompletedMutation);
  const markAll = useMutation(markAllMutation);

  const numActiveTodos = todos.filter((todo) => !todo.completed).length;
  const allCompleted = todos.length > 0 && numActiveTodos === 0;
  const mark = !allCompleted ? "completed" : "active";
  const filteredTodos = filterTodos(filter, todos);

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
              create.mutate({ title: input.value });
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
            markAll.mutate({ completed: mark === "completed" });
          }}
        />
        <label htmlFor="toggle-all" title={`Mark all as ${mark}`}>
          Mark all as {mark}
        </label>
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
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
          <ul className="filters">
            <li>
              <a
                className={cn({
                  selected: filter === "all"
                })}
                href="#/"
              >
                All
              </a>
            </li>
            <li>
              <a
                className={cn({
                  selected: filter === "active"
                })}
                href="#/active"
              >
                Active
              </a>
            </li>
            <li>
              <a
                className={cn({
                  selected: filter === "completed"
                })}
                href="#/completed"
              >
                Completed
              </a>
            </li>
          </ul>
          {numActiveTodos < todos.length && (
            <button
              onClick={(_) => {
                clearCompleted.mutate();
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
