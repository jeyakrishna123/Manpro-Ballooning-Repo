import React, { Component } from 'react';
import { NavbarBrand, Navbar, Button, Nav, NavItem } from 'reactstrap';
import { Link, Route, Routes } from 'react-router-dom';
import { Navbar as RBNavbar, Nav as RBNav, NavDropdown, Dropdown, Form } from 'react-bootstrap';
// import { SearchBox } from '../Tools/SearchBox';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FileUpload } from '../Upload/FileUpload';
import { Pagination } from '../Tools/Pagination';
import Image from '../Common/Image';
import * as Constants from '../Common/constants'
import { isMobile, isTablet, isDesktop }  from 'react-device-detect';
import './NavMenu.css';
import useStore from "../Store/store";
 import { v1 as uuid } from "uuid";
import classNames from "classnames";
import Swal from 'sweetalert2';
import { getDiff, showAlert, rearrangedPageBalloon, shortBalloon, newBalloonPosition, saveAllBalloonsApi, apiDownloadimages, apiDownloadRequest, recKey, orgKey, config, capitalizeKeys } from '../Common/Common';
import KonvaDownload from "../Canvas/KonvaDownload";
import { saveAs } from 'file-saver';
import { ReactComponent as ProjectIcon } from "../../assets/project-diagram.svg";
import Offcanvas from 'react-bootstrap/Offcanvas';
import { ReactComponent as ExxportIcon } from "../../assets/export.svg";
export class NavMenu extends Component {

    static displayName = NavMenu.name;
    constructor(props) {
        super(props);
        this.state = {
            userAgent: navigator.userAgent,
            isHoveringSave: false,
            templatetype: "",
            font: "0.775em",
            deviceType: this.getDeviceType(),
            show: false,
            setImages:[],
        };
        this.functionalRef = React.createRef();
        this.functionalDemoRef = React.createRef();
        this.toggleTopbar = this.toggleTopbar.bind(this);
        this.handleMouseOverSave = this.handleMouseOverSave.bind(this);
        this.handleMouseOutSave = this.handleMouseOutSave.bind(this);
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
    componentDidMount() {
        // Add an event listener to handle user agent changes (e.g., resizing or toggling device toolbar)
        window.addEventListener("resize", this.updateDeviceInfo);
        window.addEventListener("resize", this.handleResize);
    }

    componentWillUnmount() {
        // Remove the event listener to prevent memory leaks
        window.removeEventListener("resize", this.updateDeviceInfo);
        window.removeEventListener("resize", this.handleResize);
    }

    updateDeviceInfo = () => {
        this.setState({ userAgent: navigator.userAgent });
    };
    toggleTopbar() { useStore.setState({ topbarIsOpen: !useStore.getState().topbarIsOpen }); }
    handleMouseOverSave() { this.setState({ isHoveringSave: true }); }
    handleMouseOutSave() { this.setState({ isHoveringSave: false }); }

    SaveBalloonDetails = async () => {
        let rescale = [];
        const {  originalRegions, partial_image } = useStore.getState();
        const clonedArray = originalRegions.map(item => ({ ...item }));
        const ballonDetails = clonedArray.map((item) => {
            let pageIndex = item.Page_No - 1;
            let superScale = partial_image.filter((a) => {
                return a.item === parseInt(pageIndex);
            });
            rescale[pageIndex] = (superScale[0].scale);

            if (item.hasOwnProperty("newarr")) {
                let x = parseInt(item.newarr.Crop_X_Axis * rescale[pageIndex]);
                let y = parseInt(item.newarr.Crop_Y_Axis * rescale[pageIndex]);
                let w = parseInt(item.newarr.Crop_Width * rescale[pageIndex]);
                let h = parseInt(item.newarr.Crop_Height * rescale[pageIndex]);
                let cx = parseInt(item.newarr.Circle_X_Axis * rescale[pageIndex]);
                let cy = parseInt(item.newarr.Circle_Y_Axis * rescale[pageIndex]);
                let mx = parseInt(item.newarr.Measure_X_Axis * rescale[pageIndex]);
                let my = parseInt(item.newarr.Measure_Y_Axis * rescale[pageIndex]);
                item.x = x;
                item.y = y;
                item.width = w;
                item.height = h;
                item.Crop_X_Axis = x;
                item.Crop_Y_Axis = y;
                item.Crop_Width = w;
                item.Crop_Height = h;
                item.Circle_X_Axis = cx;
                item.Circle_Y_Axis = cy;
                item.Measure_X_Axis = mx;
                item.Measure_Y_Axis = my;
            }
            let b = item.Balloon.toString();
            item.Balloon = b.replaceAll(".", "-");
            item.Balloon_Text_FontSize = 12;
            return { ...item, isballooned: true, selectedRegion: "" };
        });
        return ballonDetails;
    }

    SaveSettingsDetails = async () => {

        let Settings = {}
             let state1 = useStore.getState();

            Settings = Object.assign(Settings, {
                DefaultBalloon: state1.defaultPicker,
                ErrorBalloon: state1.errorPicker,
                SuccessBalloon: state1.successPicker,
                BalloonShape: state1.balloonShape,
                MinMaxOneDigit: state1.MinMaxOneDigit,
                MinMaxTwoDigit: state1.MinMaxTwoDigit,
                MinMaxThreeDigit: state1.MinMaxThreeDigit,
                MinMaxFourDigit: state1.MinMaxFourDigit,
                MinMaxAngles: state1.MinMaxAngles,
                Routerno: state1.routerno,
                MaterialQty: state1.MaterialQty,
                DrawingNo: state1.drawingHeader[0].drawingNo,
                RevNo: state1.drawingHeader[0].revision_No,
                convert: state1.Convert_to_mm,
                fontScale: state1.fontScale,
                watermark: state1.watermark,
            });
 
        return Settings;
    }

    SaveImages = async () => {
        let req = {}
        await setTimeout(() => {
            if (this.functionalRef.current) {
                const result = this.functionalRef.current.callMethod();
                useStore.setState({ showdownloadComponent: false });
                req.convertStagesToImages = result;
            }
           
        }, 2500);
        return req;
    }

    saveBalloons = async (e) => {
        e.preventDefault();
        const { sessionId, drawingDetails, drawingHeader, ItemView, partial_image,  routerno, controllCopy, MaterialQty } = useStore.getState();
        useStore.setState({ showdownloadComponent: false });
        let drawingNo = drawingHeader[0].drawingNo;
        let revNo = drawingHeader[0].revision_No;
        let pageNo = 0;
        let totalPage = 0;
        let rotate;
        if (drawingDetails.length > 0 && ItemView != null) {
            pageNo = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
            totalPage = Object.values(drawingDetails)[parseInt(ItemView)].totalPage;
            rotate = drawingDetails.map((item) => {
                return item.rotation;

            });
        }
   
        const ballonDetails = await this.SaveBalloonDetails();
        const groupedData = ballonDetails.reduce((acc, curr) => {
            const { Page_No } = curr;
            if (!acc[Page_No]) {
                acc[Page_No] = [];
            }
            acc[Page_No].push(curr);
            return acc;
        }, {});
        const renderedPages = Object.keys(groupedData).map(a => a);
        const orgPages = Object.values(drawingDetails).map(a => a.currentPage);
        const difference = getDiff(renderedPages, orgPages);

        if (difference.length > 0) {
            let pageNumbers = [...new Set(difference.map(a => a))].sort().join(', ');
            showAlert("Error", `<p>Balloon not created on Page ${pageNumbers}</p>`);
            return;
        }

        let placed = controllCopy.filter((a) => {
            return a.textGroupPlaced === true;
        }).map(item => item.pageNo.toString())

        const textGroupPlaced = getDiff(placed, orgPages);
        //console.log(placed, orgPages, textGroupPlaced)

        if (parseInt(totalPage) !== controllCopy.length || textGroupPlaced.length > 0) {
            useStore.setState({ isLoading: false });
            this.setState({ templatetype: "" });
            useStore.setState({ templatetype: "" });
 
            let pageNumbers = [...new Set(textGroupPlaced.map(item => item))].sort().join(', ');
            showAlert("Error", `<p>Missed Placing of Ctl Copy on Page ${pageNumbers}</p>`);
            useStore.setState({ isLoading: false });
            
            return;
        }

        useStore.setState({ isLoading: true, loadingText: "Saving Balloon... Please Wait..." });
        const Settings = await this.SaveSettingsDetails();

        let req = {};
        
        
        await setTimeout(() => {
                  setTimeout( async() => {

                    
                    req.drawingNo = drawingNo;
                    req.revNo = revNo;
                    req.pageNo = pageNo;
                    req.totalPage = totalPage;
                    req.Routerno = routerno;
                    req.Settings = Settings;
                    req.controllCopy = controllCopy;
                    req.ballonDetails = ballonDetails;
                    req.rotate = JSON.stringify(rotate);
                    req.MaterialQty = parseInt(MaterialQty);
                    req.session_UserId = sessionId;
                      useStore.setState({ selectedRowIndex: null });
                      if (config.console)
                          console.log("saveAllBalloonsApi", req)
                      //useStore.setState({ isLoading: false });
                      //return false;
                      await saveAllBalloonsApi(req).then(r => {
                        if (!r || !r.data) {
                            useStore.setState({ isLoading: false, showdownloadComponent: false });
                            showAlert("Error", "Save failed. Server did not return data. Please try again.");
                            return Promise.reject("No data returned");
                        }
                        return r.data;
                    })
                        .then(async (r) => {
                            if (config.console)
                            console.log(r, "saveAllBalloonsApi")
                            this.setState({ templatetype: "" });
                            if (r.length > 0) {
                                
                                let rescale = [];
                                const clonedArrayorigin = partial_image.map(item => ({ ...item }));
                                 //console.log("saved data", r)
                                r = r.map((item, index) => {
                                    if (item.hasOwnProperty("drawLineID")) {
                                        delete item.drawLineID;
                                    }
                                    item.balloon = item.balloon.replaceAll("-", ".");
                                    item.isSaved = true;
                                    let pageIndex = item.page_No - 1;
                                    let superScale = clonedArrayorigin.filter((a) => {
                                        return a.item === parseInt(pageIndex);
                                    });
                                    rescale[pageIndex] = (superScale[0].scale);

                                    item.circle_X_Axis = parseInt(item.circle_X_Axis / rescale[pageIndex]);
                                    item.circle_Y_Axis = parseInt(item.circle_Y_Axis / rescale[pageIndex]);
                                    item.crop_Height = parseInt(item.crop_Height / rescale[pageIndex]);
                                    item.crop_Width = parseInt(item.crop_Width / rescale[pageIndex]);
                                    item.crop_X_Axis = parseInt(item.crop_X_Axis / rescale[pageIndex]);
                                    item.crop_Y_Axis = parseInt(item.crop_Y_Axis / rescale[pageIndex]);
                                    item.measure_X_Axis = parseInt(item.measure_X_Axis / rescale[pageIndex]);
                                    item.measure_Y_Axis = parseInt(item.measure_Y_Axis / rescale[pageIndex]);

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
                                // Don't clear balloon data here — let the final setState replace it
                                // to avoid balloons disappearing during re-processing
                                useStore.setState({ templatetype: "" });

                                //clone a array of object
                                const oversearchData = JSON.parse(JSON.stringify(r));

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

                                // console.log("oversearchDataSingle",  unique, groupOverSingle  )
                                // useStore.setState({ isLoading: false })
                                // return;
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
                                //return false;
                                let newrects = newitems.map((item, ind) => {
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

                                if (config.console)
                                    console.log(newrects)
                                const newstate = useStore.getState();
                                newrects = rearrangedPageBalloon(newrects);
                                let newrect = newBalloonPosition(newrects, newstate);
                                //console.log("saved data org", newrects, newPositionBAlloon)
                                useStore.setState({
                                    originalRegions: newrects,
                                    draft: newrects,
                                    savedDetails: ((newrects.length > 0) ? true : false),
                                    drawingRegions: newrect,
                                    balloonRegions: newrect
                                });

          

                            } else {
                                useStore.setState({
                                    originalRegions: [],
                                    draft: [],
                                    drawingRegions: [],
                                    balloonRegions: []
                                });
                            }
                            useStore.setState({ isLoading: false });
                            this.setState({ isHoveringSave: false });

                        }, (error) => {
                            console.log("Error", error);
                            useStore.setState({ isLoading: false });
                        }).catch(error => {
                            console.log(error);
                            useStore.setState({ isLoading: false });
                        })
                  }, 500);

                const state = useStore.getState();

                  setTimeout(() => {
                    useStore.setState({ ItemView: null });
                  }, 200);

                  setTimeout(() => {
                    useStore.setState({ ItemView: state.ItemView });
                  }, 200);

            });
        return true;
    }

    saveAndExportBalloons = async (e) => {
        e.preventDefault();
        const { sessionId, drawingDetails, drawingHeader, ItemView, partial_image, templatetype, routerno, controllCopy, MaterialQty } = useStore.getState();

        let drawingNo = drawingHeader[0].drawingNo;
        let revNo = drawingHeader[0].revision_No;
        let pageNo = 0;
        let totalPage = 0;
        let rotate;
        if (drawingDetails.length > 0 && ItemView != null) {
            pageNo = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
            totalPage = Object.values(drawingDetails)[parseInt(ItemView)].totalPage;
            rotate = drawingDetails.map((item) => {
                return item.rotation;
            });
        }

        if (!config.Demo && templatetype === "") {
            useStore.setState({ isLoading: false });
            showAlert("Error", `<p>Select a Template to process.</p>`);
            return;
        }

        const ballonDetails = await this.SaveBalloonDetails();
        const groupedData = ballonDetails.reduce((acc, curr) => {
            const { Page_No } = curr;
            if (!acc[Page_No]) {
                acc[Page_No] = [];
            }
            acc[Page_No].push(curr);
            return acc;
        }, {});
        const renderedPages = Object.keys(groupedData).map(a => a);
        const orgPages = Object.values(drawingDetails).map(a => a.currentPage);
        const difference = getDiff(renderedPages, orgPages);

        if (difference.length > 0) {
            let pageNumbers = [...new Set(difference.map(a => a))].sort().join(', ');
            showAlert("Error", `<p>Balloon not created on Page ${pageNumbers}</p>`);
            return;
        }

        let placed = controllCopy.filter((a) => {
            return a.textGroupPlaced === true;
        }).map(item => item.pageNo.toString())

        const textGroupPlaced = getDiff(placed, orgPages);
       console.log("undefined",placed, orgPages, textGroupPlaced)

        if (parseInt(totalPage) !== controllCopy.length || textGroupPlaced.length > 0) {
            useStore.setState({ isLoading: false });
            this.setState({ templatetype: "" });
            useStore.setState({ templatetype: "" });

            let pageNumbers = [...new Set(textGroupPlaced.map(item => item))].sort().join(', ');
            showAlert("Error", `<p>Missed Placing of Ctl Copy on Page ${pageNumbers}</p>`);
            useStore.setState({ isLoading: false });
            this.setState({ templatetype: "" });
            useStore.setState({ templatetype: "" });
            return;
        }
            let BASE_URL = process.env.REACT_APP_SERVER || '';
            let url = `${BASE_URL}/api/fileupload/FetchDrawing`;
            useStore.setState({ isLoading: true, loadingText: "Fetching drawing images..." });

            let fetchFailed = false;
            try {
                const res = await apiDownloadimages(url, { drawingNo: drawingNo, revNo: revNo, Routerno: routerno, session_UserId: sessionId, templatetype: "" });
                const imageBlobs = (res?.data?.images || []).map((img) => ({
                    fileName: img?.fileName || 'unknown.jpg',
                    url: img?.base64 ? `data:image/jpeg;base64,${img.base64}` : '',
                }));
                if (imageBlobs.length === 0) {
                    useStore.setState({ isLoading: false });
                    showAlert("Error", "No drawing images found for export.");
                    return;
                }
                useStore.setState({ setImages: imageBlobs });
                this.setState({ setImages: [...this.state.setImages, imageBlobs] });
            } catch (err) {
                console.error("FetchDrawing error:", err);
                useStore.setState({ isLoading: false });
                showAlert("Error", "Failed to fetch drawing images. Please try again.");
                return;
            }

        useStore.setState({ loadingText: "Generating export images..." });

        const Settings = await this.SaveSettingsDetails();

        let req = {};

        // Trigger KonvaDownload to render stages
        useStore.setState({ showdownloadComponent: true });

        // Wait for KonvaDownload to render — poll every 200ms, max 5s
        const ref = config.Demo ? this.functionalDemoRef : this.functionalRef;
        let retries = 0;
        const maxRetries = 25;
        while (retries < maxRetries) {
            await new Promise(r => setTimeout(r, 200));
            if (ref.current) {
                try {
                    req.convertStagesToImages = ref.current.callMethod();
                    if (req.convertStagesToImages && req.convertStagesToImages.length > 0) break;
                } catch (e) { /* stage not ready yet */ }
            }
            retries++;
        }

        if (!req.convertStagesToImages || req.convertStagesToImages.length === 0) {
            useStore.setState({ isLoading: false, showdownloadComponent: false });
            showAlert("Error", "Failed to generate export images. Please try again.");
            return;
        }

        useStore.setState({ loadingText: "Saving balloons & generating zip..." });

        try {
                req.drawingNo = drawingNo;
                req.revNo = revNo;
                req.pageNo = pageNo;
                req.totalPage = totalPage;
                req.Routerno = routerno;
                req.Settings = Settings;
                req.controllCopy = controllCopy;
                req.ballonDetails = ballonDetails;
                req.rotate = JSON.stringify(rotate);
                req.MaterialQty = parseInt(MaterialQty);
                req.session_UserId = sessionId;
                useStore.setState({ selectedRowIndex: null });

                const saveRes = await saveAllBalloonsApi(req);
                if (!saveRes || !saveRes.data) {
                    useStore.setState({ isLoading: false, showdownloadComponent: false });
                    showAlert("Error", "Export failed. Server did not return data. Please try again.");
                    return;
                }

                let r = saveRes.data;
                if (!r || r.length === 0) {
                    useStore.setState({ isLoading: false, showdownloadComponent: false });
                    showAlert("Error", "No balloon data returned from server.");
                    return;
                }

                // Download zip
                useStore.setState({ loadingText: "Downloading zip file..." });

                let downloadUrl = BASE_URL + "/api/fileupload/Download";
                let requestData = {
                    drawingNo: drawingNo,
                    revNo: revNo,
                    templatetype: config.Demo ? "Demo" : templatetype,
                    MaterialQty: parseInt(MaterialQty),
                    session_UserId: sessionId,
                    Routerno: routerno,
                };

                try {
                    const dlRes = await apiDownloadRequest(downloadUrl, requestData);
                    useStore.setState({ templatetype: "" });
                    let blobUrl = window.URL.createObjectURL(new Blob([dlRes.data]));
                    saveAs(blobUrl, `${drawingNo}${revNo}${templatetype}.zip`);
                } catch (dlErr) {
                    console.error("Download API error:", dlErr);
                    useStore.setState({ isLoading: false, showdownloadComponent: false });
                    showAlert("Error", "Failed to download the zip file. Please try again.");
                    return;
                }

                // Update state with saved data
                this.setState({ templatetype: "" });
                {
                            let rescale = [];
                            const clonedArrayorigin = partial_image.map(item => ({ ...item }));
                            //console.log("saved data", r)
                            r = r.map((item, index) => {
                                if (item.hasOwnProperty("drawLineID")) {
                                    delete item.drawLineID;
                                }
                                item.balloon = item.balloon.replaceAll("-", ".");
                                item.isSaved = true;
                                let pageIndex = item.page_No - 1;
                                let superScale = clonedArrayorigin.filter((a) => {
                                    return a.item === parseInt(pageIndex);
                                });
                                rescale[pageIndex] = (superScale[0].scale);

                                item.circle_X_Axis = parseInt(item.circle_X_Axis / rescale[pageIndex]);
                                item.circle_Y_Axis = parseInt(item.circle_Y_Axis / rescale[pageIndex]);
                                item.crop_Height = parseInt(item.crop_Height / rescale[pageIndex]);
                                item.crop_Width = parseInt(item.crop_Width / rescale[pageIndex]);
                                item.crop_X_Axis = parseInt(item.crop_X_Axis / rescale[pageIndex]);
                                item.crop_Y_Axis = parseInt(item.crop_Y_Axis / rescale[pageIndex]);
                                item.measure_X_Axis = parseInt(item.measure_X_Axis / rescale[pageIndex]);
                                item.measure_Y_Axis = parseInt(item.measure_Y_Axis / rescale[pageIndex]);

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
                            useStore.setState({
                                templatetype: "",
                                originalRegions: [],
                                draft: [],
                                drawingRegions: [],
                                balloonRegions: []
                            });

                            const oversearchData = JSON.parse(JSON.stringify(r));

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
                            //return false;
                            let newrects = newitems.map((item, ind) => {
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

                            if (config.console)
                                console.log(newrects)
                            const newstate = useStore.getState();
                            newrects = rearrangedPageBalloon(newrects);
                            let newrect = newBalloonPosition(newrects, newstate);
                            //console.log("saved data org", newrects, newPositionBAlloon)
                            useStore.setState({
                                originalRegions: newrects,
                                draft: newrects,
                                savedDetails: ((newrects.length > 0) ? true : false),
                                drawingRegions: newrect,
                                balloonRegions: newrect
                            });

                }

                useStore.setState({ isLoading: false });
                this.setState({ isHoveringSave: false });

        } catch (error) {
            console.error("Export error:", error);
            useStore.setState({ isLoading: false, showdownloadComponent: false });
            showAlert("Error", "Export failed unexpectedly. Please try again.");
        }

        const state = useStore.getState();
        useStore.setState({ showdownloadComponent: false });
        setTimeout(() => { useStore.setState({ ItemView: null }); }, 200);
        setTimeout(() => { useStore.setState({ ItemView: state.ItemView }); }, 400);

        return true;
    }

    onSelect = (eventKey, event) => {
        event.preventDefault();
        event.persist();
        event.stopPropagation();
        console.log(eventKey) // selected event will trigger
    }

    logout = (e) => {
        e.preventDefault();
        Swal.fire({
            title: "Do you want to exit from App?",
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: "Yes",
            denyButtonText: `No`,
            allowOutsideClick: false,
            allowEscapeKey:false
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('roles');
                window.location.assign('/login');
            }  
        });
    }

    renderDownloadField() {
        let state = useStore.getState();
        const { templatetype } = this.state;
        const showdownloadComponent = (state.showdownloadComponent === true) ? true : false;
        //console.log(templatetype,"templatetype")
        return (
            <div className="dropdown-menu" aria-labelledby="dropdownMenuLink">
            <Dropdown.Header size="sm">Choose the Template Format</Dropdown.Header>
            <div className="dropdown-item">
                <Form.Select
                    size="sm"
                    id="templatetype"
                    name="templatetype"
                    value={templatetype}
                    onChange={(e) => {
                        this.setState({ templatetype: e.target.value });
                        useStore.setState({ templatetype: e.target.value });
                    }}
                >
                    <option key={"default_template"} value="">Select Export Format</option>
                    {state.exportTemplate.map((item, i) => (
                        <option key={i}
                            value={item.name}
                        >
                            {item.name}
                        </option>
                    ))};
                </Form.Select>
            </div>
            <Dropdown.Divider />
            <div className="d-flex m-auto justify-content-center dropdown-item">
                <Button color="light" className={classNames("light-btn buttons Savebtn primary", { "primary_hover": state.drawingDetails.length > 0 })}
                    onClick={this.saveAndExportBalloons}
                    disabled={(state.drawingDetails.length > 0 && state.originalRegions.length > 0) ? false : true}
                    onMouseOver={this.handleMouseOverSave}
                    onMouseOut={this.handleMouseOutSave}
                    style={{ "height": "35px", width: "100%" }}
                >
                    <div style={{ position: "relative" }}>
                        <span className="PySCBInfobottom EI48Lc d-none" style={{ left: "auto" }}   >
                            Download
                        </span>
                    </div>
                    <div className="gb_be gb_ae" style={{ display: "contents", textAlign: "center", "flexWrap": "nowrap", "flexDirection": "row", "alignItems": "center" }}> &nbsp; Download &nbsp; </div>

                    </Button>
            </div>
            </div>
        );
    }

    render() {
        const { deviceType } = this.state;
        let state = useStore.getState();
        let originalRegions = state.originalRegions;
        let pageNo = 0;

        if (state.drawingDetails.length > 0 && state.ItemView != null) {
            pageNo = parseInt(Object.values(state.drawingDetails)[parseInt(state.ItemView)].currentPage);
        }

        const newrects = originalRegions.map((item) => {
            if (!item.hasOwnProperty("newarr")) {
                return false;
            }
            if (item.Page_No === pageNo) {

                return item;
            }
            return false;
        }).filter(item => item !== false);
        const showdownloadComponent = (state.showdownloadComponent === true) ? true : false;
        if (config.console)
        console.log(newrects, this.state.userAgent, deviceType, isMobile.toString(), isTablet.toString(), isDesktop.toString());
            return (
                    <div className="nH w-asV bbg aiw container-fluid p-0" >
                        <div style={{position:"absolute",left:"-9999px",top:0}}><KonvaDownload ref={this.functionalRef} /></div>
                        <div className="nH oy8Mbf qp">
                            <header style={{ position: "sticky" }} className="gb_Ka gb_bb" >
                                <div className="gb_ld gb_fd gb_Jc">
                                    <div className="gb_kd gb_ad gb_bd" style={{ "minWidth": deviceType !=='desktop' ? "0px" : "238px"}}>
                                        <div className="wR3cXd">&nbsp;</div>

                                        <div className="gb_Ac" >
                                            <div className="gb_Bc gb_3d">
                                                <NavbarBrand tag={Link} to="/" className="gb_2d gb_Cc gb_0d">
                                                    {(Constants.APP_LOGO === '') &&
                                                       
                                                        <div className="applogodefault">
                                                            <Image name={Constants.APP_DEFAULT_LOGO} alt={Constants.APP_NAME} title={Constants.APP_NAME} className="gb_Hc" style={{ height: (!config.Demo ? "50px" : "60px") }} />
                                                            <div className="logotext">
                                                                {Constants.APP_COMPANY}
                                                            </div> 
                                                        </div> 
                                                    }
                                                    {(Constants.APP_LOGO !== '') &&
                                                        <Image name={Constants.APP_LOGO} alt={Constants.APP_NAME} title={Constants.APP_NAME} className="gb_Hc" style={{ height: (!config.Demo ? "50px" : "60px") }} />
                                                    }
                                                </NavbarBrand>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="gb_kd gb_ud gb_ze gb_Me gb_Re" style={{ marginLeft:   "inherit"  }}>
                                        <div className="gb_be gb_ae">
                                        </div>
                                        <div className="gb_ye">
                                            <div className="searchBox">
                                              
                                                <Routes >
                                                    <Route exact path="/"                                                      
                                                        element={<FileUpload saveBalloons={this.saveBalloons}
                                                            handleMouseOverSave={this.handleMouseOverSave}
                                                            handleMouseOutSave={this.handleMouseOutSave}
                                                            stageRef={this.props.stageRef}
                                                         />} />
                                                </Routes>                                             
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {state.drawingDetails.length > 0 && window.location.pathname === '/' && (                                        
                                            <Nav style={{ margin: "0px  0 0  0", padding: "12px 0 0 0 " }} >
                                                <NavItem className="box" style={{ margin: "auto", cursor: (state.drawingDetails.length > 0 && state.originalRegions.length > 0) ? 'pointer' : 'not-allowed' }} >
                                                    <Dropdown className=" mx-2" autoClose="outside">
                                                        <Button color="light" data-bs-toggle="dropdown" aria-expanded="false" className={classNames("light-btn buttons Savebtn exportbtn primary dropdown-toggle", { "primary_hover": state.drawingDetails.length > 0 })}
                                                            onClick={(e) => {
                                                                     this.setState({ templatetype: "" });
                                                                    useStore.setState({ templatetype: "" });
                                                            }}
                                                            disabled={(state.drawingDetails.length > 0 && state.originalRegions.length > 0) ? false : true}
                                                            onMouseOver={this.handleMouseOverSave}
                                                            onMouseOut={this.handleMouseOutSave}
                                                            style={{ alignItems: "center","display": "flex", "height": "28px", cursor: (state.drawingDetails.length > 0 && state.originalRegions.length > 0) ? 'pointer' : 'not-allowed' }}
                                                        >
                                                            <div style={{ position: "relative" }}>
                                                                <span className="PySCBInfobottom EI48Lc" style={{ left: "auto" }}   >
                                                                    Export
                                                                </span>
                                                            </div>
                                                            <div className="gb_be gb_ae" style={{ display: "contents" }}>
                                                                <ExxportIcon className="icon svg-container-selected"  />
                                                                Export
                                                            </div> 

                                                        </Button>
                                                        {!config.Demo && this.renderDownloadField()}
                                                        <div className="dropdown-menu d-none" aria-labelledby="dropdownMenuLink">
                                                            {config.Demo && showdownloadComponent && (<><div key="konvaDownload" className="d-none"><KonvaDownload ref={this.functionalDemoRef} /></div> </>)}
                                                        </div>
                                                    </Dropdown>
                                                </NavItem>
                                            </Nav>
                                    )}
                                    <div className={"d-flex"} style={{ display: deviceType === 'desktop' ? "none" : "", marginLeft: window.location.pathname === '/' ? "0px" : "auto" ,} }>
                                        <Navbar style={{ display: deviceType === 'desktop' ? "none" : "", marginLeft: "auto", float: "inherit"}} className="p-0" container={false } >
                                        {state.drawingDetails.length > 0 && window.location.pathname === '/' && (
                                            <div className="gb_kd gb_ud gb_ze gb_Me gb_Re" style={{ margin: "0  0px 0  0", paddingTop:"10px" }}>
                                            <div className="gb_be gb_ae"></div>
                                            <div className="gb_ye">
                                                <div className="searchBox">
                                                    <Routes >
                                                        <Route exact path="/" element={<Pagination
                                                            {...state} />} />
                                                    </Routes>
                                                    
                                                </div>
                                            </div>
                                            </div>
                                            )}
                                       
                                        </Navbar>
                                        <div className="gb_kd gb_ud gb_ze gb_Me gb_Re" style={{ margin: "0  0px 0  0", marginTop:"-40px", paddingTop: "0px" }}>
                                            <RBNavbar style={{ display: deviceType === 'desktop' ? "none" : "", marginLeft: "auto", }} >
                                                <RBNav className="mr-auto">
                                                    <NavDropdown title={<><i className="bi bi-person-circle" style={{ marginRight: '5px' }}></i>{state.user[0].role}</>} className="custom_nav_link" id="collasible-nav-dropdown">

                                                        <ul className="me-auto custom admin-dropdown-menu" style={{ fontSize: this.state.font }} >
                                                            <li className="admin-dropdown-user-header">
                                                                <div className="admin-dropdown-avatar">
                                                                    <i className="bi bi-person-circle"></i>
                                                                </div>
                                                                <div className="admin-dropdown-user-info">
                                                                    <span className="admin-dropdown-username">{state.user[0].userName}</span>
                                                                    <span className="admin-dropdown-role">{state.user[0].role}</span>
                                                                </div>
                                                            </li>
                                                            {state.user[0].role.toLowerCase() === 'admin' && (
                                                                <>
                                                                    <li ><Dropdown.Divider /></li>
                                                                    <li >
                                                                        <NavItem tag={Link} to="/user-list" className=" p-0">
                                                                            <i className="bi bi-people svg-container"></i>
                                                                            <span>Manage Users</span>
                                                                        </NavItem>
                                                                    </li>
                                                                </>
                                                            )}
                                                            <li ><Dropdown.Divider /></li>
                                                            <li >
                                                                <NavItem tag={Link} to="/drawings" className=" p-0">
                                                                    <i className="bi bi-folder2-open svg-container"></i>
                                                                    <span>Manage Drawings</span>
                                                                </NavItem>
                                                            </li>
                                                            <li ><Dropdown.Divider /></li>
                                                            <li >
                                                                <NavItem tag={Link} to="/lovs" className=" p-0">
                                                                    <i className="bi bi-list-ul svg-container"></i>
                                                                    <span>Manage List of Values</span>
                                                                </NavItem>
                                                            </li>
                                                            <li ><Dropdown.Divider /></li>
                                                            <li >
                                                                <NavItem tag={Link} to="#" className="p-0" onClick={this.logout} >
                                                                    <i className="bi bi-box-arrow-right svg-container"></i>
                                                                    <span>Log out</span>
                                                                </NavItem>
                                                            </li>
                                                        </ul>
                                                    </NavDropdown>
                                                </RBNav>
                                            </RBNavbar>
                                    </div>
                                    </div>
                                    <Navbar style={{ marginLeft: "auto", float: "inherit", display: deviceType === 'desktop' ? "" : "none" }} className="p-0" container={false} >
                                        {state.drawingDetails.length > 0 && window.location.pathname === '/' && (
                                            <div className="gb_kd gb_ud gb_ze gb_Me gb_Re" style={{ margin: "0  0px 0  0", paddingTop: "10px" }}>
                                                <div className="gb_be gb_ae"></div>
                                                <div className="gb_ye">
                                                    <div className="searchBox">
                                                        <Routes >
                                                            <Route exact path="/" element={<Pagination
                                                                {...state} />} />
                                                        </Routes>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Navbar>
                                    <>
                                        <Offcanvas show={this.state.show} onHide={(e) => { this.setState({ show: false }); } }>
                                            <Offcanvas.Header closeButton>
                                                <Offcanvas.Title><i className="bi bi-person-circle" style={{ marginRight: '5px' }}></i>{state.user[0].role}</Offcanvas.Title>
                                            </Offcanvas.Header>
                                            <Offcanvas.Body>
                                                <ul className="me-auto custom admin-dropdown-menu" style={{ fontSize: this.state.font }} >
                                                    <li className="admin-dropdown-user-header">
                                                        <div className="admin-dropdown-avatar">
                                                            <i className="bi bi-person-circle"></i>
                                                        </div>
                                                        <div className="admin-dropdown-user-info">
                                                            <span className="admin-dropdown-username">{state.user[0].userName}</span>
                                                            <span className="admin-dropdown-role">{state.user[0].role}</span>
                                                        </div>
                                                    </li>
                                                    {state.user[0].role.toLowerCase() === 'admin' && (
                                                        <>
                                                            <li ><Dropdown.Divider /></li>
                                                            <li >
                                                                <NavItem tag={Link} to="/user-list" className=" p-0">
                                                                    <i className="bi bi-people svg-container me-3"></i>
                                                                    <span>Manage Users</span>
                                                                </NavItem>
                                                            </li>
                                                        </>
                                                    )}
                                                    <li ><Dropdown.Divider /></li>
                                                    <li >
                                                        <NavItem tag={Link} to="/drawings" className=" p-0">
                                                            <i className="bi bi-folder2-open svg-container me-3"></i>
                                                            <span>Manage Drawings</span>
                                                        </NavItem>
                                                    </li>
                                                    <li ><Dropdown.Divider /></li>
                                                    <li >
                                                        <NavItem tag={Link} to="/lovs" className=" p-0">
                                                            <i className="bi bi-list-ul svg-container me-3"></i>
                                                            <span>Manage List of Values</span>
                                                        </NavItem>
                                                    </li>
                                                    <li ><Dropdown.Divider /></li>
                                                    <li >
                                                        <NavItem tag={Link} to="#" className="p-0" onClick={this.logout} >
                                                            <i className="bi bi-box-arrow-right svg-container me-3"></i>
                                                            <span>Log out</span>
                                                        </NavItem>
                                                    </li>
                                                </ul>
                                            </Offcanvas.Body>
                                        </Offcanvas>
                                    </>

                                    <RBNavbar style={{ display: deviceType === 'desktop' ? "" : "none" }} >
                                        <RBNav className="mr-auto">
                                            <NavDropdown title={<><i className="bi bi-person-circle" style={{ marginRight: '5px' }}></i>{state.user[0].role}</>} className="custom_nav_link" id="collasible-nav-dropdown">

                                                <ul className="me-auto custom admin-dropdown-menu" style={{ fontSize: this.state.font }} >
                                                    <li className="admin-dropdown-user-header">
                                                        <div className="admin-dropdown-avatar">
                                                            <i className="bi bi-person-circle"></i>
                                                        </div>
                                                        <div className="admin-dropdown-user-info">
                                                            <span className="admin-dropdown-username">{state.user[0].userName}</span>
                                                            <span className="admin-dropdown-role">{state.user[0].role}</span>
                                                        </div>
                                                    </li>
                                                    {state.user[0].role.toLowerCase() === 'admin' && (
                                                        <>
                                                            <li ><Dropdown.Divider /></li>
                                                            <li >
                                                                <NavItem tag={Link} to="/user-list" className=" p-0">
                                                                    <i className="bi bi-people svg-container"></i>
                                                                    <span>Manage Users</span>
                                                                </NavItem>
                                                            </li>
                                                        </>
                                                    )}
                                                    <li ><Dropdown.Divider /></li>
                                                    <li >
                                                        <NavItem tag={Link} to="/drawings" className=" p-0">
                                                            <i className="bi bi-folder2-open svg-container"></i>
                                                            <span>Manage Drawings</span>
                                                        </NavItem>
                                                    </li>
                                                    <li ><Dropdown.Divider /></li>
                                                    <li >
                                                        <NavItem tag={Link} to="/lovs" className=" p-0">
                                                            <i className="bi bi-list-ul svg-container"></i>
                                                            <span>Manage List of Values</span>
                                                        </NavItem>
                                                    </li>
                                                    <li ><Dropdown.Divider /></li>
                                                    <li >
                                                        <NavItem tag={Link} to="#" className="p-0" onClick={this.logout} >
                                                            <i className="bi bi-box-arrow-right svg-container"></i>
                                                            <span>Log out</span>
                                                        </NavItem>
                                                    </li>
                                                </ul>
                                            </NavDropdown>
                                        </RBNav>
                                    </RBNavbar>
                                    <>
                                  </>
                                </div>
                               
                            </header>
                        </div>
                    </div>
            );
        }
}
