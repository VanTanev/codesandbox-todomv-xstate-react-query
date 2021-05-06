import "./styles.css";
import { QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import queryClient from "./queryClient";
import { Todos } from "./Todos";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
