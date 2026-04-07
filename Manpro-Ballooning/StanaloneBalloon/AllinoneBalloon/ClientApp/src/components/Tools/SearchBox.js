// #region Component Imports
import React, { Component } from 'react';
import { Nav, NavItem, Button, Input, FormGroup, Label } from "reactstrap";
import ReactDOMServer from "react-dom/server";
import useStore from "../Store/store";
import initialState from "../Store/init";
import { v1 as uuid } from "uuid";
import Image from '../Common/Image';
import classNames from "classnames";
import { config, showAlert, showAlertOnReset, validate, fetchSearchData, recKey, orgKey, shortBalloon, seo, capitalizeKeys } from '../Common/Common';
import { ReactComponent as PaintBrush } from "../../assets/paint_brush.svg";
import { ReactComponent as Search } from "../../assets/search.svg";
// #endregion

// #region Component SearchBox
export class SearchBox extends Component {
    static displayName = SearchBox.name;
    // #region constructor
    constructor(props) {
        super(props);
        this.state = {
            errors: [],
            isHovering: false,
            isHoveringReset: false,
        };
        
        this.handleSubmit = this.handleSubmit.bind(this);
        this.errorList = this.errorList.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);

        this.handleMouseOverReset = this.handleMouseOverReset.bind(this);
        this.handleMouseOutReset = this.handleMouseOutReset.bind(this);
    }
    // #endregion

    // #region fn
    componentDidMount() {
        let state = useStore.getState();
        if (!state.isDisabledSearchBtn) {
            this.refInput.focus();
        }
        this.refInput.focus();
        const element = document.getElementById("DrawingNo");
        window.setTimeout(() => element.focus(), 0);
    }
    handleMouseOver() {
        if (this.state.errors.length > 0) {
            this.setState({
                errors: []
            })
        }
        this.setState({ isHovering: true });
    }
    handleMouseOut() {
        if (this.state.errors.length > 0) {
            this.setState({
                errors: []
            })
        }
        this.setState({ isHovering: false });
    }

    handleMouseOverReset() { this.setState({ isHoveringReset: true }); }
    handleMouseOutReset() { this.setState({ isHoveringReset: false }); }

    handleSubmit = (e) => {
        e.preventDefault();
        let state = useStore.getState();
        useStore.setState({ ...initialState, user: state.user, sessionId: state.sessionId });
        useStore.setState({ drawingNo: state.drawingNo, revNo:state.revNo, isLoading: true, loadingText: "Loading your content..." })
        
        const errors = validate(state.drawingNo, state.revNo);
       // console.log("handleSubmit", errors);
        if (errors.length > 0) {
            useStore.setState({ isLoading: false })
            this.setState({ errors });
            const html = ReactDOMServer.renderToString(this.errorList(errors));
            showAlert("Error", html)
            return false;
        }
        useStore.setState({ selectedRowIndex: null });
        let req = { drawingNo: state.drawingNo, revNo: state.revNo, baseUrl: window.origin, sessionUserId: state.sessionId };
        setTimeout(() =>
            fetchSearchData(req)
                .then(r => {
                    return r.data;
                })
                .then(res => {
                    if (config.console)
                        console.log(res)
                    if (res.length > 0) {
                        let drawingDetails = res[0].map((item) => {
                            if (!item.hasOwnProperty("rotation")) {
                                item.rotation = 0;
                            }
                            return item;
                        });
                        useStore.setState({ drawingDetails: drawingDetails });

                        setTimeout(() => {
                            let files = res[0].length;
                            let drawHeader = res[1];
                            let draw = res[2];
                            let lmtype = res[3];
                            let lmsubtype = res[4];
                            lmsubtype.push({ subType_ID: "others", subType_Name: "Others" });
                            let units = res[5];
                            let cmbTolerance = res[6];
                            let newrects = [];
                            let partial_image = res[7]

                            if (config.console)
                                console.log(partial_image)
                            let rev = `${drawHeader[0].revision_No}`.toUpperCase()
                            seo({
                                title: `Drawing - ${drawHeader[0].drawingNo}, Rev - ${rev}`,
                                metaDescription: config.APP_TITLE
                            });
                            if (draw.length > 0) {
                                if (config.console)
                                    console.log("search data", draw)
                                draw = draw.map((item, index) => {
                                    if (item.hasOwnProperty("drawLineID")) {
                                        delete item.drawLineID;
                                    }
                                    item.balloon = item.balloon.replaceAll("-", ".");

                                    let pageIndex = item.page_No - 1;
                                    let superScale = partial_image.filter((a) => {
                                        return a.item === parseInt(pageIndex);
                                    });
                                    // console.log(superScale[0].scale);
                                    let rescale = superScale[0].scale;
                                    item.circle_X_Axis = parseInt(item.circle_X_Axis / rescale);
                                    item.circle_Y_Axis = parseInt(item.circle_Y_Axis / rescale);
                                    item.crop_Height = parseInt(item.crop_Height / rescale);
                                    item.crop_Width = parseInt(item.crop_Width / rescale);
                                    item.crop_X_Axis = parseInt(item.crop_X_Axis / rescale);
                                    item.crop_Y_Axis = parseInt(item.crop_Y_Axis / rescale);
                                    return item;
                                });
                                if (config.console)
                                    console.log(draw);
                                //clone a array of object
                                const oversearchData = JSON.parse(JSON.stringify(draw));

                                let searchOvergroup = oversearchData.reduce((acc, obj) => {
                                    let key = obj.balloon.toString().split('.')[0];
                                    acc[key] = acc[key] || [];
                                    acc[key].push(obj);
                                    return acc;
                                }, {});

                                let grouped = Object.values(searchOvergroup);

                                let groupOverSingle = grouped.reduce((res, curr) => {
                                    if (!res[parseInt(curr[0].balloon)]) {
                                        res[parseInt(curr[0].balloon)] = { key: parseInt(curr[0].balloon), value: curr }
                                    }
                                    return res;
                                }, []).filter((a) => a);
                                if (config.console)
                                    console.log("oversearchDataSingle", groupOverSingle)

                                let items = [];
                                let qtyi = [];
                                let groupshapped = groupOverSingle.reduce((r, c) => {
                                    if (c.value.length === 1) {
                                        r.push({ b: c.key });
                                        let i = r.length;
                                        const id = uuid();
                                        items[i] = { ...c.value[0], subBalloon: [], id: id, drawLineID: i };
                                    } else {
                                        // create quantity and sub balloon based on final object
                                        let qty = c.value[0].quantity;
                                        if (qty === 1) {
                                            let b = parseInt(c.key).toString() + ".1";
                                            r.push({ b: b });
                                            let i = r.length;
                                            const id = uuid();
                                            items[i] = { ...c.value[0], id: id, drawLineID: i };
                                            let sub = c.value.map(a => {
                                                // console.log("before", a.balloon)
                                                if (a.balloon.includes(parseInt(c.key).toString() + ".") && a.balloon.toString() !== c.value[0].balloon.toString()) {
                                                    //console.log("after", a.balloon)
                                                    const sqid = uuid();
                                                    r.push({ b: a.balloon });
                                                    let isub = r.length;
                                                    a.isDeleted = false;
                                                    items[isub] = { ...a, id: sqid, drawLineID: isub };
                                                    return a;
                                                }
                                                return false;
                                            }).filter(x => x !== false);
                                            items[i].subBalloon = sub;

                                        } else {

                                            for (let qi = 1; qi <= qty; qi++) {
                                                let b = parseInt(c.key).toString() + "." + qi.toString();

                                                if (!qtyi.includes(b)) {
                                                    qtyi.push(b);
                                                    let main = c.value.map(a => {
                                                        if (b.toString() === a.balloon.toString()) {
                                                            //console.log(b, a.balloon)
                                                            return a;
                                                        }
                                                        return false;
                                                    }).filter(x => x !== false);

                                                    if (main.length > 0) {
                                                        r.push({ b: c.key });
                                                        let i = r.length;
                                                        const qid = uuid();
                                                        items[i] = { ...main[0], id: qid, drawLineID: i };

                                                        let sub = c.value.map(a => {
                                                            if (a.balloon.includes(b + ".")) {
                                                                const sqid = uuid();
                                                                r.push({ b: a.balloon });
                                                                let isub = r.length;
                                                                a.isDeleted = false;
                                                                items[isub] = { ...a, id: sqid, drawLineID: isub };
                                                                return a;
                                                            }
                                                            return false;
                                                        }).filter(x => x !== false);
                                                        items[i].subBalloon = sub;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    return r;
                                }, []);

                                if (config.console)
                                    console.log("shapped", groupOverSingle, groupshapped.filter(a => a), items.filter(a => a), qtyi)
                                let newitems = items.filter(a => a);

                                if (config.console)
                                    console.log(newitems)
                                // return false;
                                newrects = newitems.map((item, ind) => {
                                    const id = uuid();
                                    var keys = Object.keys(item);
                                    //console.log(item)
                                    let newarr = [];
                                    var res = keys.reduce((prev, curr, index) => {
                                        const recIndex = recKey.indexOf(curr);
                                        if (recIndex !== -1) {
                                            newarr[orgKey[recIndex]] = ((item[curr] === null) ? "" : item[curr]);
                                            return { ...newarr, newarr }
                                        }
                                        if (curr === "drawLineID") {
                                            newarr["DrawLineID"] = ((item[curr] === null) ? "" : item[curr]);
                                            return { ...newarr, newarr }
                                        }
                                        if (curr === "isDeleted") {
                                            newarr["isDeleted"] = ((item[curr] === null) ? "" : item[curr]);
                                            return { ...newarr, newarr }
                                        }

                                        if (curr === "subBalloon") {
                                            let es = item.subBalloon.map(obj => {
                                                let cap = capitalizeKeys(obj);
                                                cap.isDeleted = cap.IsDeleted;
                                                delete cap.IsDeleted;
                                                delete cap.Isballooned;
                                                return { ...cap, isballooned: true, newarr: cap }
                                            });
                                            newarr["subBalloon"] = ((item[curr] === null) ? [] : es);
                                            return { ...newarr, newarr }
                                        }
                                        return {
                                            ...newarr, newarr: { ...newarr }
                                        }
                                    }, {});
                                    //console.log(res)
                                    delete res.newarr.subBalloon;
                                    let w = parseInt(item.crop_Width * 1);
                                    let h = parseInt(item.crop_Height * 1);
                                    let x = parseInt(item.crop_X_Axis * 1);
                                    let y = parseInt(item.crop_Y_Axis * 1);
                                    return { ...res, x, y, width: w, height: h, id: id, isballooned: true, selectedRegion: "", DrawLineID: ind + 1 };
                                })
                                newrects = shortBalloon(newrects, "DrawLineID");
                                if (config.console)
                                    console.log(newrects)
                            }
                            if (config.console)
                                console.log("search res", newrects)
                            //return false;
                            // Persist drawing info for page refresh auto-reload
                            sessionStorage.setItem('lastDrawingNo', state.drawingNo);
                            sessionStorage.setItem('lastRevNo', state.revNo);
                            sessionStorage.setItem('lastSessionId', drawHeader[0].sessionId || '');

                            useStore.setState({
                                isDisabledSearchBtn: true, drawingHeader: drawHeader, lmtype: lmtype, lmsubtype: lmsubtype, ItemView: 0,
                                units: units, cmbTolerance: cmbTolerance, originalRegions: newrects, draft: newrects, drawingRegions: [], balloonRegions: [],
                                savedDetails: ((newrects.length > 0) ? true : false),
                                selectedRegion: ((newrects.length > 0) ? "" : ""),
                                isMultifile: (files > 1) ? true : false,
                                sidebarIsOpen: false,
                                isLoading: false,
                                sessionId: drawHeader[0].sessionId,
                                partial_image: partial_image
                            })

                            return res;
                        }, 500);
                    }
                }, (e) => {
                        useStore.setState({ isLoading: false })
                    showAlert("Error", "Oops! Something went wrong.").then(function () {
                        setTimeout(() => {
                            const element = document.getElementById("DrawingNo");
                            window.setTimeout(() => element.focus(), 0);
                        }, 500);
                    });
                }).catch(e => { console.log("catch",e) })
            , 100);  
    
        return false;
    };

    errorList = (e) => {
        return e.map((value, i) => {
            return (
                <div key={i} >
                    <p>{value.message}</p>
                </div>
            );
        });
    }

    reset = (e) => {
        e.preventDefault();
        showAlertOnReset();
        return true;
    };
    // #endregion

    // #region Render HTML
    render() {

        //const { errors } = this.state;
        let state = useStore.getState();
        let drawingDetails = state.drawingDetails;
        //const html = ReactDOMServer.renderToString(this.errorList(errors));

        return (
            <>
                {/* {errors.length > 0 && showAlert("Error", html)} */}
                <form
                    autoComplete="off"
                    className="container"
                >
          
                    <div className="">
                        <Nav className="align-items-center " >
                            <NavItem style={{ margin:"2px  10px 0  100px",width:"150px"} }>
                                <div>
                                    <FormGroup >
                                        <Label for="DrawingNo">
                                            Drawing No
                                        </Label>
                                <Input
                                        id="DrawingNo"
                                        name="DrawingNo"
                                        className="DrawingNo"
                                        placeholder=""
                                        type="text"
                                        bsSize="sm"
                                            size="8"
                                            ref={(refInput) => {
                                                this.refInput = refInput;
                                            }}
                                        disabled={state.isDisabledSearchBtn}
                                        value={state.drawingNo}
                                        onChange={(e) => {
                                            if (this.state.errors.length > 0) {
                                                this.setState({
                                                    errors: []
                                                })
                                            }
                                           // const result = e.target.value.replace(/\D/g, '');
                                            useStore.setState({ drawingNo: e.target.value })
                                        }}
                                        />      
                                    </FormGroup>
                            </div>
                            </NavItem>
                            <NavItem style={{ margin: "2px  15px 0  0px" }}>
                                <div>
                                    <FormGroup >
                                        <Label for="RevNo">
                                            Rev No
                                        </Label>
                                <Input
                                        id="RevNo"
                                        name="RevNo"
                                        className="RevNo"
                                        placeholder=""
                                        type="text"
                                        bsSize="sm"
                                        size="3"
                                        disabled={state.isDisabledSearchBtn}
                                        value={state.revNo}
                                        onChange={(e) => {
                                            if (this.state.errors.length > 0) {
                                                this.setState({
                                                    errors: []
                                                })
                                            }
                                          //  const result = e.target.value.replace(/[^a-z0-9]/gi, '');
                                            useStore.setState({ revNo: e.target.value })
                                        }}
                                        />
                                    </FormGroup>
                            </div>
                        </NavItem>
                            <NavItem className="box" style={{ margin: "12px  10px 0  0"  }}>
                                <Button color="light" className={classNames("light-btn buttons primary", { "primary_hover": !state.isDisabledSearchBtn })} 

                                    type="button"
                                    onClick={this.handleSubmit}
                                    disabled={state.isDisabledSearchBtn}
                                    onMouseOver={this.handleMouseOver}
                                    onMouseOut={this.handleMouseOut}
                                    style={{ padding:"2.5px"} }
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfobottom EI48Lc" style={{ display: this.state.isHovering ? "block" : "none" }} >
                                            {this.state.isHovering && (
                                                "Search"
                                            )}
                                        </span>
                                    </div>
                                    {state.isDisabledSearchBtn && (<> &nbsp;&nbsp;<Search className="icon" ></Search>&nbsp;&nbsp;</>)}
                                    {!state.isDisabledSearchBtn && (<> &nbsp;&nbsp;<Image name='search-white.svg' className="icon" alt="Search" />&nbsp;&nbsp;</>)}
                                     
                                </Button>
                            </NavItem>
                            <NavItem className="box" style={{ margin: "12px  10px 0  0" }}>
                                <Button color="light" className={classNames("light-btn buttons primary", { "primary_hover": drawingDetails.length > 0 })} 
                                    onClick={this.reset}
                                disabled={drawingDetails.length > 0 ? false :true}
                                    onMouseOver={this.handleMouseOverReset}
                                    onMouseOut={this.handleMouseOutReset}>
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfobottom EI48Lc"   style={{ display: this.state.isHoveringReset ? "block" : "none" }} >
                                            {this.state.isHoveringReset && (
                                                "Clear"
                                            )}
                                        </span>
                                    </div>
                                    {drawingDetails.length === 0 && (<PaintBrush className="icon" ></PaintBrush>)}
                                    {drawingDetails.length > 0 && (<Image name='paint_brush-white.svg' className="icon" alt="Clear" />)}
                                </Button>
                            </NavItem>
                    </Nav>
                    </div>
                </form>            
            </>
        );
    }
    // #endregion
};
// #endregion