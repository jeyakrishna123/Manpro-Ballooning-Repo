import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { config, seo, showAlert } from '../Common/Common';
import useStore from "./../Store/store";
import Container from 'react-bootstrap/Container';

export default class ManageList extends Component {
    static displayName = "List of Pre-Data Management";

    constructor(props) {
        super(props);
    }
    componentDidMount() {
        seo({
            title: `${ManageList.displayName}`,
            metaDescription: config.APP_TITLE
        });

    }

 

    render() {
 
        let state = useStore.getState();
        //console.log(state)
        const user = state.user;
       
        return (<div className="content-fluid p-0">
            <>
                {user.length === 0 && (
                    <Navigate to="/login" replace={true} />
                )}
            </>
            <div className="container-sm pt-5">
                <div className="admin-page-header">
                    <button className="admin-back-btn" onClick={() => window.history.back()}>
                        <i className="bi bi-arrow-left"></i> Back to Home
                    </button>
                    <h4 className="admin-page-title">
                        <i className="bi bi-list-ul me-2"></i>List of Pre-Data Management
                    </h4>
                </div>
                <Container key={"ProjectViewPage"} className="container-sm"  >
                    <h1>ManageList</h1>
                </Container>

            </div>
        </div>
        );
    }
}
