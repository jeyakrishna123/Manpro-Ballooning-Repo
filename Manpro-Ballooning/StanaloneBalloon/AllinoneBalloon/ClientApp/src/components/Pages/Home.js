// #region Component Imports
import React, { Component } from 'react';
import {  Navigate } from 'react-router-dom';
import Canvas from '../Canvas/Canvas';
import { config, seo } from "../Common/Common";
import useStore from "../Store/store";
// #endregion

// #region Component Home
export class Home extends Component {
    static displayName = `${config.APP_TITLE}`;

    // #region constructor
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            win : {
                width: window.innerWidth,
                height: window.innerHeight,
            }
        }
        this.updateWin = this.updateWin.bind(this);
    }
    // #endregion

    // #region Default fn
  
    updateWin() {
        this.setState({ win: { width: window.innerWidth -140, height: window.innerHeight }, loading: false });
      //  useStore.setState({ win: this.state.win });
    }
    componentDidMount = () => {
        let { drawingHeader } = useStore.getState();
 
        seo({
            title: (drawingHeader.length > 0 && drawingHeader[0]?.drawingNo !== '') ? `Drawing - ${drawingHeader[0]?.drawingNo}, Rev - ` + `${drawingHeader[0]?.revision_No}`.toUpperCase() :`${Home.displayName}`,
            metaDescription: config.APP_TITLE
        });
       // useStore.setState({ win: this.state.win });
        this.setState({ loading: false });
        window.addEventListener("resize", this.updateWin)
    }
    componentWillUnmount = () => {
        seo({
            title: `${Home.displayName}`,
            metaDescription: config.APP_TITLE
        });
        window.removeEventListener("resize", this.updateWin)
    }
    // #endregion

    // #region Render Html
    render() {
        const { user } = useStore.getState();
        let contents = this.state.loading
            ? <p><em>Loading....</em></p>
            : "";
        return (
            <>
                <div className="ballooning">
                    {contents}
                    <>
                        {user.length === 0 && (
                            <Navigate to="/login" replace={true} />
                        )}
                    </>
                    <Canvas stageRef={this.props.stageRef }></Canvas>
                </div>
            </>
        );
    }
    // #endregion
}
// #endregion