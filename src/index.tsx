import { render } from "react-dom";
import "todomvc-app-css/index.css";

import App from "./App";

const rootElement = document.getElementById("root");
render(<App />, rootElement);
