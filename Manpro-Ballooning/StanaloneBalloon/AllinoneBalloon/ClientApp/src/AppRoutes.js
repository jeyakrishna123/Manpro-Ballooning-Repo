import { Counter } from "./components/Pages/Counter";
import { FetchData } from "./components/Pages/FetchData";
import { Home } from "./components/Pages/Home";
import Login from "./components/Login/Login";
import CreateUser from "./components/User/Create";
import SignupPage from "./components/SignUp/SignupPage";
import ProjectCatalog from "./components/Projects/ProjectCatalog";
import ManageList from "./components/Pages/ManageList";

const AppRoutes = [
  {
    index: true,
        auth: true,
    element: <Home />
    },
    {
      path: '/counter',
      auth: true,
    element: <Counter />
    },
    {
        path: '/signup',
        auth: false,
        element: <SignupPage />
    },
    {
        path: '/login',
        auth: false,
        element: <Login />
    },
  {
      path: '/fetch-data',
      auth: true,
    element: <FetchData />
    },
    {
        path: '/user-list',
        auth: true,
        element: <CreateUser />
    },
    {
        path: '/drawings',
        auth: true,
        element: <ProjectCatalog />
    },
    {
        path: '/lovs',
        auth: true,
        element: <ManageList />
    },
];

export default AppRoutes;
