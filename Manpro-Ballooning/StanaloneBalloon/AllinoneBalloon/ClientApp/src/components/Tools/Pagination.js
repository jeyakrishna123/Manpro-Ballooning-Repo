import React, { Component } from 'react';
import useStore from "../Store/store";
import { Nav, NavItem, Button } from 'reactstrap';
import Image from '../Common/Image';
import classNames from "classnames";
import { ReactComponent as ArrowLineRight } from "../../assets/arrow-line-right.svg";
import { ReactComponent as ArrowLineLeft } from "../../assets/arrow-line-left.svg";
export class Pagination extends Component {
    static displayName = Pagination.name;
    constructor(props) {
        super(props);
        this.state = {
            isHoveringNext: false,
            isDisabledNext: false,
            isHoveringPrev: false,
            isDisabledPrev: false,
            deviceType: this.getDeviceType(),

        }
        this.handleItemView = this.handleItemView.bind(this);

        this.handleMouseOverNext = this.handleMouseOverNext.bind(this);
        this.handleMouseOutNext = this.handleMouseOutNext.bind(this);

        this.handleMouseOverPrev = this.handleMouseOverPrev.bind(this);
        this.handleMouseOutPrev = this.handleMouseOutPrev.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return "mobile";
        if (width >= 768 && width <= 1024) return "tablet";
        return "desktop";
    }
    handleResize() {
        const newDeviceType = this.getDeviceType();
        if (newDeviceType !== this.state.deviceType) {
            this.setState({ deviceType: newDeviceType });
        }
    }
    handleMouseOverNext() { this.setState({ isHoveringNext: true }); }
    handleMouseOutNext() { this.setState({ isHoveringNext: false }); }

    handleMouseOverPrev() { this.setState({ isHoveringPrev: true }); }
    handleMouseOutPrev() { this.setState({ isHoveringPrev: false }); }

    handleItemView = (e) => {
        e.preventDefault();
          let state = useStore.getState();
          let index = e.target.value;
        // useStore.setState({ ItemView: index, sidebarIsOpen: !state.sidebarIsOpen })
        useStore.setState({
            scrollPosition: 0
        });
        useStore.setState({ ItemView: index, sidebarIsOpen: false })
        if (state.ItemView !== index) {
            useStore.setState({ isLoading: true, loadingText: "Loading Image..." })
        }
    };

    componentDidMount() {
        let state = useStore.getState();
        let dLength = state.drawingDetails.length;
        let view = parseInt(state.ItemView) + 1;

        this.setState({ isDisabledPrev: true })
        if (dLength > 1) {
            if (view === 1) {
                this.setState({ isDisabledPrev: true })
            } else {
                this.setState({ isDisabledPrev: false })
            }
            this.setState({ isDisabledNext: false })
            if (dLength === view) {
                this.setState({ isDisabledNext: true })
            } 
        } else {
            this.setState({ isDisabledNext: true })
        }
        window.addEventListener("resize", this.handleResize);
    };
    componentWillUnmount() {
        // Remove the event listener to prevent memory leaks
        window.removeEventListener("resize", this.handleResize);
    }
    componentDidUpdate(oldProps) {
        if (oldProps.ItemView !== this.props.ItemView) {
            let state = useStore.getState();
            let dLength = state.drawingDetails.length;
            let view = parseInt(state.ItemView) + 1;
            //console.log(dLength, view)
            if (dLength > 1 && view > 1) {
                this.setState({ isDisabledPrev: false })
            }
            if (view === 1) {
                this.setState({ isDisabledPrev: true })
            }

            if (dLength === view) {
                this.setState({ isDisabledNext: true })
            } 
            if (dLength > 1 && view !== dLength) {
                this.setState({ isDisabledNext: false })
            }
        }
    };

    prevDraw = (e) => {
        e.preventDefault();
        let state = useStore.getState();
        let view = parseInt(state.ItemView) - 1;
        if (view >= 0) {
            this.setState({ isHoveringPrev: false });
          //  console.log("sss")
            useStore.setState({ selectedRegion: "", selectedRowIndex:null, ItemView: view, isLoading: true, loadingText: "Loading Image..." })
        }
    }

    nextDraw = (e) => {
        e.preventDefault();
        let state = useStore.getState();
       // console.log("sss")
        let view = parseInt(state.ItemView) + 1;
        let dLength = state.drawingDetails.length;
        if (dLength > view) {
            this.setState({ isHoveringNext: false });
            useStore.setState({ selectedRegion: "", selectedRowIndex: null, ItemView: view, isLoading: true, loadingText: "Loading Image..." })
        }
    }

    render() {
        let state = useStore.getState();
        let drawingDetails = state.drawingDetails;
        const { deviceType } = this.state;
       // console.log(state, initialState)
        return (
            <>
                {state.ItemView !== null && (
                    <div className="container-fluid p-0">
                        <Nav style={{ margin: "0px  0px 0  0" }}>
                            <NavItem style={{ margin: "2px  10px 0  0" }}>
                                <Button
                                    color="light"
                                    className={classNames("light-btn buttons primary", { "primary_hover": !this.state.isDisabledPrev })}
                                    onClick={this.prevDraw}
                                    disabled={this.state.isDisabledPrev}
                                    onMouseOver={this.handleMouseOverPrev}
                                    onMouseOut={this.handleMouseOutPrev}
                                    style={{ padding: "4px 7px"  }}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfobottom EI48Lc" style={{ display: this.state.isHoveringPrev ? "block" : "none" }} >
                                            {this.state.isHoveringPrev && (
                                                "Up"
                                            )}
                                        </span>
                                    </div>
                                    {this.state.isDisabledPrev && (<ArrowLineLeft className="icon" ></ArrowLineLeft>)}
                                    {!this.state.isDisabledPrev && (<Image name='arrow-line-left-white.svg' className="icon" alt="Prev" />)}

                                </Button>
                            </NavItem>
                            <NavItem style={{ margin: "2px  10px 0  0" }}>
                                    <select
                                        onChange={this.handleItemView}
                                    value={state.ItemView}
                                    style={{ height: "30px", minWidth: "100px", "textAlignLast": "center" }}
                                    >
                                        {drawingDetails.map((item, index) => {
                                            let split = item.fileName.split('.');
                                            split.pop();
                                            let pg = "Page - "+item.currentPage;
                                            return (
                                                <option key={index} value={index} className="text-dark" style={{ cursor: "pointer" }} >{pg}</option>
                                            );
                                        })
                                        }
                                    </select>
                            </NavItem>
                            <NavItem style={{ margin: "2px  10px 0  0" }}>
                                <Button
                                    color="light"
                                    className={classNames("light-btn buttons primary", { "primary_hover": !this.state.isDisabledNext })}
                                    onClick={this.nextDraw}
                                    disabled={this.state.isDisabledNext}
                                    onMouseOver={this.handleMouseOverNext}
                                    onMouseOut={this.handleMouseOutNext}
                                    style={{ padding: "4px 7px" } }
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfobottom EI48Lc" style={{ display: this.state.isHoveringNext ? "block" : "none" }} >
                                            {this.state.isHoveringNext && (
                                                "Down"
                                            )}
                                        </span>
                                    </div>
                                    {this.state.isDisabledNext && (<ArrowLineRight className="icon"  ></ArrowLineRight>)}
                                    {!this.state.isDisabledNext && (<Image name='arrow-line-right-white.svg' className="icon" alt="Next" />)}

                                </Button>
                            </NavItem>
                    </Nav>
                    </div>
                )}
            </>
        );
    }
}
