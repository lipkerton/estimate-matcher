import { NavLink, Outlet } from "react-router-dom";

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="logo">Estimate Matcher</h1>

        <nav className="nav">
          <NavLink to="/suppliers">Поставщики</NavLink>
        </nav>
        <nav className="nav">
          <NavLink to="/suppliers">Поставщики</NavLink>
          <NavLink to="/products">Каталог товаров</NavLink>
          <NavLink to="/projects">Проекты</NavLink>
          <NavLink to="/import-files">Файлы импорта</NavLink>
        </nav>

      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}