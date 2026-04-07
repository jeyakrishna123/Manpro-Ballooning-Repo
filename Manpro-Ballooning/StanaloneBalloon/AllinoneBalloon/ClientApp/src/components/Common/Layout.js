// #region Component Imports
import React from 'react';
import  SideBar  from '../Tools/SideBar';
import Content from './Content';
import { NavMenu } from '../Navigation/NavMenu';
import { Overlay } from './Loader';
import useStore from "../Store/store";
import { Route, Routes } from 'react-router-dom';
// #endregion

// #region Component Layout
const Layout = () => {
    const state = useStore();
    const stageRef = React.useRef(null);

    // #region Render HTML
    return (
        <div className="top_wrapper container-fluid p-0">
            <Overlay isLoading={state.isLoading} />
            <NavMenu stageRef={stageRef} />
            <Routes >
                <Route exact path="/" element={<SideBar state={state} stageRef={stageRef} />} />
            </Routes>
            <Content stageRef={stageRef} />
        </div>
    );
    // #endregion
}
export default Layout;
// #endregion