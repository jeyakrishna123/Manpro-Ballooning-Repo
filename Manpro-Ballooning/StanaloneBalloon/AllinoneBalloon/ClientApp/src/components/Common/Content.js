// #region Component Imports
import React from "react";
import { Route, Routes, useLocation } from 'react-router-dom';
import AppRoutes from '../../AppRoutes';
import classNames from "classnames";
import { Home } from "../Pages/Home";
//import Layout from '../Common/Layout';
import { config } from "../Common/Common";
import Login from '../Login/Login';
import SignupPage from "../SignUp/SignupPage";
import useStore from "./../Store/store";
// #endregion

// #region Component Content
const Content = ({ sidebarIsOpen, stageRef }) => {
    const location = useLocation();
    //console.log(location.pathname);
    let classNamess = location.pathname === "/" ? "content bkk" : ""
    // #region Render HTML
    return (

        <div className={classNames(classNamess, { "is-open": sidebarIsOpen })}  >
            <Routes>
                <Route path="/login" element={<Login></Login>} />;
                {config.Demo && (<>< Route path="/signup" element={<SignupPage></SignupPage>} /></>)}
                {AppRoutes.map((route, index) => {
                    const { element, ...rest } = route;
                    if (route.path === location.pathname && route.auth === true ) 
                        return <Route key={index} {...rest} element={element} />;
                    
                    if (route.index && location.pathname === "/") 
                        return <Route key={index} {...rest} exact path="/" element={<Home stageRef={stageRef}  />} />
                    
                   
                })}
            </Routes>
        </div>
    );
    // #endregion
}
export default Content;
// #endregion