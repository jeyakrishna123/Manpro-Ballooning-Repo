import React, { Component } from 'react';
import ReactDOMServer from "react-dom/server";
import useStore from "../Store/store";
import { Button, Row, Input, Form, NavItem, Nav, FormGroup, Label } from 'reactstrap';
import Image from '../Common/Image';
import axios from "axios";
import classNames from "classnames";
import { ReactComponent as Search } from "../../assets/search.svg";
import { ReactComponent as PaintBrush } from "../../assets/paint_brush.svg";
import { ReactComponent as UploadIcon } from "../../assets/upload.svg";
import { ReactComponent as UploadWhiteIcon } from "../../assets/upload-white.svg";
import { v1 as uuid } from "uuid";
import {  config, seo , showAlert, validate, validateSearch, showAlertOnReset, recKey, orgKey, shortBalloon,  capitalizeKeys, CatchError } from '../Common/Common';
import Swal from 'sweetalert2';

class UploadORSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isuploadHovering: false,
            isHovering: false,
        }
        this.fileInputRef = React.createRef();

        this.handluploadeMouseOver = this.handluploadeMouseOver.bind(this);
        this.handluploadeMouseOut = this.handluploadeMouseOut.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
    }
    handleMouseOver() {
        this.setState({ isHovering: true });
    }
    handleMouseOut() {
        this.setState({ isHovering: false });
    }
    handluploadeMouseOut() {
        this.setState({ isuploadHovering: false });
    }
    handluploadeMouseOver() {
        this.setState({ isuploadHovering: true });
    }
    handleFile(e){
        this.props.onChangehandleFile(e)
    }
    handleUpload(e) {
        this.props.onChangehandleUpload(e)
    }
    handleSearch(e) {
        this.props.onChangehandleSearch(e)
    }
    render() {
        let state = useStore.getState();
        let drawingDetails = state.drawingDetails;
 
        let routingDisable = false;
        if (drawingDetails.length > 0 && state.ItemView != null) {
            routingDisable = true;
        }

        return (<>
            <NavItem style={{ margin: "2px  5px 0  0px", width: "fit-content" }}>
                <FormGroup >
                    <Label style={{ textAlign:"center", width:"100%"} } >
                        Search (or) Upload
                    </Label>
                <div style={{ display: "flex" }}>
                    <div className="mb-0 pt-0 d-flex ms-0"
                        style={{ margin: "0px  5px 0  0px", cursor: (routingDisable || this.props.fileLimit) ? 'not-allowed' : '' }}>
                        <Button
                            color={drawingDetails.length > 0 ? "light" : "secondary"}
                            className={classNames("btn  ", { "btn-secondary": drawingDetails.length > 0 })}
                            type="button"
                            onClick={(e) => this.handleSearch(e)}
                            disabled={state.isDisabledSearchBtn}
                            onMouseOver={this.handleMouseOver}
                            onMouseOut={this.handleMouseOut}
                            style={{ padding: "1.5px" }}
                        >
                            <div style={{ position: "relative" }}>
                                <span className="PySCBInfobottom EI48Lc" style={{ display: this.state.isHovering ? "block" : "none" }} >
                                    {this.state.isHovering && (
                                        "Search"
                                    )}
                                </span>
                            </div>

                            {drawingDetails.length > 0 && (<> &nbsp;&nbsp;<Search className="icon" ></Search>&nbsp;&nbsp;</>)}
                            {drawingDetails.length === 0 && (<> &nbsp;&nbsp;<Image name='search-white.svg' className="icon" alt="Search" />&nbsp;&nbsp;</>)}
                        </Button>
                    </div>
                    <div className="mb-0 pt-0"
                        style={{ cursor: (routingDisable || this.props.fileLimit) ? 'not-allowed' : ''  }} >
                        <Label htmlFor="filetype"
                            className={classNames("custom-file-upload text-center", { "disabled": (routingDisable) })}
                            style={{ pointerEvents: (routingDisable || this.props.fileLimit) ? 'none' : '', cursor: 'pointer' }}
                        >
                            {(this.props.files !== null && this.props.files.length > 0) && (<><p>Choosed {this.props.files.length} File</p></>)}
                            {(this.props.files === null || this.props.files.length === 0) && (<><p>Choose a file</p></>)}

                        </Label>
                        <div style={{ position: "absolute", top: 0, left: 0, zIndex: 0, width: 0, height: 0 }}>
                            <Input
                                id="filetype"
                                name="files[]"
                                ref={this.fileInputRef}
                                type="file"
                                style={{
                                    position: "absolute", top: 0, left: 0, zIndex: 0, width: 0, height: 0
                                }}
                                multiple
                                accept='application/pdf, image/png, image/jpeg, image/jpg'
                                onChange={(e) => this.handleFile(e)}
                                disabled={this.props.fileLimit}
                            >
                            </Input>
                        </div>
                    </div>
               
                   
                    </div>
                </FormGroup>
            </NavItem>
        </>)
    }
}
export class FileUpload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            errors: [],
            files: null,
            isHovering: false,
            fileLimit: false,
        };
        this.fileInputRef = React.createRef();
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);

        this.handleMouseOverReset = this.handleMouseOverReset.bind(this);
        this.handleMouseOutReset = this.handleMouseOutReset.bind(this);
    }
  
    componentDidMount() {
        let state = useStore.getState();

        // Auto-reload last drawing after page refresh (must run BEFORE focus code that might fail)
        const savedDrawingNo = sessionStorage.getItem('lastDrawingNo');
        const savedRevNo = sessionStorage.getItem('lastRevNo');
        if (savedDrawingNo && savedRevNo && !state.autoload && state.drawingNo === "" && state.drawingDetails.length === 0) {
            useStore.setState({ drawingNo: savedDrawingNo, revNo: savedRevNo, autoload: true });
            state = useStore.getState();
        }

        // Focus input fields (wrapped in try/catch to avoid blocking auto-reload)
        try {
            const r = (state.user.length > 0 && (state.user[0].role === "Admin" || state.user[0].role === "Supervisor")) ? true : false;
            if (window.location.pathname === "/") {
                if (this.refInput) this.refInput.focus();
                const element = document.getElementById("DrawingNo");
                if (element) window.setTimeout(() => element.focus(), 0);
            }
        } catch (e) {
            console.log("Focus error on mount:", e);
        }

        if (state.autoload) {

            useStore.setState({ autoload: false, drawingNo: state.drawingNo, revNo: state.revNo, isLoading: true, loadingText: "Loading your content..." })

            const errors = validate(state.drawingNo, state.revNo);
            if (errors.length > 0) {
                useStore.setState({ isLoading: false })
                this.setState({ errors });
                const html = ReactDOMServer.renderToString(this.errorList(errors));
                showAlert("Error", html)
                return false;
            }
            useStore.setState({ selectedRowIndex: null });
            let currentUser = state.user[0];
            let savedSessionId = sessionStorage.getItem('lastSessionId') || state.sessionId;
            let req = { drawingNo: state.drawingNo, revNo: state.revNo, baseUrl: window.origin, sessionUserId: savedSessionId };
            setTimeout(async () => {
                let BASE_URL = process.env.REACT_APP_SERVER || '';
                let url = BASE_URL + "/api/fileupload/Uploadorsearch";
                useStore.setState({ isLoading: true, loadingText: "Reloading your drawing... Please wait..." })
                await axios.post(url, req, {
                    headers: {
                        "Authorization": "Bearer " + currentUser.jwtToken,
                        Accept: "application/json",
                    },
                })
                    .then(r => {
                        return r.data;
                    })
                    .then(res => {
                        this.searchResponse(res)
                    }, (e) => {
                        useStore.setState({ isLoading: false })
                        console.log("Auto-reload API error:", e);
                        showAlert("Error", e.response ? e.response.data : "Failed to reload drawing. Please search again.").then(function () {
                            setTimeout(() => {
                                const element = document.getElementById("DrawingNo");
                                if (element) window.setTimeout(() => element.focus(), 0);
                            }, 500);
                        });
                    }).catch(e => { console.log("Auto-reload catch:", e) })
            }, 100);
        }
    }
    handleMouseOver() {
        this.setState({ isHovering: true });
    }
    handleMouseOut() {
        this.setState({ isHovering: false });
    }

    handleMouseOverReset() { this.setState({ isHoveringReset: true }); }
    handleMouseOutReset() { this.setState({ isHoveringReset: false }); }

    reset = (e) => {
        e.preventDefault();
        const stage = this.props.stageRef.current;
        stage.position({ x: 0, y: 0 });
        stage.scale({ x: 1, y: 1 });
        stage.batchDraw();
        showAlertOnReset();
        this.setState({ fileLimit: false });
        return true;
    };

    handleFile(e) {
        // Getting the files from the input
        let files = e.target.files;
        let state = useStore.getState();
        const MAX_COUNT = state.max_upload_file;
        if (files.length > MAX_COUNT) {

            showAlert("Invalid", `<p>You can only add a maximum of ${MAX_COUNT} files</p>`).then((result) => {
                if (result.isConfirmed) {
                    document.getElementById("filetype").value = "";
                    this.setState({ files: null });
                }
            });
        } else {
            this.setState({ fileLimit: false });
        }
        this.setState({ files }, () => {
            // Auto-extract Drawing No and Rev No from filename and trigger upload
            if (files && files.length > 0) {
                const fileName = files[0].name;
                const nameWithoutExt = fileName.replace(/\.[^/.]+$/, ""); // remove extension
                let extracted = false;

                // Pattern 1: DRAWINGNO-REV-PAGENO (e.g. GK02877-A-001)
                let match = nameWithoutExt.match(/^(.+)-([A-Za-z0-9]+)-\d{1,3}$/);
                if (match) {
                    useStore.setState({ drawingNo: match[1].toUpperCase(), revNo: match[2].toUpperCase() });
                    extracted = true;
                }

                // Pattern 2: DRAWINGNO-REV (e.g. GK02877-A)
                if (!extracted) {
                    match = nameWithoutExt.match(/^(.+)-([A-Za-z0-9]+)$/);
                    if (match) {
                        useStore.setState({ drawingNo: match[1].toUpperCase(), revNo: match[2].toUpperCase() });
                        extracted = true;
                    }
                }

                // Pattern 3: DRAWINGNO_REV (e.g. GK02877_A)
                if (!extracted) {
                    match = nameWithoutExt.match(/^(.+)_([A-Za-z0-9]+)$/);
                    if (match) {
                        useStore.setState({ drawingNo: match[1].toUpperCase(), revNo: match[2].toUpperCase() });
                        extracted = true;
                    }
                }

                // If no pattern matched but Drawing No and Rev No are already filled, auto-trigger
                const currentState = useStore.getState();
                if (currentState.drawingNo && currentState.drawingNo.trim() !== "" &&
                    currentState.revNo && currentState.revNo.trim() !== "") {
                    setTimeout(() => {
                        this.handleUpload({ preventDefault: () => {} });
                    }, 150);
                } else if (!extracted) {
                    // Prompt user to fill Drawing No and Rev No
                    showAlert("Info", "<p>Please enter Drawing No and Rev No, then click the upload button.</p>");
                }
            }
        });
    }

    errorList = (e) => {
        return e.map((value, i) => {
            return (
                <div key={i} >
                    <p>{value.message}</p>
                </div>
            );
        });
    }

    handleMaterialQty = (e) => {
        const re = /^[0-9\b]+$/;
        if (e.target.value === '' || re.test(e.target.value))
            useStore.setState({ MaterialQty: e.target.value })
    }

    handlerouterno = (e) => {
        const result = e.target.value.toUpperCase();
        useStore.setState({ routerno: result })
    }

    searchResponse = async(res) => {
        if (Object.keys(res).length > 0) {
            // Reset fileLimit so user can upload a new file for a different drawing
            this.setState({ fileLimit: false, files: null });

            let drawingDetails = res.FileInfo.map((item) => {
                if (!item.hasOwnProperty("rotation")) {
                    item.rotation = 0;
                }
                return item;
            });
            useStore.setState({ drawingDetails: drawingDetails });
            let files = res.FileInfo.length;
            let drawHeader = res.HeaderInfo;
            let draw = res.Balloons;
            let lmtype = res.MeasureType;
            let lmsubtype = res.MeasureSubType;
            lmsubtype.push({ subType_ID: "others", subType_Name: "Others" });
            let units = res.UnitsType;
            let cmbTolerance = res.TolerenceType;
            let newrects = [];
            let partial_image = res.ImageInfo;
            let globalSettings = res.SettingsInfo;
            let Characteristics = res.CharacteristicsType;
            let exportTemplate = res.TemplateType;
            let controllCopy = res.controllCopy;
            let resized_image = res.resized_image;

            let rev = `${drawHeader[0].revision_No}`.toUpperCase()
            seo({
                title: `Drawing - ${drawHeader[0].drawingNo}, Rev - ${rev}`,
                metaDescription: config.APP_TITLE
            });
           // let state = useStore.getState();
          //  let token = `${drawHeader[0].drawingNo}-${drawHeader[0].revision_No}`.toUpperCase();
            // openToken(state, token);
            if (config.console)
                console.log(Object.entries(globalSettings[0]))

            for (const [key, value] of Object.entries(globalSettings[0])) {
                if (key === "defaultBalloon") { useStore.setState({ defaultPicker: value }) }
                if (key === "errorBalloon") { useStore.setState({ errorPicker: value }) }
                if (key === "successBalloon") { useStore.setState({ successPicker: value }) }
                if (key === "balloonShape") { useStore.setState({ balloonShape: value }) }
                if (key === "minMaxOneDigit") { useStore.setState({ MinMaxOneDigit: value }) }
                if (key === "minMaxTwoDigit") { useStore.setState({ MinMaxTwoDigit: value }) }
                if (key === "minMaxThreeDigit") { useStore.setState({ MinMaxThreeDigit: value }) }
                if (key === "minMaxFourDigit") { useStore.setState({ MinMaxFourDigit: value }) }
                if (key === "minMaxAngles") { useStore.setState({ MinMaxAngles: value }) }
                if (key === "convert") { useStore.setState({ Convert_to_mm: value === true || value === "True" || value === "true" || value === 1 || value === "1" }) }
                if (key === "routerno") { useStore.setState({ routerno: value }) }
                if (key === "drawingNo") { useStore.setState({ drawingNo: value }) }
                if (key === "revNo") { useStore.setState({ revNo: value }) }
                if (key === "materialQty") { useStore.setState({ MaterialQty: value }) }
                if (key === "fontScale") { useStore.setState({ fontScale: value === '' ? 0 : parseFloat(value) }) }
                if (key === "watermark" && value) {
                    try {
                        const wm = typeof value === "string" ? JSON.parse(value) : value;
                        useStore.setState({ watermark: { ...useStore.getState().watermark, ...wm } });
                    } catch (e) { /* ignore parse errors */ }
                }
            }
            if (draw.length > 0) {
                if (config.console)
                    console.log("search data", draw)
                draw = draw.map((item, index) => {
                    if (item.hasOwnProperty("drawLineID")) {
                        delete item.drawLineID;
                    }
                    item.balloon = item.balloon.replaceAll("-", ".");
                    item.isSaved = true;
                    let pageIndex = item.page_No - 1;
                    let superScale = partial_image.filter((a) => {
                        return a.item === parseInt(pageIndex);
                    });
                    if (!superScale || superScale.length === 0) return item;
                    let rescale = superScale[0].scale;
                    item.circle_X_Axis = parseInt(item.circle_X_Axis / rescale);
                    item.circle_Y_Axis = parseInt(item.circle_Y_Axis / rescale);
                    item.measure_X_Axis = parseInt(item.measure_X_Axis / rescale);
                    item.measure_Y_Axis = parseInt(item.measure_Y_Axis / rescale);
                    item.crop_Height = parseInt(item.crop_Height / rescale);
                    item.crop_Width = parseInt(item.crop_Width / rescale);
                    item.crop_X_Axis = parseInt(item.crop_X_Axis / rescale);
                    item.crop_Y_Axis = parseInt(item.crop_Y_Axis / rescale);

                    item.actualDecision.map((qitem, i) => {
                        [qitem].map((r) => {

                            let key = Object.keys(r);
                            // let val = Object.values(r);
                            key.map((user, i) => {
                                let Decision = (r[user].Decision.toString() === "") ? "" : ((r[user].Decision.toString() === "false") ? false : true)
                                r[user].Decision = Decision;
                                return user;
                            });
                            return r;
                        });
                        return qitem;
                    });
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
                    // console.log(item)
                    let newarr = [];
                    var res = keys.reduce((prev, curr, index) => {
                        //console.log(curr , recKey[index]);
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
                        if (curr === "isSaved") {
                            newarr["isSaved"] = ((item[curr] === null) ? "" : item[curr]);
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

            const clonedArray = newrects.map(item => ({ ...item }));
            const allEqual = arr => arr.every(v => v === true);

            clonedArray.reduce((res, curr) => {
                if (!res[parseInt(curr.Balloon)]) {
                    res[parseInt(curr.Balloon)] = []
                }
                res[parseInt(curr.Balloon)].push(curr);
                return res;
            }, []).filter((a) => a)
                .map((selectedBalloon) => {

                    const { user, successPicker, errorPicker, defaultPicker } = useStore.getState();
                    let pushableDecision = [];
                    let role = user[0].role;
                    let permission = user[0].permission.includes("add_actual_value");
                    let items = clonedArray.map((item) => {
                        if (parseInt(item.Balloon) === parseInt(selectedBalloon[0].Balloon)) {
                            item.ActualDecision.map((qitem, i) => {
                                [qitem].map((r) => {
                                    let key = Object.keys(r);
                                    key.map((label, i) => {
                                        let Decision = r[label].Decision;
                                        if (permission && role === "CNC Operator" && label === 'OP') {
                                            pushableDecision.push(Decision);
                                        }
                                        if (permission && role === "Line Inspector" && label === 'LI') {
                                            pushableDecision.push(Decision);
                                        }
                                        if (permission && role === "Final Operator" && label === 'Final') {
                                            pushableDecision.push(Decision);
                                        }
                                        return user;
                                    });
                                    return r;
                                });
                                return qitem;
                            });
                            return item;
                        }
                        return false;
                    }).filter(item => item !== false);

                    if (pushableDecision.length > 0) {
                        items.map((item, p) => {

                            if (pushableDecision.includes(false)) {
                                item.BalloonColor = errorPicker;
                                item.newarr.BalloonColor = errorPicker;
                                return item;
                            }

                            if (allEqual(pushableDecision)) {
                                item.BalloonColor = successPicker;
                                item.newarr.BalloonColor = successPicker;
                                return item;
                            }

                            if (pushableDecision.includes('')) {
                                item.BalloonColor = defaultPicker;
                                item.newarr.BalloonColor = defaultPicker;
                                return item;
                            }

                            return item;
                        });
                    }
                    return selectedBalloon;
                });

            // console.log(clonedArray, cloneSingle)

            // Persist drawing info for page refresh auto-reload
            const currentState = useStore.getState();
            if (currentState.drawingNo && currentState.revNo) {
                sessionStorage.setItem('lastDrawingNo', currentState.drawingNo);
                sessionStorage.setItem('lastRevNo', currentState.revNo);
                sessionStorage.setItem('lastSessionId', drawHeader[0].sessionId || '');
            }

            useStore.setState({
                isDisabledSearchBtn: true, drawingHeader: drawHeader, lmtype: lmtype, lmsubtype: lmsubtype, ItemView: 0,
                Characteristics: Characteristics, units: units, cmbTolerance: cmbTolerance, originalRegions: newrects, draft: newrects, drawingRegions: [], balloonRegions: [],
                exportTemplate: exportTemplate, controllCopy: controllCopy,
                savedDetails: ((newrects.length > 0) ? true : false),
                selectedRegion: ((newrects.length > 0) ? "" : ""),
                isMultifile: (files > 1) ? true : false,
                sidebarIsOpen: false,
                isLoading: false,
                sessionId: drawHeader[0].sessionId,
                partial_image: partial_image,
                resized_image: resized_image,
                isDisabledACT: false,
                isDisabledFIT: false,
                isDisabledZoomOut: false,
                isDisabledZoomIn: false,
                isDisabledCCW: false,
                isDisabledCW: false,
                isDisabledMAG: false,
                isDisabledFH: false,
                isDisabledDel: false,
                isDisabledSave: false,
                isDisabledReset: false,
                isDisabledResetB: false,
                isDisabledAutoB: false,
                isDisabledSPL: false,
                isDisabledOCR: false,
                isDisabledRegion: false,
                isDisabledMove: false,
                isDisabledSelected: false,
                isDisabledManual: false,
                isDisabledUnSelected: false,
            })

            // Check OCR engine health after drawing loads
            try {
                let BASE_URL = process.env.REACT_APP_SERVER || '';
                let currentUser = useStore.getState().user[0];
                let healthRes = await axios.get(`${BASE_URL}/api/drawingsearch/OcrHealth`, {
                    headers: { "Authorization": "Bearer " + currentUser.jwtToken },
                    timeout: 5000
                });
                let health = healthRes.data;
                if (health.configuredEngine === "PaddleOCR" && !health.paddleOcrAvailable) {
                    showAlert("Warning", `<p>PaddleOCR service is not running!</p><p>Using Tesseract fallback (lower accuracy).</p><p>Please start PaddleOCR service for best results.</p>`);
                }
            } catch (e) {
                // Health check failed silently - don't block drawing load
                console.warn("OCR health check failed:", e.message);
            }

            return res;
        }
    };

    callSecondApi = async (url, req, currentUser) => {
        try {
            useStore.setState({ isLoading: true })
            await axios.post(url, req, {
                headers: {
                    "Authorization": "Bearer " + currentUser.jwtToken,
                    Accept: "application/json",
                },
            }).then(r => {
                useStore.setState({ isLoading: false })
                return r.data;
            }).then(res => {

                this.searchResponse(res)
            });
        } catch (error) {
            console.error('Error calling second API:', error);
        }
    };

    handleOrSearch = async (e) => {
        e.preventDefault();
        let state = useStore.getState();
 
        useStore.setState({ autoload:false, drawingNo: state.drawingNo, revNo: state.revNo, isLoading: true, loadingText: "Loading your content..." })

        const errors = validate(state.drawingNo, state.revNo);
        if (errors.length > 0) {
            useStore.setState({ isLoading: false })
            this.setState({ errors });
            const html = ReactDOMServer.renderToString(this.errorList(errors));
            showAlert("Error", html)
            return false;
        }
        useStore.setState({ selectedRowIndex: null });
        let currentUser = state.user[0];
        let req = { drawingNo: state.drawingNo, revNo: state.revNo, baseUrl: window.origin, sessionUserId: state.sessionId };
        setTimeout(async() => {
            let BASE_URL = process.env.REACT_APP_SERVER || '';
            let url = BASE_URL + "/api/fileupload/Uploadorsearch";
            useStore.setState({ isLoading: true, loadingText: "Loading your content..." })
            await axios.post(url, req, {
                headers: {
                    "Authorization": "Bearer " + currentUser.jwtToken,
                    Accept: "application/json",
                },
            })
                .then(r => {
                    return r.data;
                })
                .then(res => {
                    this.searchResponse(res)
                }, (e) => {
                    useStore.setState({ isLoading: false })
                     showAlert("Error", e.response.data).then(function () {
                        setTimeout(() => {
                            const element = document.getElementById("DrawingNo");
                            window.setTimeout(() => element.focus(), 0);
                        }, 500);
                    });
                }).catch(e => { console.log("catch", e) })
        }, 100);

        return false;
    }

    handleSearch = async (e) => {
        e.preventDefault();
        let state = useStore.getState();
        const errors = validateSearch(state);
        //console.log("handleSubmit", errors);
        if (errors.length > 0) {
            useStore.setState({ isLoading: false })
            this.setState({ errors });
            const html = ReactDOMServer.renderToString(this.errorList(errors));
            showAlert("Error", html)
            return false;
        }
        let req = {
            drawingNo: state.drawingNo,
            revNo: state.revNo,
            routerNo: state.routerno,
            materialQty: state.MaterialQty,
            sessionUserId: state.sessionId,
            agree:false
        };
        // console.log(req,state)
        let currentUser = state.user[0];
        try {
            let BASE_URL = process.env.REACT_APP_SERVER || '';
            let url = BASE_URL + "/api/fileupload/presearch";
            useStore.setState({ isLoading: true, loadingText: "Loading your content..." })
            await axios.post(url, req, {
                headers: {
                    "Authorization": "Bearer " + currentUser.jwtToken,
                    Accept: "application/json",
                },
            }).then(r => {
                useStore.setState({ isLoading: false })
                return r.data;
            }).then(res => {
               // console.log(res)
               // return false;
                if (res.diff) {
                    Swal.fire({
                        title: "Do you want to Continue?",
                        html: `<div style="font-size:16px;"><p>Router No: <b>${req.routerNo}</b> already created with the quantity of <b style="color:green;">${res.old}</b></p><p><b style="color:red;"> Now the quantity has changed to ${res.new}</b> </p></div>`,
                        showDenyButton: false,
                        showCancelButton: true,
                        confirmButtonText: "Continue",
                        allowOutsideClick: false,
                        allowEscapeKey: false
                      //  denyButtonText: `Don't save`
                    }).then((result) => {
                        /* Read more about isConfirmed, isDenied below */
                        if (result.isConfirmed) {
                            req.agree = true;
                            this.callSecondApi(url, req, currentUser);
                        }
                    });
                } else {
                    this.searchResponse(res);
                }
            });       
        } catch (error) {
            console.log("catch", error)
            useStore.setState({ isLoading: false });
            CatchError(error);
        }
    }

    // Optimize image on client side before upload to reduce transfer time
    optimizeImage = (file, maxDimension = 4000) => {
        return new Promise((resolve) => {
            const isPdf = file.name.toLowerCase().endsWith('.pdf');
            if (isPdf) { resolve(file); return; }
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const { width, height } = img;
                // Skip if already small enough
                if (width <= maxDimension && height <= maxDimension) { resolve(file); return; }
                const scale = maxDimension / Math.max(width, height);
                const newW = Math.round(width * scale);
                const newH = Math.round(height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = newW;
                canvas.height = newH;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newW, newH);
                canvas.toBlob((blob) => {
                    const optimized = new File([blob], file.name, { type: 'image/png', lastModified: Date.now() });
                    resolve(optimized);
                }, 'image/png');
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        });
    };

    handleUpload = async (e) => {
        e.preventDefault();
        let files = this.state.files;
        let state = useStore.getState();
        if (files === null || files.length === 0) {
            showAlert("Invalid", `<p>Please choose a file to Upload.</p>`);
            return false;
        }
        const errors = validate(state.drawingNo.trim(), state.revNo.trim() );
        //console.log("handleSubmit", errors);
        if (errors.length > 0) {
            useStore.setState({ isLoading: false })
            this.setState({ errors });
            const html = ReactDOMServer.renderToString(this.errorList(errors));
            showAlert("Error", html)
            return false;
        }
        let formData = new FormData();
        //Adding files to the formdata
        this.setState({ fileLimit: true });
        // Optimize images in parallel before uploading
        const optimizedFiles = await Promise.all(
            Array.from(files).map(f => this.optimizeImage(f))
        );
        for (let i = 0; i < optimizedFiles.length; i++) {
            formData.append('files', optimizedFiles[i]);
        }
        formData.append("sessionUserId", state.sessionId === '' ? 'null' : state.sessionId);
        if (files.length > 1)
            useStore.setState({ isLoading: true, loadingText: "Loading your Files..." })
        else 
            useStore.setState({ isLoading: true, loadingText: "Loading your File..." })

        formData.append('DefaultBalloon', state.defaultPicker );
        formData.append('ErrorBalloon', state.errorPicker);
        formData.append('SuccessBalloon', state.successPicker);
        formData.append('BalloonShape', state.balloonShape);
        formData.append('MinMaxOneDigit', state.MinMaxOneDigit);
        formData.append('MinMaxTwoDigit', state.MinMaxTwoDigit);
        formData.append('MinMaxThreeDigit', state.MinMaxThreeDigit);
        formData.append('MinMaxFourDigit', state.MinMaxFourDigit);
        formData.append('MinMaxAngles', state.MinMaxAngles);
        formData.append('Routerno', "123456");
        formData.append('MaterialQty', "1");
        formData.append('DrawingNo', state.drawingNo);
        formData.append('RevNo', state.revNo);
        formData.append('convert', state.Convert_to_mm);
        formData.append('fontScale', state.fontScale);

        let currentUser = state.user[0];
        try {
            let BASE_URL = process.env.REACT_APP_SERVER || '';
            let url = BASE_URL + "/api/fileupload/UploadFile";
           await axios.post(url, formData, {
                headers: {
                   "Content-Type": "multipart/form-data",
                   "Authorization": "Bearer " + currentUser.jwtToken,
                    Accept: "application/json",
                },
            }).then(r => {
                document.getElementById("filetype").value = "";
                this.setState({ files: null });
                useStore.setState({ isLoading: false })
                return r.data;
            }).then(res => {
                if (config.console)
                    console.log(res, Object.keys(res))

                if (Object.keys(res).length > 0) {
                    this.setState({ fileLimit: true });
                    let drawingDetails = res.FileInfo.map((item) => {
                        if (!item.hasOwnProperty("rotation")) {
                            item.rotation = 0;
                        }
                        return item;
                    });
                    useStore.setState({ drawingDetails: drawingDetails });
                    let files = res.FileInfo.length;
                    let drawHeader = res.HeaderInfo;
                    let draw = res.Balloons;
                    let lmtype = res.MeasureType;
                    let lmsubtype = res.MeasureSubType;
                    lmsubtype.push({ subType_ID: "others", subType_Name: "Others" });
                    let units = res.UnitsType;
                    let cmbTolerance = res.TolerenceType;
                    let newrects = [];
                    let partial_image = res.ImageInfo;
                    let globalSettings = res.SettingsInfo;
                    let Characteristics = res.CharacteristicsType;
                    let exportTemplate = res.TemplateType;
                    let controllCopy = res.controllCopy;
                    let resized_image = res.resized_image;

                    let rev = `${drawHeader[0].revision_No}`.toUpperCase()
                    seo({
                        title: `Drawing - ${drawHeader[0].drawingNo}, Rev - ${rev}`,
                        metaDescription: config.APP_TITLE
                    });

                    for (const [key, value] of Object.entries(globalSettings[0])) {
                        
                        if (key === "defaultBalloon") { useStore.setState({ defaultPicker: value }) }
                        if (key === "errorBalloon") { useStore.setState({ errorPicker: value }) }
                        if (key === "successBalloon") { useStore.setState({ successPicker: value }) }
                        if (key === "balloonShape") { useStore.setState({ balloonShape: value }) }
                        if (key === "minMaxOneDigit") { useStore.setState({ MinMaxOneDigit: value }) }
                        if (key === "minMaxTwoDigit") { useStore.setState({ MinMaxTwoDigit: value }) }
                        if (key === "minMaxThreeDigit") { useStore.setState({ MinMaxThreeDigit: value }) }
                        if (key === "minMaxFourDigit") { useStore.setState({ MinMaxFourDigit: value }) }
                        if (key === "minMaxAngles") { useStore.setState({ MinMaxAngles: value }) }
                        if (key === "convert") { useStore.setState({ Convert_to_mm: value === true || value === "True" || value === "true" || value === 1 || value === "1" }) }
                        if (key === "routerno") { useStore.setState({ routerno: value }) }
                        if (key === "drawingNo") { useStore.setState({ drawingNo: value }) }
                        if (key === "revNo") { useStore.setState({ revNo: value }) }
                        if (key === "materialQty") { useStore.setState({ MaterialQty: value }) }
                        if (key === "fontScale") { useStore.setState({ fontScale: value === '' ? 0 : parseFloat(value) }) }
                        if (key === "watermark" && value) {
                            try {
                                const wm = typeof value === "string" ? JSON.parse(value) : value;
                                useStore.setState({ watermark: { ...useStore.getState().watermark, ...wm } });
                            } catch (e) { /* ignore parse errors */ }
                        }
                    }
                    // Skip loading old balloons on new file upload - user should click Process
                    draw = [];

                    if (draw.length > 0) {
                        if (config.console)
                            console.log("search data", draw)
                        draw = draw.map((item, index) => {
                            if (item.hasOwnProperty("drawLineID")) {
                                delete item.drawLineID;
                            }
                            if (item.page_No > drawingDetails[0].totalPage) {
                                //delete item;
                                return false;
                            }
                            item.balloon = item.balloon.replaceAll("-", ".");
                            item.isSaved = true;
                            let pageIndex = item.page_No - 1;
                            let superScale = partial_image.filter((a) => {
                                return a.item === parseInt(pageIndex);
                            });
                            // console.log(superScale[0].scale);
                            let rescale = superScale[0].scale;
                            item.circle_X_Axis = parseInt(item.circle_X_Axis / rescale);
                            item.circle_Y_Axis = parseInt(item.circle_Y_Axis / rescale);
                            item.measure_X_Axis = parseInt(item.measure_X_Axis / rescale);
                            item.measure_Y_Axis = parseInt(item.measure_Y_Axis / rescale);
                            item.crop_Height = parseInt(item.crop_Height / rescale);
                            item.crop_Width = parseInt(item.crop_Width / rescale);
                            item.crop_X_Axis = parseInt(item.crop_X_Axis / rescale);
                            item.crop_Y_Axis = parseInt(item.crop_Y_Axis / rescale);
                            return item;
                        }).filter(a => a!== false);
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
                           // console.log(item)
                            let newarr = [];
                            var res = keys.reduce((prev, curr, index) => {
                                //console.log(curr , recKey[index]);
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
                                if (curr === "isSaved") {
                                    newarr["isSaved"] = ((item[curr] === null) ? "" : item[curr]);
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

                    useStore.setState({
                        isDisabledSearchBtn: true, drawingHeader: drawHeader, lmtype: lmtype, lmsubtype: lmsubtype, ItemView: 0,
                        Characteristics: Characteristics, units: units, cmbTolerance: cmbTolerance, originalRegions: newrects, draft: newrects, drawingRegions: [], balloonRegions: [],
                        exportTemplate: exportTemplate, controllCopy: controllCopy,
                        savedDetails: ((newrects.length > 0) ? true : false),
                        selectedRegion: ((newrects.length > 0) ? "" : ""),
                        isMultifile: (files > 1) ? true : false,
                        sidebarIsOpen: false,
                        isLoading: false,
                        sessionId: drawHeader[0].sessionId,
                        partial_image: partial_image,
                        resized_image: resized_image,
                        isDisabledACT: false,
                        isDisabledFIT: false,
                        isDisabledZoomOut: false,
                        isDisabledZoomIn: false,
                        isDisabledCCW: false,
                        isDisabledCW: false,
                        isDisabledMAG: false,
                        isDisabledFH: false,
                        isDisabledDel: false,
                        isDisabledSave: false,
                        isDisabledReset: false,
                        isDisabledResetB: false,
                        isDisabledAutoB: false,
                        isDisabledSPL: false,
                        isDisabledOCR: false,
                        isDisabledRegion: false,
                        isDisabledMove: false,
                        isDisabledSelected: false,
                        isDisabledManual: false,
                        isDisabledUnSelected: false,
                    })

                    // Persist drawing info for page refresh auto-reload (upload flow)
                    const uploadedState = useStore.getState();
                    if (uploadedState.drawingNo && uploadedState.revNo) {
                        sessionStorage.setItem('lastDrawingNo', uploadedState.drawingNo);
                        sessionStorage.setItem('lastRevNo', uploadedState.revNo);
                        sessionStorage.setItem('lastSessionId', drawHeader[0].sessionId || '');
                    }

                    return res;
                }
            });

        } catch (error) {
            console.log('catch', error);
            useStore.setState({ isLoading: false });
            document.getElementById("filetype").value = "";
            this.setState({ files: null, fileLimit: false });
            CatchError(error);
        }
    }
 
    render() {
        let state = useStore.getState();
        let drawingDetails = state.drawingDetails;
        let x = window.location;
        const r = (state.user[0].role === "Admin" || state.user[0].role === "Supervisor") ? true : false;
        let routingDisable = false;
        if (drawingDetails.length > 0 && state.ItemView != null) {
            routingDisable = true;
        }
 
        if ((x.pathname !== "/")) {
            return (<></>);
        }
        return (         
            <div className="file"  >
                <Form
                    autoComplete="off"
                    className="container"
                >
                    <Row>
                        <Nav className="align-items-center p-0">
                            <NavItem style={{ margin: "2px  5px 0  0px", width: "100px" }}>
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
                                            disabled={routingDisable ? "disabled" : ""}
                                            //disabled={this.state.fileLimit}
                                            value={state.drawingNo}
                                            onChange={(e) => {
                                                if (this.state.errors.length > 0) {
                                                    this.setState({
                                                        errors: []
                                                    })
                                                }
                                                const result = e.target.value.toUpperCase();
                                                useStore.setState({ drawingNo: result })
                                            }}
                                            onFocus={(e) => { e.target.select(); }  }
                                            onKeyUp={(e) => {
                                                e.preventDefault();
                                                if (e.keyCode === 13) {
                                                    if (r) {
                                                        if (this.state.files === null || this.state.files.length === 0) {
                                                            this.handleOrSearch(e)
                                                        } else {
                                                            this.handleUpload(e);
                                                        }
                                                    }
                                                    if (!r) this.handleSearch(e);
                                                }
                                            }}
                                        />
                                    </FormGroup>
                                </div>
                            </NavItem>
                            <NavItem style={{ margin: "2px  5px 0  0px", width: "50px" }}>
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
                                            disabled={routingDisable ? "disabled" : ""}
                                           // disabled={this.state.fileLimit}
                                            value={state.revNo}
                                            onChange={(e) => {
                                                if (this.state.errors.length > 0) {
                                                    this.setState({
                                                        errors: []
                                                    })
                                                }
                                                const result = e.target.value.toUpperCase();
                                                useStore.setState({ revNo: result })
                                            }}
                                            onKeyUp={(e) => {
                                                e.preventDefault();
                                                if (e.keyCode === 13) {
                                                    if (r) {
                                                        if (this.state.files === null || this.state.files.length === 0) {
                                                            this.handleOrSearch(e)
                                                        } else {
                                                            this.handleUpload(e);
                                                        }
                                                    }
                                                    if (!r) this.handleSearch(e);
                                                }
                                            }}
                                        />
                                    </FormGroup>
                                </div>
                            </NavItem>
                            {(r) && (<UploadORSearch
                                files={this.state.files}
                                fileLimit={this.state.fileLimit}
                                onChangehandleFile={(e) => { this.handleFile(e) }}
                                onChangehandleUpload={(e) => { this.handleUpload(e) }}
                                onChangehandleSearch={(e) => { this.handleOrSearch(e) }}
                            />
                            )}
                            {(!r) && (
                                <>
                                    <NavItem style={{ margin: "2px  5px 0  0px", width: "100px" }}>
                                        <FormGroup className="mb-2" >
                                         
                                            <Label for="routerno"> Router No </Label>
        
                                            <Input className="" bsSize="sm"
                                                size="8" disabled={routingDisable ? "disabled" : ""} placeholder="Router No" id="routerno" name="routerno"
                                                type="text"
                                                onChange={this.handlerouterno}
                                                value={useStore.getState().routerno}
                                                onKeyUp={(e) => {
                                                    e.preventDefault();
                                                    if (e.keyCode === 13) {
                                                        if (r) this.handleUpload(e);
                                                        if (!r) this.handleSearch(e);
                                                    }
                                                }}
                                            />
                                        </FormGroup>
                                    </NavItem>
                                    <NavItem style={{ margin: "2px  5px 0  0px", width: "60px" }}>
                                        <FormGroup className="mb-2" >
                                 
                                            <Label for="qty">Quantity </Label>
                                  
                                            <Input className="" bsSize="sm"
                                                size="3" disabled={routingDisable ? "disabled" : ""} placeholder="Quantity" id="MaterialQty" name="MaterialQty" type="number" min={1} step={1}
                                                onKeyDown={this.handleMaterialQty}
                                                onChange={this.handleMaterialQty}
                                                value={useStore.getState().MaterialQty}
                                                onKeyUp={(e) => {
                                                    e.preventDefault();
                                                    if (e.keyCode === 13) {
                                                        if (r) {
                                                            this.handleUpload(e);
                                                        }
                                                        if (!r) this.handleSearch(e);
                                                    }
                                                }}
                                            />
                                        </FormGroup>
                                    </NavItem>
                                    <NavItem className="box" style={{ margin: "12px  10px 0  0" }}>
                                        <Button color="light" className={classNames("light-btn buttons primary", { "primary_hover": drawingDetails.length === 0 })}
                                            type="button"
                                            onClick={(e) => this.handleSearch(e)}
                                            disabled={state.isDisabledSearchBtn}
                                            onMouseOver={this.handleMouseOver}
                                            onMouseOut={this.handleMouseOut}
                                            style={{ padding: "2.5px" }}
                                        >
                                            <div style={{ position: "relative" }}>
                                                <span className="PySCBInfobottom EI48Lc" style={{ display: this.state.isHovering ? "block" : "none" }} >
                                                    {this.state.isHovering && (
                                                        "Search"
                                                    )}
                                                </span>
                                            </div>
                   
                                            {drawingDetails.length > 0 && (<> &nbsp;&nbsp;<Search className="icon" ></Search>&nbsp;&nbsp;</>)}
                                            {drawingDetails.length === 0 && (<> &nbsp;&nbsp;<Image name='search-white.svg' className="icon" alt="Search" />&nbsp;&nbsp;</>)}

                                        </Button>
                                    </NavItem>
                                </>
                            )}
                            <NavItem  style={{ margin: "12px  5px 0  0" }}>
                                <div>
                                    <div className="mb-0">
                                    <Button color="light" className={classNames("light-btn buttons primary", { "primary_hover": drawingDetails.length > 0 })}
                                        onClick={this.reset}
                                        disabled={drawingDetails.length > 0 ? false : true}
                                        onMouseOver={this.handleMouseOverReset}
                                        onMouseOut={this.handleMouseOutReset}>
                                        <div style={{ position: "relative" }}>
                                            <span className="PySCBInfobottom EI48Lc" /*aria-hidden={this.state.isHoveringReset}*/ style={{ display: this.state.isHoveringReset ? "block" : "none" }} >
                                                {this.state.isHoveringReset && (
                                                    "Clear All"
                                                )}
                                            </span>
                                        </div>
                                        {drawingDetails.length === 0 && (<PaintBrush className="icon m-1" ></PaintBrush>)}
                                        {drawingDetails.length > 0 && (<Image name='paint_brush-white.svg' className="icon m-1" alt="Clear" />)}
                                    </Button>
                                </div>
                            </div>
                            </NavItem>
                        
                            <NavItem style={{ margin: "12px  1px 0  0" }} >
                                <Button color="light" className={classNames("light-btn buttons Savebtn primary", { "primary_hover": state.drawingDetails.length > 0 })}
                                    onClick={(e) => { this.props.saveBalloons(e) }}
                                    disabled={(drawingDetails.length > 0 && state.originalRegions.length > 0) ? false : true}
                                    onMouseOver={(e) => { this.props.handleMouseOverSave(e) }}
                                    onMouseOut={(e) => { this.props.handleMouseOutSave(e) }}
                                    style={{ "display": "flex", "height": "28px" }}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfobottom EI48Lc" style={{ left: "auto" }}   >
                                            Save All
                                        </span>
                                    </div>
                                    <div className="gb_be gb_ae" style={{ display: "contents" }}>Save</div>                                    
                                </Button>
                            </NavItem>
                        </Nav>                        
                    </Row>
                </Form>               
            </div>
        )};
}

