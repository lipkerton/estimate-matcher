import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { SuppliersPage } from "../pages/SuppliersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <SuppliersPage />,
      },
      {
        path: "suppliers",
        element: <SuppliersPage />,
      },
    ],
  },
]);