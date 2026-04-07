// #region Component Imports
import React, { Component } from 'react';
import Layout from './components/Common/Layout';
import Login from './components/Login/Login';
import './components/Common/custom.css';
import "font-awesome/css/font-awesome.css";
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import useStore from "./components/Store/store";
import { Navigate, Route, Routes } from 'react-router-dom';
import { config, seo } from "./components/Common/Common";

// import * as signalR from "@microsoft/signalr";
// #endregion

// #region Component APP
export default class App extends Component {
    static displayName = `${config.APP_TITLE}`;

    // #region constructor
    constructor(props) {
        super(props);

        this.state = {
            token: '',
            message: '',
            messages: [],
            hubConnection: null,
        };
    }
    // #endregion

    // #region Default fn
    onUnload = e => { // the method that will be used for both add and remove event
        e.preventDefault();
       // const data = JSON.stringify(useStore.getState().data);
       // console.log(data)
      // alert(0)
    }
    componentDidMount = () => {
        seo({
            title: `${App.displayName}`,
            metaDescription: config.APP_TITLE
        });
        window.addEventListener("beforeunload", this.onUnload);

        // #region hubConnection
        /*
        let state = useStore.getState();
        const user = state.user;
        if (user.length > 0) {
            let BASE_URL = process.env.REACT_APP_SERVER;
            let url = BASE_URL + "/socket";
            let currentUser = state.user[0];
            // let token = "Bearer " + currentUser.jwtToken;
           // console.log(url, token)
            const hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(url, {
                    transport: 'serverSentEvents' | 'longPolling',
                    accessTokenFactory: () => currentUser.jwtToken, // Replace with your token logic
                })
                .configureLogging(signalR.LogLevel.Information)
                .withAutomaticReconnect()
                .build();
            hubConnection.start({ transport: ['serverSentEvents', 'longPolling'] })
                .then(() => {
                    console.log("Connected to SignalR");
                    hubConnection.on("TokenOpened", (token) => {
                        console.log(`Token opened: ${token}`);
                    });
                })
                .catch(err => {
                    console.error("Error while connecting to SignalR:", err);
                });
            useStore.setState({ hubConnection: hubConnection  })
            
        }
        */
        // #endregion
        
    }
    componentWillUnmount = () => {
        seo({
            title: `${App.displayName}`,
            metaDescription: config.APP_TITLE
        });
        
        window.removeEventListener("beforeunload", this.onUnload);
    }
    // #endregion

    // #region Render HTML
    render() {
        let state = useStore.getState();
        const user = state.user;
        return (
            <>
                {user.length > 0 ? <Layout drawingDetails={null} ></Layout> : (<Navigate to="/login" />) }
                {user.length === 0 && (
                    <>
                        <Routes >
                            <Route exact path="/login" element={<Login />} />
                        </Routes>
                    </>
                 )}
            </>
        );
    }
    // #endregion
}
// #endregion
