import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/popover.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import Login from './components/Login/Login';
import SignupPage from "./components/SignUp/SignupPage";
import useStore from "./components/Store/store";
import { useAuth } from "./components/auth/AuthContext"
import { config } from "./components/Common/Common";
//import { Home } from './components/Pages/Home';
//import { Counter } from './components/Pages/Counter';
//import { FetchData } from "./components/Pages/FetchData";
//import CreateUser from "./components/User/Create";


const setFavicon = () => {

    let faviconPath;

    if (!config.Demo) {
        faviconPath = '/favicon.ico';
    } else {
        faviconPath = `/${config.Fav}`;
    }
    // console.log(faviconPath)
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconPath;
    document.head.appendChild(link);
};
const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
 
const PrivateRoute = ({ children }) => {
    const auth = useAuth(); // Instead of destructuring directly, first log the whole object
   // console.log(auth); // Check if auth is undefined or missing properties
    let state = useStore.getState();
    const user = state.user;
    const isAuth = user.length > 0 ? true : false;
   // console.log(isAuth);
    // Redirect to login if the user is not authenticated
    return isAuth ? children : <Navigate to="/login" />;
};

root.render(
    <BrowserRouter basename={baseUrl} >
        <Routes>
            <Route path="/login" element={<Login></Login>} />;
            {config.Demo && (<>< Route path="/signup" element={<SignupPage></SignupPage>} /></>)}
            <Route path="/*" element={<PrivateRoute><App></App></PrivateRoute>} />;
        </Routes>
  </BrowserRouter>);
setFavicon();
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
