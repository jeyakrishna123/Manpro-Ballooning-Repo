// #region Component Imports
import React, { Component } from 'react';
import { Row, Col, Button, Nav, NavItem } from "reactstrap";
import Image from '../Common/Image';
import useStore from "../Store/store";
import initialState from "../Store/init";
import Swal from 'sweetalert2'
import { v1 as uuid } from "uuid";
import { rearrangedPageBalloon, config, shortBalloon, fitSize, actualSize, resetBalloonsProcess, newBalloonPosition, rotateProcessApi, makeAutoballoonApi, saveBalloonsApi, recKey, orgKey, capitalizeKeys, showAlert, MultipleDelete } from '../Common/Common';
import { ReactComponent as Playbutton} from "../../assets/play-button.svg";
import { ReactComponent as DottedSquare } from "../../assets/dotted-square.svg";
import { ReactComponent as SquareCross } from "../../assets/square-cross.svg";
import { ReactComponent as SPLSVG } from "../../assets/spl.svg";
import { ReactComponent as Reset } from "../../assets/reset.svg";
import { ReactComponent as ActualSize } from "../../assets/actual-size.svg";
import { ReactComponent as FitSize } from "../../assets/fit-size.svg";
import { ReactComponent as MagnifierPlus } from "../../assets/magnifier-plus.svg";
import { ReactComponent as MagnifierMinus } from "../../assets/magnifier-minus.svg";
import { ReactComponent as Rotateccw } from "../../assets/RotateCCW.svg";
import { ReactComponent as Rotatecw } from "../../assets/RotateCW.svg";
import classNames from "classnames";
// #endregion 
export class Buttons extends Component {
    static displayName = Buttons.name;

    // #region  constructor
    constructor(props) {
        super(props);
        this.state = {
            isHoveringACT: false,
            isHoveringFIT: false,
            isHoveringZoomOut: false,
            isHoveringZoomIn: false,
            isHoveringCCW: false,
            isHoveringCW: false,
            isHoveringMAG: false,
            isHoveringFH: false,
            isHoveringDel: false,
            isHoveringSave: false,
            isHoveringReset: false,
            isHoveringManual: false,
            isHoveringSelected: false,
            isHoveringAuto: false,
            isHoveringUnSelected: false,
            isHoveringResetB: false,
            isHoveringSPL: false,
            
            selectedRegion: "",
            width: 0,
            height: 0,
            topbarIsOpen: 1,
            propertyclick: 1 
        };
        this.timer = null;
        this.windowResized = this.windowResized.bind(this);
        this.updateWindowWidth = this.updateWindowWidth.bind(this);

        this.selectedRegion = this.selectedRegion.bind(this); 
 
        this.toggleTopbar = this.toggleTopbar.bind(this);
        this.propertyclick = this.propertyclick.bind(this);

        this.handleMouseOverACT = this.handleMouseOverACT.bind(this);
        this.handleMouseOutACT = this.handleMouseOutACT.bind(this);

        this.handleMouseOverFIT = this.handleMouseOverFIT.bind(this);
        this.handleMouseOutFIT = this.handleMouseOutFIT.bind(this);

        this.handleMouseOverZoomOut = this.handleMouseOverZoomOut.bind(this);
        this.handleMouseOutZoomOut = this.handleMouseOutZoomOut.bind(this);

        this.handleMouseOverZoomIn = this.handleMouseOverZoomIn.bind(this);
        this.handleMouseOutZoomIn = this.handleMouseOutZoomIn.bind(this);

        this.handleMouseOverCCW = this.handleMouseOverCCW.bind(this);
        this.handleMouseOutCCW = this.handleMouseOutCCW.bind(this);

        this.handleMouseOverCW = this.handleMouseOverCW.bind(this);
        this.handleMouseOutCW = this.handleMouseOutCW.bind(this);

        this.handleMouseOverMAG = this.handleMouseOverMAG.bind(this);
        this.handleMouseOutMAG = this.handleMouseOutMAG.bind(this);

        this.handleMouseOverFH = this.handleMouseOverFH.bind(this);
        this.handleMouseOutFH = this.handleMouseOutFH.bind(this);

        this.handleMouseOverDel = this.handleMouseOverDel.bind(this);
        this.handleMouseOutDel = this.handleMouseOutDel.bind(this);

        this.handleMouseOverSave = this.handleMouseOverSave.bind(this);
        this.handleMouseOutSave = this.handleMouseOutSave.bind(this);

        this.handleMouseOverReset = this.handleMouseOverReset.bind(this);
        this.handleMouseOutReset = this.handleMouseOutReset.bind(this);
        this.showAlertOnReset = this.showAlertOnReset.bind(this);

        this.handleZoomIn = this.handleZoomIn.bind(this);
        this.handleZoomOut = this.handleZoomOut.bind(this);

        this.handleMouseOverManual = this.handleMouseOverManual.bind(this);
        this.handleMouseOutManual = this.handleMouseOutManual.bind(this);

        this.handleMouseOverSelected = this.handleMouseOverSelected.bind(this);
        this.handleMouseOutSelected = this.handleMouseOutSelected.bind(this);

        this.handleMouseOverUnSelected = this.handleMouseOverUnSelected.bind(this);
        this.handleMouseOutUnSelected = this.handleMouseOutUnSelected.bind(this);

        this.handleMouseOverResetB = this.handleMouseOverResetB.bind(this);
        this.handleMouseOutResetB = this.handleMouseOutResetB.bind(this);

        this.handleMouseOverAuto = this.handleMouseOverAuto.bind(this);
        this.handleMouseOutAuto = this.handleMouseOutAuto.bind(this);

        this.handleMouseOverSPL = this.handleMouseOverSPL.bind(this);
        this.handleMouseOutSPL = this.handleMouseOutSPL.bind(this);
  
    } 
    // #endregion
  
    componentDidMount() {
        window.addEventListener("resize", this.windowResized);
        this.updateWindowWidth();
    }
    componentDidUpdate(oldProps) {
        if (oldProps.ItemView !== this.props.ItemView &&  this.props.drawingDetails.length > 0
            && this.props.ItemView !== null) {

            useStore.setState ({
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
                isDisabledUnSelected:false,
            });
        }
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.windowResized);
    }

    updateWindowWidth() {
        let _this = this;
        setTimeout(function () {
            _this.setState({
                width: window.innerWidth,
                height: window.innerHeight
            });
        });
    }

    windowResized() {
        let _this = this;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(function () {
            _this.updateWindowWidth();
        }, 500);
    }

    handleMouseOverAuto() { this.setState({ isHoveringAuto: true }); }
    handleMouseOutAuto() { this.setState({ isHoveringAuto: false }); }

    handleMouseOverResetB() { this.setState({ isHoveringResetB: true }); }
    handleMouseOutResetB() { this.setState({ isHoveringResetB: false }); }

    handleMouseOverUnSelected() { this.setState({ isHoveringUnSelected: true }); }
    handleMouseOutUnSelected() { this.setState({ isHoveringUnSelected: false }); }

    handleMouseOverSelected() { this.setState({ isHoveringSelected: true }); }
    handleMouseOutSelected() { this.setState({ isHoveringSelected: false }); }

    handleMouseOverManual() { this.setState({ isHoveringManual: true }); }
    handleMouseOutManual() { this.setState({ isHoveringManual: false }); }

    handleMouseOverACT() { this.setState({ isHoveringACT: true });  }
    handleMouseOutACT() { this.setState({ isHoveringACT: false }); }

    handleMouseOverFIT() { this.setState({ isHoveringFIT: true }); }
    handleMouseOutFIT() { this.setState({ isHoveringFIT: false }); }

    handleMouseOverZoomOut() { this.setState({ isHoveringZoomOut: true }); }
    handleMouseOutZoomOut() { this.setState({ isHoveringZoomOut: false }); }

    handleMouseOverZoomIn() { this.setState({ isHoveringZoomIn: true }); }
    handleMouseOutZoomIn() { this.setState({ isHoveringZoomIn: false }); }

    handleMouseOverCCW() { this.setState({ isHoveringCCW: true }); }
    handleMouseOutCCW() { this.setState({ isHoveringCCW: false }); }

    handleMouseOverCW() { this.setState({ isHoveringCW: true }); }
    handleMouseOutCW() { this.setState({ isHoveringCW: false }); }

    handleMouseOverMAG() { this.setState({ isHoveringMAG: true }); }
    handleMouseOutMAG() { this.setState({ isHoveringMAG: false }); }

    handleMouseOverFH() { this.setState({ isHoveringFH: true }); }
    handleMouseOutFH() { this.setState({ isHoveringFH: false }); }

    handleMouseOverDel() { this.setState({ isHoveringDel: true }); }
    handleMouseOutDel() { this.setState({ isHoveringDel: false }); }

    handleMouseOverSave() { this.setState({ isHoveringSave: true }); }
    handleMouseOutSave() { this.setState({ isHoveringSave: false }); }

    handleMouseOverReset() { this.setState({ isHoveringReset: true }); }
    handleMouseOutReset() { this.setState({ isHoveringReset: false }); }

    handleMouseOverSPL() { this.setState({ isHoveringSPL: true }); }
    handleMouseOutSPL() { this.setState({ isHoveringSPL: false }); }

    toggleTopbar() {
        this.setState({
            topbarIsOpen: !this.state.topbarIsOpen
        });
    }
    propertyclick() {
        this.setState({
            topbarIsOpen: !this.state.topbarIsOpen
        });

    }
 
    changeRegion = (e) => {
        e.preventDefault();
        let selectedRegion = e.currentTarget.getAttribute('data-value');
        let state = useStore.getState();
        const r = (state.user[0].role === "Admin" || state.user[0].role === "Supervisor") ? true : false;
        if (!r) return;
        if (state.selectedRegion === selectedRegion) {
            useStore.setState({ selectedRegion: "" })
        } else {
            useStore.setState({ selectedRegion: selectedRegion })
        }
    };

    selectedRegion = (e) => {
        let selectedRegion = e.target.value;
        let state = useStore.getState();
        if (state.selectedRegion === selectedRegion) {
            useStore.setState({ selectedRegion: "Manual Drawn" })
        } else {
            useStore.setState({ selectedRegion: selectedRegion })
        }
    }

    makeAutoballoon = (e) => {
        e.preventDefault();
        useStore.setState({ selectedRegion: "Full Image" })

        const state = useStore.getState();
        if (state.isErrImage) {
            return;
        }
        const {
            originalRegions,
            drawingHeader,
            partial_image,
            ItemView,
            drawingDetails,
            aspectRatio,
            bgImgX,
            bgImgY,
            bgImgW,
            bgImgH,
            selectedRegion
            } = state;
        let CurrentItem = drawingDetails[ItemView].annotation;
        let CdrawingNo = drawingHeader[0].drawingNo;
        let routingNo = drawingHeader[0].routingNo;
        let Quantity = drawingHeader[0].quantity;
        let CrevNo = drawingHeader[0].revision_No
        let pageNo = 0;
        let totalPage = 0;
        let rotation = 0;
        let rotate_properties = [];
        let origin = [];
       // console.log(partial_image, ItemView)
        if (drawingDetails.length > 0 && ItemView != null) {
            pageNo = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
            totalPage = Object.values(drawingDetails)[parseInt(ItemView)].totalPage;
            rotation = Object.values(drawingDetails)[parseInt(ItemView)].rotation;
            let rotate = drawingDetails.map(s => parseInt(s.rotation));
            rotate_properties = JSON.stringify(rotate);
            origin = Object.values(partial_image)[parseInt(ItemView)];
        }
        
        const oldDraw = originalRegions.map((item, i) => {
            if (item.hasOwnProperty("newarr") && parseInt(pageNo) !== parseInt(item.Page_No)) {
                const id = uuid();
                let w = parseInt(item.newarr.Crop_Width * 1);
                let h = parseInt(item.newarr.Crop_Height * 1);
                let x = parseInt(item.newarr.Crop_X_Axis * 1);
                let y = parseInt(item.newarr.Crop_Y_Axis * 1);
                let cx = parseInt(item.newarr.Circle_X_Axis * 1);
                let cy = parseInt(item.newarr.Circle_Y_Axis * 1);
                let mx = parseInt(item.newarr.Measure_X_Axis * 1);
                let my = parseInt(item.newarr.Measure_Y_Axis * 1);
                item.Crop_Width = w;
                item.Crop_Height = h;
                item.Crop_X_Axis = x;
                item.Crop_Y_Axis = y;
                item.Circle_X_Axis = cx;
                item.Circle_Y_Axis = cy;
                item.Measure_X_Axis = mx;
                item.Measure_Y_Axis = my;
                item.height = h;
                item.width = w;
                item.x = x;
                item.y = y;
                item.id = id;
                item.isballooned = true;
                item.selectedRegion = "";
                if (item.hasOwnProperty("DrawLineID"))
                    delete item.DrawLineID;

                return item;
            }
            return false;
        }).filter(item => item !== false);

        let resetOverData = [...oldDraw];

        let resetOverSingle = resetOverData.reduce((res, item) => {
            if (!res[parseInt(item.Balloon)]) {
                res[parseInt(item.Balloon)] = item;
            }
            return res;
        }, []);
        let cc = state.controllCopy.filter(x => x.pageNo === pageNo);
        if (cc.length > 0) {
            cc[0].textGroupPlaced = false;
        }
        useStore.setState({ controllCopy: cc });
        let qtyi = 0;
        // get all quantity parent
        let Qtyparent = resetOverData.reduce((res, item) => {
            if (item.hasOwnProperty("subBalloon") && item.subBalloon.length >= 0 && item.Quantity > 1) {
                res[qtyi] = item;
                qtyi++;
            }
            return res;
        }, []);

        let unique = Object.values(resetOverSingle);
        //console.log(unique)


        let newitems = [];

        unique.reduce((prev, curr, index) => {
            const id = uuid();
            let newarr = [];
            let Balloon = index + 1;
            Balloon = Balloon.toString();
            if (curr.Quantity === 1 && curr.subBalloon.length === 0) {
                prev.push({ b: (Balloon), c: prev.length + 1 })
                let i = prev.length;
                newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: Balloon }, id: id, DrawLineID: i, Balloon: Balloon });
            }
            if (curr.Quantity === 1 && curr.subBalloon.length > 0) {
                let pb = parseInt(Balloon).toString() + ".1";
                prev.push({ b: pb, c: prev.length + 1 })
                let i = prev.length;
                newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: id, DrawLineID: i, Balloon: pb, selectedRegion: "" });
                curr.subBalloon.filter((x) => x.isDeleted === false).map(function (e, ei) {
                    let sno = ei + 2;
                    const sid = uuid();
                    let b = parseInt(Balloon).toString() + "." + sno.toString();
                    prev.push({ b: b, c: prev.length + 1 })
                    let i = prev.length;
                    if (e.hasOwnProperty("Isballooned"))
                        delete e.Isballooned;
                    if (e.hasOwnProperty("Id"))
                        delete e.Id;

                    let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b, selectedRegion:"" };
                    newarr.push(setter);
                    return e;
                })
            }
            if (curr.Quantity > 1 && curr.subBalloon.length === 0) {
                for (let qi = 1; qi <= curr.Quantity; qi++) {
                    if (qi > config.maxBalloonQty) { break; }
                    const qid = uuid();
                    let b = parseInt(Balloon).toString() + "." + qi.toString();
                    prev.push({ b: b, c: prev.length + 1 })
                    let i = prev.length;
                    newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b, selectedRegion: "" });
                }
            }
            if (curr.Quantity > 1 && curr.subBalloon.length > 0) {

                for (let qi = 1; qi <= curr.Quantity; qi++) {
                    if (qi > config.maxBalloonQty) { break; }
                    let newMainItem = [];
                    let pb = parseInt(curr.Balloon).toString() + "." + qi.toString();
                    newMainItem = Qtyparent.map(item => {
                        if (pb === item.Balloon) {
                            return item;
                        }
                        return false;
                    }).filter(x => x !== false);
                    // console.log("sd", Qtyparent, newMainItem, pb, qi)
                    if (newMainItem.length > 0) {

                        newMainItem.map((nmi) => {
                            const qid = uuid();
                            let pb = parseInt(Balloon).toString() + "." + (qi).toString();
                            prev.push({ b: pb, c: prev.length + 1 })
                            let i = prev.length;

                            newarr.push({ ...nmi, newarr: { ...nmi.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb, selectedRegion: "" });
                            let newSubItem = nmi.subBalloon.filter(a => {
                                return a.isDeleted === false;
                            });
                            newSubItem.filter((x) => x.isDeleted === false).map(function (e, ei) {
                                let sqno = ei + 1;
                                const sqid = uuid();
                                let b = pb + "." + sqno.toString();
                                prev.push({ b: b, c: prev.length + 1 })
                                let i = prev.length;
                                if (e.hasOwnProperty("Isballooned"))
                                    delete e.Isballooned;
                                if (e.hasOwnProperty("Id"))
                                    delete e.Id;
                                let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sqid, DrawLineID: i, Balloon: b, selectedRegion: "" };
                                newarr.push(setter);
                                return e;
                            })
                            return nmi;
                        })
                    }

                }



            }

            newitems = newitems.slice();
            newitems.splice(newitems.length, 0, ...newarr);

            return prev;
        }, []);

        
        // setInterval(() =>
        const Settings = Object.assign({}, {
            DefaultBalloon: state.defaultPicker,
            ErrorBalloon: state.errorPicker,
            SuccessBalloon: state.successPicker,
            BalloonShape: state.balloonShape,
            MinMaxOneDigit: state.MinMaxOneDigit,
            MinMaxTwoDigit: state.MinMaxTwoDigit,
            MinMaxThreeDigit: state.MinMaxThreeDigit,
            MinMaxFourDigit: state.MinMaxFourDigit,
            MinMaxAngles: state.MinMaxAngles,
            Routerno: state.routerno,
            MaterialQty: state.MaterialQty,
            convert: state.Convert_to_mm,
        });
        let requestData = {
            ItemView: ItemView,
            CdrawingNo: CdrawingNo,
            CrevNo: CrevNo,
            drawingDetails: CurrentItem,
            aspectRatio: aspectRatio,
            bgImgW: bgImgW,
            bgImgH: bgImgH,
            bgImgX: bgImgX,
            bgImgY: bgImgY,
            pageNo: pageNo,
            totalPage: totalPage,
            annotation: [],
            originalRegions: newitems,
            selectedRegion: selectedRegion,
            drawingRegions: [],
            balloonRegions: [],
            rotate: rotate_properties,
            origin: [origin],
            bgImgRotation: rotation,
            routingNo: routingNo,
            Quantity: Quantity,
            Settings: Settings,
            accurateGDT: useStore.getState().accurateGDT || false
        };
        useStore.setState({ selectedRowIndex: null });
        console.log("AUTO BALLOON REQUEST - accurateGDT:", requestData.accurateGDT, requestData);
       //return false; 
        useStore.setState({
             originalRegions: oldDraw,
            drawingRegions: [],
            balloonRegions: [], isLoading: true, loadingText: "Processing Auto Balloon..." })
         
        makeAutoballoonApi(requestData)
            .then(r => {
                return r.data;
            })
            .then(r => {
                if (config.console)
                    console.log(r, "Auto  balloon res")
                useStore.setState({ isLoading: false, is_BalloonDrawingSaved: true });
                useStore.setState({ selectedRegion: "" })

                if (r.length > 0) {
                    if (config.console)
                        console.log("saved data", r)
                    r = r.map((item, index) => {
                        if (item.hasOwnProperty("drawLineID")) {
                            delete item.drawLineID;
                        }
                        item.balloon = item.balloon.replaceAll("-", ".");
                        return item;
                    });

                    //clone a array of object
                   // const oversearchData = JSON.parse(JSON.stringify(r));
                    const oversearchData = [...r];

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
                                    if (qi > config.maxBalloonQty) { break; }
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
                        console.log("auto", newitems)
                    //return false;

                    let newrects = newitems.map((item, ind) => {
                        const id = uuid();
                        var keys = Object.keys(item);
                       // console.log(keys)
                        let newarr = [];
                        var res = keys.reduce((prev, curr, index) => {
                          //  console.log (curr , recKey[index])
                                const recIndex = recKey.indexOf(curr);
                                if (recIndex !== -1) {
                                newarr[orgKey[recIndex]] = ((item[curr] === null) ? "" : item[curr]);
                                return { ...newarr, newarr }
                            }


                            if (curr === "drawLineID") {
                                newarr["DrawLineID"] = ((item[curr] === null) ? "" : item[curr]);
                                return { ...newarr, newarr }
                            }

                            if (curr === "subBalloon") {
                                let es = item.subBalloon.map(obj => {
                                    let cap = capitalizeKeys(obj);
                                    cap.isDeleted = cap.IsDeleted;
                                    cap.isSaved = cap.IsSaved;
                                    delete cap.IsDeleted;
                                    delete cap.IsSaved;
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
                    console.log("auto balloon page" + pageNo, newrects, config.maxBalloonQty)

                    newrects = rearrangedPageBalloon(newrects);
                    useStore.setState({
                        originalRegions: newrects,
                        draft: newrects,
                        savedDetails: ((newrects.length > 0) ? true : false),
                        drawingRegions: [],
                        balloonRegions: []
                    });
                    const newstate = useStore.getState();
                    if (newstate.savedDetails) {
                        let originalRegions = newstate.originalRegions;
                        let newrect = newBalloonPosition(originalRegions, newstate);
                        useStore.setState({
                            savedDetails: false,
                            drawingRegions: newrect,
                            balloonRegions: newrect,
                            isDisabledAutoB: false
                        });

                    }
  
                }

  
            }, (e) => {
                console.log("Error", e);
                useStore.setState({ isLoading: false });
            }).catch(e => {
                console.log("catch",e);
                useStore.setState({ isLoading: false });
            })
 
          // , 100000);  
    }

    saveBalloons = (e) => {
        const state = useStore.getState();
        const {
            draft,
            originalRegions,
            drawingRegions,
            drawingHeader,
            ItemView,
            drawingDetails,
            aspectRatio,
            bgImgX,
            bgImgY,
            bgImgW,
            bgImgH,
            selectedRegion,
            bgImgRotation
            } = state;
        let CurrentItem = drawingDetails[ItemView].annotation;
        let CdrawingNo = drawingHeader[0].drawingNo;
        let CrevNo = drawingHeader[0].revision_No;
        let pageNo = 0;
        let totalPage = 0;
        if (drawingDetails.length > 0 && ItemView != null) {
            pageNo = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
            totalPage = Object.values(drawingDetails)[parseInt(ItemView)].totalPage;
        }
        
        useStore.setState({ isLoading: true, loadingText: "Saving Balloon... Please Wait..." })
        let req = {
            ItemView: ItemView,
            CdrawingNo: CdrawingNo,
            CrevNo: CrevNo,
            drawingDetails: CurrentItem,
            aspectRatio: aspectRatio,
            bgImgW: bgImgW,
            bgImgH: bgImgH,
            bgImgX: bgImgX,
            bgImgY: bgImgY,
            pageNo: pageNo,
            totalPage: totalPage,
            annotation: [],
            selectedRegion: selectedRegion,
            drawingRegions: drawingRegions,
            balloonRegions: [],
            originalRegions: originalRegions,
            bgImgRotation: bgImgRotation

        }
        setTimeout(() =>
            saveBalloonsApi(req).then(response => {
                if (!response || !response.data) {
                    throw new Error("Save failed - no response data");
                }

                const newrects = originalRegions.map((item) => {
                    if (!item.isballooned) {
                        return { ...item, isballooned: true};
                    }
                    return item;
                })
                const draw = drawingRegions.map((item) => {
                    if (!item.isballooned) {
                        return { ...item, isballooned: true };
                    }
                    return item;
                })
                useStore.setState({
                    isLoading: false,
                    is_BalloonDrawingSaved: true,
                    drawingRegions: draw,
                    originalRegions: newrects,
                    draft: draft
                });
                return response.data;
            }, (error) => {
                console.log("Error", error);
                useStore.setState({ isLoading: false });
            }).catch(error => {
                console.log(error);
                useStore.setState({ isLoading: false });
            })
            , 50);
        return false;

    }
    
    handleZoomIn1 = (e) => {
        e.preventDefault();
        let state = useStore.getState();
  
        if (state.isErrImage) {
            return;
        }
        useStore.setState({ fitscreen: false });
        let scale = state.scaleStep + state.InitialScale ;
        let w = parseInt(state.bgImgW * scale, 10);
        let h = parseInt(state.bgImgH * scale, 10);
        // console.log(w, h, state.scaleStep , state.InitialScale)
        if (state.imageWidth > w && state.imageHeight > h) {
          //  return;
            useStore.setState({ isDisabledZoomIn: true });
            requestAnimationFrame(function () {
            let x = 0;
            let y = 0;
            if (w > state.win.width || h > state.win.height) {
                var padding = state.pad;
                let newwin = {
                    width: (w > state.win.width ? (w + (2 * padding)) : (state.win.width)),
                    height: (h > state.win.height ? (h + (2 * padding)) : (state.win.height))
                }
                useStore.setState({ win: newwin });
            }
            let newstate = useStore.getState();
                x = (newstate.win.width - w) / 2;
                y = (newstate.win.height - h) / 2;

                let zobj = {  bgImgScale: scale, bgImgW: w, bgImgH: h, bgImgX: x, bgImgY: y };
                useStore.setState({ history: [...state.history, zobj], ...zobj });
                let nstate = useStore.getState();
                let originalRegions = nstate.originalRegions;
                let newrect = newBalloonPosition(originalRegions, nstate);
                useStore.setState({
                    drawingRegions: newrect,
                    balloonRegions: newrect,
                    isDisabledZoomIn: false,
                });
                let scrollElement = document.querySelector('#konvaMain');
                scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
            });
           
        } else {
            let zobj = { isDisabledZoomIn: true };
            useStore.setState(zobj);
        }
    }

    handleZoomOut1 = (e) => {
        e.preventDefault();
        useStore.setState({ isDisabledZoomOut: true });
        let props = useStore.getState();
        if (props.isErrImage) {
            return;
        }
        
        if (props.history.length > 1) {
            let rem = props.history.slice(0, -1);
            let zobj = rem[rem.length - 1];
            let win = (zobj.bgImgW > initialState.win.width || zobj.bgImgH > initialState.win.height)
                ? { width: zobj.bgImgW, height: zobj.bgImgH }
                : { width: initialState.win.width, height: initialState.win.height };
            useStore.setState({ fitscreen: false, history: rem, ...zobj, win: win });
            let nstate = useStore.getState();
            let originalRegions = nstate.originalRegions;
            let newrect = newBalloonPosition(originalRegions, nstate);
            useStore.setState({
                drawingRegions: newrect,
                balloonRegions: newrect,
            });
            let scrollElement = document.querySelector('#konvaMain');
            scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
        } else {

            let nstate = useStore.getState();
            let nscale = nstate.scaleStep - nstate.InitialScale;
            let nw = parseInt(nstate.bgImgW * Math.abs(nscale ), 10);
            let nh = parseInt(nstate.bgImgH * Math.abs(nscale ), 10);
            let x1 = 0;
            let y1 = 0;

            if (nw > window.innerWidth || nh > window.innerHeight) {
                    let newwin = {
                        width: (nw > window.innerWidth ? (nw  ) : (window.innerWidth)),
                        height: (nh > window.innerHeight ? (nh  ) : (window.innerHeight))
                    }
                    x1 = (window.innerWidth - nw) / 2;
                    y1 = (window.innerHeight - nh) / 2;

                    useStore.setState({ win: newwin, bgImgScale: nscale, bgImgW: nw, bgImgH: nh, bgImgX: x1, bgImgY: y1 });
                    let scrollElement = document.querySelector('#konvaMain');
                    scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
                }

            this.fitToActualsize(e);
        }
        useStore.setState({ isDisabledZoomOut: false });
    }

    handleZoomIn = (e) => {
        e.preventDefault();
        const state = useStore.getState();
        if (state.isErrImage) return;

        const stage = this.props.stageRef.current;
        if (!stage) return;

        const scaleBy = 1.15;
        const oldScale = stage.scaleX();
        const newScale = Math.min(10, oldScale * scaleBy);

        // Zoom centered on stage center
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        const mousePointTo = {
            x: (centerX - stage.x()) / oldScale,
            y: (centerY - stage.y()) / oldScale,
        };
        stage.scale({ x: newScale, y: newScale });
        stage.position({
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        });
        stage.batchDraw();
        useStore.setState({ zoomed: true });
    }

    handleZoomOut = (e) => {
        e.preventDefault();
        const state = useStore.getState();
        if (state.isErrImage) return;

        const stage = this.props.stageRef.current;
        if (!stage) return;

        const scaleBy = 1.15;
        const oldScale = stage.scaleX();
        const newScale = Math.max(0.1, oldScale / scaleBy);

        // Zoom centered on stage center
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        const mousePointTo = {
            x: (centerX - stage.x()) / oldScale,
            y: (centerY - stage.y()) / oldScale,
        };
        stage.scale({ x: newScale, y: newScale });
        stage.position({
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        });
        stage.batchDraw();

        // If zoomed back to ~1x, reset zoomed flag
        if (Math.abs(newScale - 1) < 0.05) {
            useStore.setState({ zoomed: false });
        }
    }

    rotateRightBackgroundImage = (e) => {
        e.preventDefault();
        let { isErrImage, drawingDetails, drawingHeader, originalRegions, ItemView, bgImgRotation, sessionId } = useStore.getState();
        if (isErrImage) {
            return;
        }
        let view = ItemView;
        const ROTATE = 90;
        let CurrentItem = drawingDetails[ItemView].annotation;
        let drawingNo = drawingHeader[0].drawingNo;
        let revNo = drawingHeader[0].revision_No;
        let pageNo = 0;
        let totalPage = 0;
        let obj;
        if (drawingDetails.length > 0 && ItemView != null) {
            obj = Object.values(drawingDetails)[parseInt(ItemView)];
            pageNo = parseInt(obj.currentPage);
            totalPage = obj.totalPage;
        }
        const newrects = originalRegions.map((item) => {
            if (item.Page_No === pageNo) {
                return item;
            }
            return false;
        }).filter(item => item !== false);
        // if there is no ballloon on current page then process
        let rotation = bgImgRotation + ROTATE;
        if (newrects.length > 0) {
           // if (rotation === 360) { rotation = 0; }
         //   useStore.setState({
          //      bgImgRotation: rotation
         //   })
            // console.log(useStore.getState() )
            showAlert("Info","After Balloon Process Rotate Right is not allowed");
            return false;
        }
   
        let nrotation = drawingDetails[ItemView].rotation;
        rotation = parseInt(nrotation) + ROTATE;
        if (Math.sign(rotation) === -1 && Math.abs(rotation) === 90) { rotation = 270; }
        if (rotation === 360) { rotation = 0;  }
        let requestData = {
            ItemView: ItemView,
            drawingNo: drawingNo,
            revNo: revNo,
            drawingDetails: CurrentItem,
            pageNo: pageNo,
            totalPage: totalPage,
            sessionUserId: sessionId,
            rotation: rotation
        };
        //console.log(requestData)
        useStore.setState({ isLoading: true, loadingText: "Rotating an Image...", ItemView: null });
        rotateProcessApi(requestData).then(r => {
                return r.data;
            })
            .then(r => {
                let draw = drawingDetails.map((item) => {
                    if (item.currentPage.toString() === pageNo.toString() ) {
                        return { ...item, rotation: rotation };
                    }
                    return item;
                })
                //useStore.setState({ drawingDetails: draw, isLoading: true, loadingText: "Loading an Image...", ItemView: null });
                useStore.setState({ drawingDetails: draw, isLoading: true, loadingText: "Loading an Image...", ItemView: view });

                   // console.log(r,view)
                    
                return r; 

                }, (e) => {
                console.log("Error", e);
                useStore.setState({ isLoading: false });
            }).catch (e => {
                console.log("catch",e);
                useStore.setState({ isLoading: false });
            })
 
        // console.log(useStore.getState())

        let scrollElement = document.querySelector('#konvaMain');
        scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
        return false;
    };

    rotateLeftBackgroundImage = () => {
        let {isErrImage, drawingDetails, drawingHeader, originalRegions, ItemView, bgImgRotation, sessionId } = useStore.getState();
        if (isErrImage) {
            return;
        }
        let view = ItemView;
        const ROTATE = -90;
        let CurrentItem = drawingDetails[ItemView].annotation;
        let drawingNo = drawingHeader[0].drawingNo;
        let revNo = drawingHeader[0].revision_No;
        let pageNo = 0;
        let totalPage = 0;
        let obj;
        if (drawingDetails.length > 0 && ItemView != null) {
            obj = Object.values(drawingDetails)[parseInt(ItemView)];
            pageNo = parseInt(obj.currentPage);
            totalPage = obj.totalPage;
        }
        const newrects = originalRegions.map((item) => {
            if (item.Page_No === pageNo) {
                return item;
            }
            return false;
        }).filter(item => item !== false);
        // if there is no ballloon on current page then process
        let rotation = bgImgRotation + ROTATE;
        if (newrects.length > 0) {
            // if (rotation === 360) { rotation = 0; }
            //   useStore.setState({
            //      bgImgRotation: rotation
            //   })
            //  console.log(useStore.getState() )
            showAlert("Info", "After Balloon Process Rotate Left is not allowed");
            return false;
        }
        let nrotation = drawingDetails[ItemView].rotation;
        rotation = parseInt(nrotation) + ROTATE;
       
        if (Math.sign(rotation) === -1 && Math.abs(rotation) === 90) { rotation = 270; }
        if (rotation === 360) { rotation = 0; }
        let requestData = {
            ItemView: ItemView,
            drawingNo: drawingNo,
            revNo: revNo,
            drawingDetails: CurrentItem,
            pageNo: pageNo,
            totalPage: totalPage,
            sessionUserId: sessionId,
            rotation: rotation
        };
        //console.log(requestData)
        useStore.setState({ isLoading: true, loadingText: "Rotating an Image...", ItemView: null });
        rotateProcessApi(requestData).then(r => {
            return r.data;
        })
            .then(r => {
               // console.log(r, "left")
                let draw = drawingDetails.map((item) => {
                    if (item.currentPage.toString() === pageNo.toString()) {
                        return { ...item, rotation: rotation };
                    }
                    return item;
                })

                //useStore.setState({ drawingDetails: draw, isLoading: true, loadingText: "Loading an Image...", ItemView: null });
                useStore.setState({ drawingDetails: draw, isLoading: true, loadingText: "Loading an Image...", ItemView: view });

                //   console.log(r,view)

                return r;

            }, (e) => {
                console.log("Error", e);
                useStore.setState({ isLoading: false });
            }).catch(e => {
                console.log("catch", e);
                useStore.setState({ isLoading: false });
            })

       // console.log(useStore.getState())

        let scrollElement = document.querySelector('#konvaMain');
        scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
        return false;
    };

    fitToActualsize = (e) => {
        e.preventDefault();
        const stage = this.props.stageRef.current;
        stage.position({ x: 0, y: 0 });
        stage.scale({ x: 1, y: 1 });
        stage.batchDraw();
        actualSize();
    };

    fitToFullSize = (e) => {
        e.preventDefault();
        const stage = this.props.stageRef.current;
        stage.position({ x: 0, y: 0 });
        stage.scale({ x: 1, y: 1 });
        stage.batchDraw();
        fitSize();
    };

    resetBalloons = (e) => {
        e.preventDefault();
        const { originalRegions, ItemView, drawingDetails, selectedGridBalloons } = useStore.getState();
        let pageNo = 0;
        if (drawingDetails.length > 0 && ItemView !== null) {
            pageNo = parseInt(Object.values(drawingDetails)[parseInt(ItemView)].currentPage);
        }
        useStore.setState({ selectedRegion: "" })
        const check = originalRegions.filter(
            r => r.Page_No === pageNo
        );
        if (check.length === 0) {
            return;
        }

        const hasSelectedBalloons = selectedGridBalloons && selectedGridBalloons.length > 0;

        if (hasSelectedBalloons) {
            // Balloons are selected — ask user what to delete
            Swal.fire({
                title: 'Delete Balloons',
                html: `<p style="font-size:14px;">You have <b>${selectedGridBalloons.length}</b> balloon(s) selected.</p>
                       <p style="font-size:14px;">What would you like to delete?</p>`,
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Delete Selected',
                denyButtonText: 'Delete All',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#1e88e5',
                denyButtonColor: '#dc3545',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Delete only selected balloons
                    MultipleDelete(selectedGridBalloons);
                    useStore.setState({ selectedGridBalloons: [] });
                } else if (result.isDenied) {
                    // Delete all balloons on current page
                    resetBalloonsProcess();
                    useStore.setState({ selectedGridBalloons: [] });
                }
            });
        } else {
            // No balloons selected — confirm delete all
            Swal.fire({
                title: 'Are you sure you want to delete all balloons?',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete All',
                confirmButtonColor: '#dc3545',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    resetBalloonsProcess();
                }
            });
        }
    }

    deleteBalloon = (e) => {
        e.preventDefault();
        const state = useStore.getState();
        const { selectAnnotation, selectedGridBalloons, originalRegions, drawingRegions, ItemView, drawingDetails } = state;
        let pageNo = 0;
        if (drawingDetails.length > 0 && ItemView !== null) {
            pageNo = parseInt(Object.values(drawingDetails)[parseInt(ItemView)].currentPage);
        }
        const currentPageBalloons = originalRegions.filter(r => r.hasOwnProperty("newarr") && parseInt(r.Page_No) === parseInt(pageNo));
        if (currentPageBalloons.length === 0) {
            showAlert("Info", "No balloons on this page to delete.");
            return;
        }

        // Collect all selected balloons from any source
        let deleteItem = [];

        if (selectedGridBalloons && selectedGridBalloons.length > 0) {
            deleteItem = [...new Set([...deleteItem, ...selectedGridBalloons])];
        }

        if (selectAnnotation !== null && deleteItem.length === 0) {
            const selected = drawingRegions.filter(a => a.id === selectAnnotation);
            if (selected.length > 0) {
                deleteItem.push(parseInt(selected[0].Balloon));
            }
        }

        // If any balloons selected — delete directly with one confirm
        if (deleteItem.length > 0) {
            Swal.fire({
                title: `Delete ${deleteItem.length} balloon(s)?`,
                text: `Balloon(s): ${deleteItem.join(', ')}`,
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete',
                confirmButtonColor: '#dc3545',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    MultipleDelete(deleteItem);
                    useStore.setState({ selectAnnotation: null, selectedGridBalloons: [] });
                }
            });
            return;
        }

        // No balloons selected — show 2-option popup
        Swal.fire({
            title: 'Delete Balloons',
            html: `<p style="font-size:14px;margin-bottom:5px;">What would you like to delete?</p>`,
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'All Balloons',
            denyButtonText: 'Specific Balloons',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545',
            denyButtonColor: '#1e88e5',
            allowOutsideClick: false,
            allowEscapeKey: false,
            reverseButtons: false
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: `Delete all ${currentPageBalloons.length} balloons?`,
                    text: 'This action cannot be undone.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Delete All',
                    confirmButtonColor: '#dc3545',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((r) => {
                    if (r.isConfirmed) {
                        resetBalloonsProcess();
                        useStore.setState({ selectedGridBalloons: [] });
                    }
                });
            } else if (result.isDenied) {
                useStore.setState({ rightPanelOpen: true });
                Swal.fire({
                    toast: true,
                    position: 'top',
                    icon: 'info',
                    title: 'Select balloons from the table, then click Delete again',
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true
                });
            }
        });
    };

    reset = (e) => {
        e.preventDefault();
        let props = useStore.getState();
        const newrects = props.originalRegions.map((item) => {
            if (!item.isballooned) {
                return item;
            }
            return false;
        }).filter(item => item !== false);
        if ( newrects.length > 0) {
            if (!props.is_BalloonDrawingSaved) this.showAlertOnReset(props);
        } else {
            useStore.setState({
                ...initialState,
                draft: [],
                originalRegions: [], user: props.user, sessionId: props.sessionId
            });
        }
        return true;
    };

    showAlertOnReset = (props) => {
        Swal.fire({
            title: 'Are you want to Save changes?',
            showCancelButton: true,
            confirmButtonText: 'Save',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            /* Read more about isConfirmed */
            if (result.isConfirmed) {
                useStore.setState({ originalRegions: props.originalRegions });
                this.saveBalloons();
            } else {
                useStore.setState({
                    ...initialState, originalRegions: [],
                    draft: []
                });
            }
        })
    }

    render() {
        let state = useStore.getState();
        let { drawingDetails, ItemView, originalRegions } = state;
        let pageNo = 0;
        if (drawingDetails.length > 0 && ItemView != null) {
            pageNo = parseInt(Object.values(drawingDetails)[parseInt(ItemView)].currentPage);
        }
        const newrects = originalRegions.map((item) => {
            if (item.Page_No === pageNo) {
                return item;
            }
            return false;
        }).filter(item => item !== false);
       // console.log(state.selectedRegion)
        const r = (state.user[0].role === "Admin" || state.user[0].role === "Supervisor") ? true : false;
        return (
            <>
                <>
                    
               </>

                <div className="side-menu-tools " style={{ height: ((!state.fitscreen) ? this.state.height : state.win.height - 100) + "px" } }>
                    <Nav vertical className={this.state.width > 500 ? "p-1  justify-content-between no-select" : "p-1  justify-content-center no-select"}  >
                       
                        <Nav vertical className={classNames("", { "d-none": !r })} style={{padding:"0px 4px"} }>
                            <NavItem className="box d-none p-1 regions">
                                <select name="RegionTypes"
                                    onChange={this.selectedRegion}
                                    multiple={false}
                                    disabled={state.isDisabledRegion}
                                    value={state.selectedRegion}>
                                    <option value="Selected Region">Selected Region</option>
                                    <option value="Unselected Region">Unselected Region</option>
                                    <option value="Manual Drawn">Manual Drawn</option>
                                    <option value="Full Image" >Full Image</option>
                                    <option value="Spl" >SPL</option>

                                </select>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light"
                                    disabled={state.isDisabledAutoB}
                                    onClick={this.makeAutoballoon}
                                    //onTap={this.makeAutoballoon}
                                    onMouseOver={this.handleMouseOverAuto}
                                    onMouseOut={this.handleMouseOutAuto}
                                    className="light-btn FullProcess buttons primary"
                                    data-value="Full Image"
                                    active={state.selectedRegion === "Full Image" ? true : false}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft  EI48Lc" >
                                            Process
                                        </span>
                                    </div>
                                    <div className="play-button" style={{ position: "relative" }}>
                                        <> <Playbutton className="icon"></Playbutton> </>
                                    </div>
                                    <div className="play-button-white" style={{ position: "relative" }}>
                                        <><Image name='play-button-white.svg' className="icon" alt="Process" />  </>
                                    </div>

                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Process"}
                                </div>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light"
                                    disabled={state.isDisabledSelected}
                                    onClick={this.changeRegion}
                                    //onTap={this.changeRegion}
                                    onMouseOver={this.handleMouseOverSelected}
                                    onMouseOut={this.handleMouseOutSelected}
                                    className="light-btn SelectedRegion buttons primary"
                                    data-value="Selected Region"
                                    active={state.selectedRegion === "Selected Region" ? true : false}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc" /*aria-hidden={this.state.isHoveringSelected}*/ style={{ display: this.state.isHoveringSelected ? "none" : "none" }} >
                                            {this.state.isHoveringSelected && (
                                                "Balloon Region(s)"
                                            )}
                                        </span>
                                    </div>
                                    <div className="dotted-square" style={{ position: "relative" }}>
                                        <> <DottedSquare className="icon"></DottedSquare> </>
                                    </div>
                                    <div className="dotted-square-white" style={{ position: "relative" }}>
                                        <><Image name='dotted-square-white.svg' className="icon" alt="Balloon Region(s)" /> </>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Selected"}
                                </div>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light"
                                    disabled={state.isDisabledUnSelected}
                                    onClick={this.changeRegion}
                                    //onTap={this.changeRegion}
                                    onMouseOver={this.handleMouseOverUnSelected}
                                    onMouseOut={this.handleMouseOutUnSelected}
                                    className="light-btn UnselectedRegion buttons primary"
                                    data-value="Unselected Region"
                                    active={state.selectedRegion === "Unselected Region" ? true : false}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc"  >
                                                Unselected Region
                                        </span>
                                    </div>
                                    <div className="square-cross" style={{ position: "relative" }}>
                                        <> <SquareCross className="icon"></SquareCross> </>
                                    </div>
                                    <div className="square-cross-white" style={{ position: "relative" }}>
                                        <>  <Image name='square-cross-white.svg' className="icon" alt="Unselected Region" /> </>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Unselected"}
                                </div>
                            </NavItem>
                            <NavItem className="box">
                                <Button color="light "
                                    onClick={this.changeRegion}
                                    //onTap={this.changeRegion}
                                    disabled={state.isDisabledSPL}
                                    onMouseOver={this.handleMouseOverSPL}
                                    onMouseOut={this.handleMouseOutSPL}
                                    className="light-btn SPLBalloon primary buttons"
                                    data-value="Spl"
                                    active={state.selectedRegion === "Spl" ? true : false}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc" >
                                                SPL Balloon
                                        </span>
                                    </div>
         
                                    <div className="spl" style={{ position: "relative" }}>
                                        <SPLSVG className="icon"></SPLSVG>
                                    </div>
                                    <div className="spl-white" style={{ position: "relative" }}>
                                        <Image name='spl-white.svg' className="icon"  alt="SPL Balloon" />
                                    </div>


                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"SPL"}
                                </div>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light "
                                    onClick={this.resetBalloons}
                                    //onTap={this.resetBalloons}
                                    disabled={state.isDisabledResetB}
                                    onMouseOver={this.handleMouseOverResetB}
                                    onMouseOut={this.handleMouseOutResetB}
                                    className="light-btn ResetBalloons primary buttons"
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc">
                                            Reset Balloons
                                        </span>
                                    </div>
                                    <div className="reset" style={{ position: "relative" }}>
                                        <Reset className="icon"></Reset>
                                         </div>
                                    <div className="reset-white" style={{ position: "relative" }}>
                                        <Image name='reset-white.svg' className="icon" alt="Reset Balloons" />
                                     </div>


                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Reset"}
                                </div>
                            </NavItem>

                        </Nav>

                        <Nav className="d-none">
                        <Row>
                            <Col className="   text-right">
                                <div className="   text-right" style={{
                                    float: "right",
                                    "paddingTop": "4px"
                                    }}>
                                    <Nav>
                                        
                                          
                                            <Button color="light"
                                                disabled={state.isDisabledManual}
                                                onClick={this.changeRegion}
                                                //onTap={this.changeRegion}
                                                onMouseOver={this.handleMouseOverManual}
                                                onMouseOut={this.handleMouseOutManual}
                                                className="light-btn buttons primary"
                                                data-value="Manual Drawn"
                                            >
                                                <div style={{ position: "relative" }}>
                                                    <span className="PySCBInfo EI48Lc" /*aria-hidden={this.state.isHoveringManual}*/ style={{ display: this.state.isHoveringManual ? "block" : "none" }} >
                                                        {this.state.isHoveringManual && (
                                                            "Manual Drawn"
                                                        )}
                                                    </span>
                                                </div>
                                                {!this.state.isHoveringManual && (
                                                    <>
                                                        <div className="d-flex" style={{ fontSize: "16px" }}>
                                                        <Image name='manual_new.svg' className="icon-manual" alt="Manual Drawn" />
                                                         {"+"} 
                                                         </div>
                                                    </>
                                                )}
                                                {this.state.isHoveringManual && (
                                                    <>
                                                        <div className="d-flex" style={{ fontSize: "16px" }}>
                                                            <Image name='manual-new-white.svg' className="icon-manual" alt="Manual Drawn" />
                                                             {"+"} 
                                                        </div>
                                                    </>
                                                )}
                                                

                                            </Button>

                                            <Button color="light" className="light-btn buttons primary"
                                                onClick={this.saveBalloons}
                                                //onTap={this.saveBalloons}
                                            disabled={state.isDisabledSave}
                                            onMouseOver={this.handleMouseOverSave}
                                            onMouseOut={this.handleMouseOutSave}>
                                            <div style={{ position: "relative" }}>
                                                <span className="PySCBInfo EI48Lc" /*aria-hidden={this.state.isHoveringSave}*/ style={{ display: this.state.isHoveringSave ? "block" : "none" }} >
                                                    {this.state.isHoveringSave && (
                                                        "Save"
                                                    )}
                                                </span>
                                            </div>
                                            {!this.state.isHoveringSave && (<Image name='save.svg' className="icon" alt="Save" />)}
                                            {this.state.isHoveringSave && (<Image name='save-white.svg' className="icon" alt="Save" />)}

                                            </Button>

                                            <Button color="light" className="light-btn buttons primary"
                                                onClick={this.deleteBalloon}
                                                //onTap={this.deleteBalloon}
                                            disabled={state.isDisabledDel}
                                            onMouseOver={this.handleMouseOverDel}
                                            onMouseOut={this.handleMouseOutDel}>
                                            <div style={{ position: "relative" }}>
                                                <span className="PySCBInfo EI48Lc" /*aria-hidden={this.state.isHoveringDel}*/ style={{ display: this.state.isHoveringDel ? "block" : "none" }} >
                                                    {this.state.isHoveringDel && (
                                                        "Delete"
                                                    )}
                                                </span>
                                            </div>
                                            {!this.state.isHoveringDel && (<Image name='delete.svg' className="icon" alt="Delete"  />)}
                                            {this.state.isHoveringDel && (<Image name='delete-white.svg' className="icon" alt="Delete"   />)}
                                        </Button>
                                            
                                           
                                    </Nav>
                                </div>
                            </Col>
                        </Row>
                        </Nav>

                        <Nav vertical className="border-top" style={{ paddingLeft: "0px", marginTop:"10px" }}>

                            <NavItem className="box">
                                <Button color="light" className={classNames("light-btn buttons primary", { "active-toggle": useStore.getState().rightPanelOpen })}
                                    onClick={() => {
                                        const current = useStore.getState().rightPanelOpen;
                                        console.log("Table toggle clicked, current:", current, "setting to:", !current);
                                        useStore.setState({ rightPanelOpen: !current });
                                        this.forceUpdate();
                                    }}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc">
                                            {useStore.getState().rightPanelOpen ? "Hide Table" : "Show Table"}
                                        </span>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <i className="fa fa-table" style={{ fontSize: "20px" }}></i>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Table"}
                                </div>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light" className={classNames("light-btn buttons primary", { "active-toggle": useStore.getState().identifyMode !== 'off' })}
                                    onClick={() => {
                                        const current = useStore.getState().identifyMode;
                                        if (current === 'off') {
                                            useStore.setState({ identifyMode: 'all' });
                                        } else if (current === 'all') {
                                            useStore.setState({ identifyMode: 'selected' });
                                        } else {
                                            useStore.setState({ identifyMode: 'off' });
                                        }
                                        this.forceUpdate();
                                    }}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc">
                                            {(() => {
                                                const m = useStore.getState().identifyMode;
                                                return m === 'off' ? 'Identify All' : m === 'all' ? 'Identify Selected' : 'Hide Arrows';
                                            })()}
                                        </span>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <i className="fa fa-arrows-alt" style={{ fontSize: "20px" }}></i>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {(() => {
                                        const m = useStore.getState().identifyMode;
                                        return m === 'off' ? 'Identify' : m === 'all' ? 'All' : 'Selected';
                                    })()}
                                </div>
                            </NavItem>

                            {/* ─── Watermark Button ─── */}
                            <NavItem className="box" style={{ position: "relative" }}>
                                <Button color="light"
                                    className={classNames("light-btn buttons primary", { "active-toggle": (useStore.getState().watermark || {}).enabled })}
                                    onClick={() => {
                                        const wm = useStore.getState().watermark || {};
                                        useStore.setState({ watermark: { ...wm, _panelOpen: !wm._panelOpen } });
                                        this.forceUpdate();
                                    }}>
                                    <div style={{ position: "relative" }}>
                                        <i className="fa fa-tint" style={{ fontSize: "20px" }}></i>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">Watermark</div>

                                {/* Floating Watermark Panel */}
                                {(useStore.getState().watermark || {})._panelOpen && (
                                    <div style={{
                                        position: "absolute", left: "70px", top: "0", zIndex: 9999, width: "320px",
                                        background: "#fff", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,.18)",
                                        border: "1px solid #e0e0e0", padding: "16px", fontFamily: "Arial, sans-serif",
                                        maxHeight: "90vh", overflowY: "auto"
                                    }}>
                                        {/* Close button */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#333" }}>Watermark</span>
                                            <span onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, _panelOpen: false } }); this.forceUpdate(); }}
                                                style={{ cursor: "pointer", fontSize: "18px", color: "#999", lineHeight: 1 }}>&times;</span>
                                        </div>

                                        {/* Toggle ON/OFF */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "8px 10px", background: "#f8f9fa", borderRadius: "6px" }}>
                                            <span style={{ fontSize: "12px", fontWeight: "600" }}>Show Watermark</span>
                                            <div onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, enabled: !wm.enabled } }); this.forceUpdate(); }}
                                                style={{ width: "40px", height: "22px", borderRadius: "11px", cursor: "pointer",
                                                    background: (useStore.getState().watermark || {}).enabled ? "#0d6efd" : "#ccc", position: "relative", transition: "background .2s" }}>
                                                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px",
                                                    left: (useStore.getState().watermark || {}).enabled ? "20px" : "2px", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                                            </div>
                                        </div>

                                        {(useStore.getState().watermark || {}).enabled && (<>
                                        {/* Text */}
                                        <div style={{ marginBottom: "10px" }}>
                                            <input type="text" placeholder="Type watermark text..."
                                                style={{ width: "100%", padding: "8px 10px", fontSize: "13px", fontWeight: "600", textAlign: "center",
                                                    border: "1px solid #ddd", borderRadius: "6px", outline: "none" }}
                                                value={(useStore.getState().watermark || {}).text || ""}
                                                onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, text: e.target.value } }); this.forceUpdate(); }} />
                                        </div>

                                        {/* Quick presets */}
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginBottom: "10px" }}>
                                            {["DRAFT", "CONFIDENTIAL", "CONTROLLED", "APPROVED", "REJECTED", "SAMPLE", "FOR REVIEW", "COPY"].map(p => {
                                                const active = (useStore.getState().watermark || {}).text === p;
                                                return (<span key={p} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, text: p } }); this.forceUpdate(); }}
                                                    style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "8px", cursor: "pointer",
                                                        background: active ? "#0d6efd" : "#f0f0f0", color: active ? "#fff" : "#666",
                                                        fontWeight: active ? "700" : "400", border: "1px solid " + (active ? "#0d6efd" : "#e0e0e0") }}>{p}</span>);
                                            })}
                                        </div>

                                        {/* Size */}
                                        <div style={{ marginBottom: "8px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                                                <span style={{ fontSize: "10px", fontWeight: "600", color: "#888", textTransform: "uppercase" }}>Size</span>
                                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#333" }}>{(useStore.getState().watermark || {}).fontSize || 48}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <span onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontSize: Math.max(10, (wm.fontSize || 48) - 5) } }); this.forceUpdate(); }}
                                                    style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", fontWeight: "bold", userSelect: "none", border: "1px solid #ddd" }}>-</span>
                                                <input type="range" min="10" max="200" step="2" style={{ flex: 1 }}
                                                    value={(useStore.getState().watermark || {}).fontSize || 48}
                                                    onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontSize: parseInt(e.target.value) } }); this.forceUpdate(); }} />
                                                <span onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontSize: Math.min(200, (wm.fontSize || 48) + 5) } }); this.forceUpdate(); }}
                                                    style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", fontWeight: "bold", userSelect: "none", border: "1px solid #ddd" }}>+</span>
                                            </div>
                                        </div>

                                        {/* Visibility */}
                                        <div style={{ marginBottom: "10px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                                                <span style={{ fontSize: "10px", fontWeight: "600", color: "#888", textTransform: "uppercase" }}>Visibility</span>
                                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#333" }}>{Math.round(((useStore.getState().watermark || {}).opacity || 0.15) * 100)}%</span>
                                            </div>
                                            <input type="range" min="2" max="60" step="1" style={{ width: "100%" }}
                                                value={Math.round(((useStore.getState().watermark || {}).opacity || 0.15) * 100)}
                                                onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, opacity: parseInt(e.target.value) / 100 } }); this.forceUpdate(); }} />
                                        </div>

                                        {/* Angle */}
                                        <div style={{ marginBottom: "10px" }}>
                                            <span style={{ fontSize: "10px", fontWeight: "600", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Angle</span>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "3px" }}>
                                            {[{ l: "0\u00B0", v: 0 }, { l: "-15\u00B0", v: -15 }, { l: "-30\u00B0", v: -30 }, { l: "-45\u00B0", v: -45 }, { l: "30\u00B0", v: 30 }, { l: "45\u00B0", v: 45 }, { l: "90\u00B0", v: 90 }, { l: "-90\u00B0", v: -90 }].map(a => {
                                                const active = (useStore.getState().watermark || {}).rotation === a.v;
                                                return (<span key={"ang"+a.v} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, rotation: a.v } }); this.forceUpdate(); }}
                                                    style={{ fontSize: "10px", padding: "4px 0", borderRadius: "4px", cursor: "pointer", textAlign: "center",
                                                        background: active ? "#333" : "#f5f5f5", color: active ? "#fff" : "#666",
                                                        fontWeight: active ? "700" : "400", border: "1px solid " + (active ? "#333" : "#ddd") }}>{a.l}</span>);
                                            })}
                                            </div>
                                        </div>

                                        {/* Layout */}
                                        <div style={{ marginBottom: "10px" }}>
                                            <span style={{ fontSize: "10px", fontWeight: "600", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Layout</span>
                                            <div style={{ display: "flex", gap: "3px", justifyContent: "center" }}>
                                                {[{ l: "Diagonal", k: "diagonal" }, { l: "Repeat", k: "tiled" }, { l: "Single", k: "single" }].map(s => {
                                                    const active = (useStore.getState().watermark || {}).layout === s.k;
                                                    return (<span key={s.k} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, layout: s.k, customX: null, customY: null } }); this.forceUpdate(); }}
                                                        style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "4px", cursor: "pointer",
                                                            background: active ? "#0d6efd" : "#f5f5f5", color: active ? "#fff" : "#666",
                                                            fontWeight: active ? "700" : "400", border: "1px solid " + (active ? "#0d6efd" : "#ddd") }}>{s.l}</span>);
                                                })}
                                            </div>
                                            {(useStore.getState().watermark || {}).layout === "single" && (
                                                <div style={{ fontSize: "9px", color: "#0d6efd", textAlign: "center", marginTop: "3px", fontStyle: "italic" }}>Drag watermark on drawing to move</div>
                                            )}
                                        </div>

                                        {/* Color */}
                                        <div style={{ marginBottom: "8px" }}>
                                            <span style={{ fontSize: "10px", fontWeight: "600", color: "#888", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Color</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <input type="color" style={{ width: "28px", height: "22px", padding: "0", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
                                                    value={(useStore.getState().watermark || {}).color || "#888888"}
                                                    onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, color: e.target.value } }); this.forceUpdate(); }} />
                                                {[{ c: "#bbbbbb", n: "Light" }, { c: "#666666", n: "Dark" }, { c: "#cc0000", n: "Red" }, { c: "#0055aa", n: "Blue" }, { c: "#006600", n: "Green" }, { c: "#000000", n: "Black" }].map(o => (
                                                    <div key={o.c} title={o.n} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, color: o.c } }); this.forceUpdate(); }}
                                                        style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: o.c, cursor: "pointer",
                                                            border: (useStore.getState().watermark || {}).color === o.c ? "2px solid #0d6efd" : "1px solid #ddd" }} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Font row */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                                            <select style={{ flex: 1, fontSize: "11px", padding: "4px 6px", border: "1px solid #ddd", borderRadius: "4px" }}
                                                value={(useStore.getState().watermark || {}).fontFamily || "Arial"}
                                                onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontFamily: e.target.value } }); this.forceUpdate(); }}>
                                                <option value="Arial">Arial</option>
                                                <option value="Calibri">Calibri</option>
                                                <option value="Times New Roman">Times New Roman</option>
                                                <option value="Courier New">Courier New</option>
                                                <option value="Impact">Impact</option>
                                            </select>
                                            <span onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontWeight: wm.fontWeight === "bold" ? "normal" : "bold" } }); this.forceUpdate(); }}
                                                style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold",
                                                    background: (useStore.getState().watermark || {}).fontWeight === "bold" ? "#333" : "#f5f5f5",
                                                    color: (useStore.getState().watermark || {}).fontWeight === "bold" ? "#fff" : "#555", border: "1px solid #ddd" }}>B</span>
                                        </div>

                                        {/* Reset */}
                                        <div style={{ textAlign: "center" }}>
                                            <span onClick={() => { useStore.setState({ watermark: { ...useStore.getState().watermark, text: "DRAFT", fontSize: 48, color: "#888888", opacity: 0.15, rotation: -30, layout: "diagonal", fontFamily: "Arial", fontWeight: "bold", customX: null, customY: null } }); this.forceUpdate(); }}
                                                style={{ fontSize: "10px", color: "#999", cursor: "pointer", textDecoration: "underline" }}>Reset to defaults</span>
                                        </div>
                                        </>)}
                                    </div>
                                )}
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light" className="light-btn screen-size buttons primary"
                                    disabled={state.isDisabledACT}
                                    onMouseOver={this.handleMouseOverACT}
                                    onMouseOut={this.handleMouseOutACT}
                                    onClick={this.fitToActualsize}
                                    //onTap={this.fitToActualsize}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc"   >
                                                Screen Size
                                        </span>
                                    </div>
                                    
                                    <div className="actualsize" style={{ position: "relative" }}>
                                        <><ActualSize className="icon" ></ActualSize></>
                                    </div>
                                    <div className="actualsizewhite" style={{ position: "relative" }}>
                                    <><Image name='actual-size-white.svg' className="icon" alt="ActualSize" /></>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Screen Size"}
                                    <div className="btn-shortcut">Ctrl+1</div>
                                </div>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light" className="light-btn FitImage buttons primary"
                                    disabled={state.isDisabledFIT}
                                    onMouseOver={this.handleMouseOverFIT}
                                    onMouseOut={this.handleMouseOutFIT}
                                    onClick={this.fitToFullSize}
                                    //onTap={this.fitToFullSize}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc"  >
                                                FitImage
                                        </span>
                                    </div>
                                    <div className="fit-size" style={{ position: "relative" }}>
                                        <><FitSize className="icon"></FitSize></>
                                    </div>
                                    <div className="fit-size-white" style={{ position: "relative" }}>
                                        <><Image name='fit-size-white.svg' className="icon" alt="FitImage" /></>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Fit Screen"}
                                    <div className="btn-shortcut">Ctrl+0</div>
                                </div>
                            </NavItem>
                            
                            <NavItem className="box">
                                <Button color="light" className="light-btn RotateLeft buttons primary"
                                    disabled={state.isDisabledCCW}
                                    onMouseOver={this.handleMouseOverCCW}
                                    onMouseOut={this.handleMouseOutCCW}
                                    onClick={this.rotateLeftBackgroundImage}
                                    //onTap={this.rotateLeftBackgroundImage}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc" >
                                            {newrects.length === 0 && (
                                                "Rotate Left"
                                            )}
                                            {newrects.length > 0  && (
                                                "After Balloon Process Rotate Left is not allowed"
                                            )}
                                        </span>
                                    </div>
                                    <div className="RotateCCW" style={{ position: "relative" }}>
                                        <><Rotateccw className="icon"></Rotateccw></>
                                    </div>
                                    <div className="RotateCCW-white" style={{ position: "relative" }}>
                                    <><Image name='RotateCCW-white.svg' className="icon" alt="Rotate Left" /></>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Rotate Left"}
                                </div>
                            </NavItem>
                            <NavItem className="box">
                                <Button color="light" className="light-btn RotateRight buttons primary"
                                    disabled={state.isDisabledCW}
                                    onMouseOver={this.handleMouseOverCW}
                                    onMouseOut={this.handleMouseOutCW}
                                    onClick={this.rotateRightBackgroundImage}
                                    //onTap={this.rotateRightBackgroundImage}

                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc"  >
                                            {newrects.length === 0 && this.state.isHoveringCW && (
                                                "Rotate Right"
                                            )}
                                            {newrects.length > 0 && this.state.isHoveringCW && (
                                                "After Balloon Process Rotate Right is not allowed"
                                            )}
                                        </span>
                                    </div>
                                    <div className="RotateCW" style={{ position: "relative" }}>
                                        <><Rotatecw className="icon"></Rotatecw></>
                                    </div>
                                    <div className="RotateCW-white" style={{ position: "relative" }}>
                                        <><Image name='RotateCW-white.svg' className="icon" alt="Rotate Right" /></>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Rotate Right"}
                                </div>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light" className="light-btn ZoomIn buttons primary"
                                    disabled={state.isDisabledZoomIn}
                                    onMouseOver={this.handleMouseOverZoomIn}
                                    onMouseOut={this.handleMouseOutZoomIn}
                                    onClick={this.handleZoomIn}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc">
                                                Zoom In
                                        </span>
                                    </div>
                                    <div className="magnifier-plus" style={{ position: "relative" }}>
                                        <><MagnifierPlus className="icon"></MagnifierPlus></>
                                    </div>
                                    <div className="magnifier-plus-white" style={{ position: "relative" }}>
                                        <><Image name='magnifier-plus-white.svg' className="icon" alt="Zoom In" /></>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Zoom In"}
                                    <div className="btn-shortcut">Ctrl+=</div>
                                </div>
                            </NavItem>

                            <NavItem className="box">
                                <Button color="light" className="light-btn ZoomOut buttons primary"
                                    disabled={state.isDisabledZoomOut}
                                    onMouseOver={this.handleMouseOverZoomOut}
                                    onMouseOut={this.handleMouseOutZoomOut}
                                    onClick={this.handleZoomOut}
                                >
                                    <div style={{ position: "relative" }}>
                                        <span className="PySCBInfoleft EI48Lc">
                                                Zoom Out
                                        </span>
                                    </div>
                                    <div className="magnifier-minus" style={{ position: "relative" }}>
                                        <><MagnifierMinus className="icon"></MagnifierMinus></>
                                    </div>
                                    <div className="magnifier-minus-white" style={{ position: "relative" }}>
                                        <><Image name='magnifier-minus-white.svg' className="icon" alt="Zoom Out" /></>
                                    </div>
                                </Button>
                                <div className="apW" role="heading" aria-level="2">
                                    {"Zoom Out"}
                                    <div className="btn-shortcut">Ctrl+-</div>
                                </div>
                            </NavItem>
                            <>
                            </>
                        </Nav>
                        <>
                        </>

                    </Nav>
                     
                </div>
            </>
        );
    }
}
