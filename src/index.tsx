import { render } from "react-dom";
import "todomvc-app-css/index.css";
import { inspect } from "@xstate/inspect";

import App from "./App";
inspect({ iframe: false });

const rootElement = document.getElementById("root");
render(<App />, rootElement);
