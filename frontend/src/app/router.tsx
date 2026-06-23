import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { SuppliersPage } from "../pages/SuppliersPage";
import { ProductsPage } from "../pages/ProductsPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ImportFilesPage } from "../pages/ImportFilesPage";
import { PriceListsPage } from "../pages/PriceListsPage";
import { EstimatesPage } from "../pages/EstimatesPage";
import { ImportJobsPage } from "../pages/ImportJobsPage";

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
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "import-files",
        element: <ImportFilesPage />,
      },
      {
        path: "price-lists",
        element: <PriceListsPage />,
      },
      {
        path: "estimates",
        element: <EstimatesPage />,
      },
      {
        path: "import-jobs",
        element: <ImportJobsPage />,
      },
    ],
  },
]);