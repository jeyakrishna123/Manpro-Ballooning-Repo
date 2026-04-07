import React, { Component } from "react";
import ReactLoading from "react-loading";
import useStore from "../Store/store";


export class Overlay extends Component {


    render() {
        let state = useStore.getState();
        return (
            <>
                <div className="overlaywrapper" style={{ display: (state.isLoading ? "block" : "none") }} >
                    <Loader />
                </div>
            </>
        );
    }
}

 class Loader extends Component {

    static displayName = Loader.name;

    componentDidMount() {
        useStore.setState({ isLoading: false })
    }

     render() {
         let state = useStore.getState();
        return (
            <>
                    <div className="overlaytext">
                        <ReactLoading
                        type={"spinningBubbles"}
                        color={"#124072"} //{"#c00"}
                        delay={5}
                        className={"loaderPOS" }
                        />
                    <div style={{ fontSize: state.loadingTextSize }}>
                        {state.loadingText}
                    </div>
                    </div>

            </>
        );
    }
}
