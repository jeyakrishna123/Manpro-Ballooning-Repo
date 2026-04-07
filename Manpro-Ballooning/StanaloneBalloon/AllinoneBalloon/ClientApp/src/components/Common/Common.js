// #region Component Imports
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'
import useStore from "../Store/store";
import initialState from "../Store/init";
import del from "../../assets/delete-white.svg"
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { v1 as uuid } from "uuid";
import {  instance }  from "../Client/http-common"
import _ from 'lodash';
import axios from 'axios';
//import { saveAs } from 'file-saver';
// #endregion

// #region Helper function

export const config = /* fetch("/config.json")
    .then((res) => res.json())
    .then((data) => {
        console.log("Updated Config:", data);
        useStore.setState({ AppSettings: data });

        const appstate = useStore.getState();
        const BASE_URL = (appstate?.AppSettings?.REACT_APP_SERVER !== null) ? appstate?.AppSettings?.REACT_APP_SERVER : process.env.REACT_APP_SERVER;
        const ENVIRONMENT = (appstate?.AppSettings?.REACT_APP_ENV !== null) ? appstate?.AppSettings?.REACT_APP_ENV : process.env.REACT_APP_ENV;
        const APP_TITLE = (appstate?.AppSettings?.REACT_APP_TITLE !== null) ? appstate?.AppSettings?.REACT_APP_TITLE : process.env.REACT_APP_TITLE;
        const CONSOLE_LOG = (appstate?.AppSettings?.REACT_APP_CONSOLE !== null) ? appstate?.AppSettings?.REACT_APP_CONSOLE : process.env.REACT_APP_CONSOLE;
        const IS_DEMO_APP = (appstate?.AppSettings?.REACT_APP_DEMO !== null) ? appstate?.AppSettings?.REACT_APP_DEMO : process.env.REACT_APP_DEMO;
        const APP_FAVICON = (appstate?.AppSettings?.REACT_APP_FAVICON !== null) ? appstate?.AppSettings?.REACT_APP_FAVICON : process.env.REACT_APP_FAVICON;
        const BALLOON_PROCESS_MAX_QTY = (appstate?.AppSettings?.REACT_APP_BALLOON_PROCESS_MAX_QTY !== null) ? appstate?.AppSettings?.REACT_APP_BALLOON_PROCESS_MAX_QTY : process.env.REACT_APP_BALLOON_PROCESS_MAX_QTY;
        return */
        {
            ENVIRONMENT: process.env.REACT_APP_ENV,
            BASE_URL: process.env.REACT_APP_SERVER,
            APP_TITLE: process.env.REACT_APP_TITLE,
            console: process.env.REACT_APP_CONSOLE === "true",
            Demo: process.env.REACT_APP_DEMO === "true",
            Fav: process.env.REACT_APP_FAVICON,
            maxBalloonQty: (process.env.REACT_APP_BALLOON_PROCESS_MAX_QTY === null || process.env.REACT_APP_BALLOON_PROCESS_MAX_QTY === '') ? 10 : parseInt(process.env.REACT_APP_BALLOON_PROCESS_MAX_QTY),
        };
    //});


export const delayExecute = (delay) => {
    return new Promise(res => setTimeout(res, delay));
};

export const RGBAToHexA = (rgba, forceRemoveAlpha = false) => {
    return "#" + rgba.replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
        .split(',') // splits them at ","
        .filter((string, index) => !forceRemoveAlpha || index !== 3)
        .map(string => parseFloat(string)) // Converts them to numbers
        .map((number, index) => index === 3 ? Math.round(number * 255) : number) // Converts alpha to 255 number
        .map(number => number.toString(16)) // Converts numbers to hex
        .map(string => string.length === 1 ? "0" + string : string) // Adds 0 when length of one number is 1
        .join("") // Puts the array to togehter to a string
}

export const hexToRGBA = (hex, alpha = 1)  => {
    // Remove the hash at the start if it�s there
    hex = hex.replace(/^#/, '');

    // Parse r, g, b values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function sanitizeInput(input) {
    // Remove any unwanted characters or potential malicious code
    return input.replace(/[^a-zA-Z0-9 ]/g, "");
}

export function CatchError(error) {
    useStore.setState({ isLoading: false });
    if (!error.response) {
        showAlert("Error", "Unable to connect to the server. Please check your network connection.");
        return;
    }
    if (error.response.status === 401) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('roles');
        showAlert("Session Expired", "Your session has expired. Please log in again.").then(() => {
            window.location.assign('/login');
        });
        return;
    }
    if (error.response.status === 400) {
        showAlert("Error", error.response.data);
        return;
    }
    if ( error.response.status === 403) {
        showAlert("Error", error.response.data.Message || "You do not have permission to perform this action.");
        return;
    }
    if (error.response.status === 500) {
        showAlert("Error", "We are experiencing technical difficulties, Please contact support.");
        return;
    }
    if (error.response.status === 422) {
        showAlert("Error", "Validation error. Please check your input.");
        return;
    }
    showAlert("Error", "An unexpected error occurred. Please try again.");
}
export async function openToken(state, token) {
    try {
        if (state.hubConnection) {
            await state.hubConnection.invoke("OpenToken", token);
        }
    }
    catch (error) {
        console.error("catch", error);
        CatchError(error);
    }
}
// #endregion

// #region Begin API process
export async function fetchSearchData(state) {

    try {
        let url = "/api/drawingsearch/GetDrawingByNumber";
        // let url = "/api/drawingservice/DrawingUrl/" + state.drawingNo + "/" + state.revNo;
        state.drawingNo = sanitizeInput(state.drawingNo);
        const res = await instance.post(url, state);
       // const res = await instance.get(url, state);
        //console.log( "fetchSearchData", res)
        
        if (res.status === 204 ) {
            useStore.setState({ isLoading: false })
           
            showAlert("Invalid Input", "<p> Please check the drawing and revision number.</p>");
            const element = document.getElementById("DrawingNo");
            window.setTimeout(() => element.focus(), 0);
            let res = {};
            res.data = [];
            return res;
        }
        if (res.status !== 200) {
            const message = `An error has occured, Please enter Valid Input.`;
            throw new Error(message);
        }

        return res;
    } catch (e) {
        if (e.response.status === 400) {
            useStore.setState({ isLoading: false })

            showAlert("Invalid Input", "<p> Please check the drawing and revision number.</p>").then(function () {
                setTimeout(() => {
                    const element = document.getElementById("DrawingNo");
                    window.setTimeout(() => element.focus(), 50);
                }, 100);
            });
            let res = {};
            res.data = [];
            console.clear();
            return res;
        }
        console.error("catch",e);
    }

}

export async function apiDownloadimages(url, data) {
    let options = {
        url: url,
        method: "POST",
        data: data,
    };
    return await instance.request(options);
}

export async function apiDownloadRequest(url, data)
{
    let options = {
        url: url,
        method: "POST",
        data: data,
        responseType: 'blob'
    };
    return await instance.request(options);
}

export async function rotateProcessApi(state) {
    try {
        let url = "/api/drawingsearch/rotate";
        const res = await instance.post(url, state);
        // console.log("rotateProcessApi",res)
        useStore.setState({ isLoading: false });

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (error) {
        console.error("catch", error);
        CatchError(error);
    }
}

export async function deleteBalloonProcessApi(state) {
    try {
        let url = "/api/drawingsearch/deleteBalloons";
        const res = await instance.post(url, state);
        //  console.log( "deleteBalloons", res)
        useStore.setState({ isLoading: false });

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (e) {
        console.error("catch",e);
    }
     
}

export async function makeAutoballoonApi(state) {

    try {
        let url = "/api/drawingsearch/AutoBalloon";
        const res = await instance.post(url, state);
        //  console.log( "makeAutoballoonApi", res)
        useStore.setState({ isLoading: false });

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (error) {
        console.error("catch", error.response ? error.response.data : error.message);
        CatchError(error)
    }
}

export async function makeSPLballoonApi(state) {

    try {
        let url = "/api/drawingsearch/SplBalloon";
        const res = await instance.post(url, state);
        //  console.log( "makeAutoballoonApi", res)
        useStore.setState({ isLoading: false });

        if (res.status === 201) {
            useStore.setState({ isLoading: false })
            //console.log("dummy",res);
            return {data:res.data};
        }

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (error) {
        console.error("catch", error);
        CatchError(error)
    }
}

export async function saveBalloonsApi(state) {
    try {
        let url = "/api/drawingsearch/saveBalloons";
        const res = await instance.post(url, state);

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (e) {
        console.error("catch", e);
        useStore.setState({ isLoading: false });
        throw e;
    }
}

export async function resetBalloonsProcessApi(state) {
    try {
        let url = "/api/drawingsearch/resetBalloons";
        const res = await instance.post(url, state);
        //  console.log( "resetBalloonsProcessApi", res)
        useStore.setState({ isLoading: false });

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (e) {
        console.error("catch",e);
    }
}

export async function reOrderBalloonsApi(state) {
    try {
        let url = "/api/drawingsearch/reOrderBalloons";
        const res = await instance.post(url, state);
        //  console.log( "resetBalloonsProcessApi", res)
        useStore.setState({ isLoading: false });

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (e) {
        console.error("catch", e);
    }
}

export async function specificationUpdateApi(state) {
    try {
        let url = "/api/drawingsearch/specificationUpdate";
        const res = await instance.post(url, state);
        //  console.log( "resetBalloonsProcessApi", res)
        useStore.setState({ isLoading: false });

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (error) {
        console.error("catch", error);
        CatchError(error)
    }
}

export async function saveAllBalloonsApi(state) {
    try {
        let url = "/api/drawingsearch/saveAllBalloons";
        const res = await instance.post(url, state);
        //  console.log(response, "saveAllBalloons")
        useStore.setState({ isLoading: false });

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (error) {
        console.error("catch", error);
        CatchError(error)
    }
}

export async function specAutoPopulateApi(state) {
    try {
        let url = "/api/drawingsearch/specAutoPopulate";
        const res = await instance.post(url, state);
        //  console.log(response, "specAutoPopulate")
        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (error) {
        console.error("catch", error);
        CatchError(error)
    }
}

export async function saveControlledCopyApi(state) {
    try {
        let url = "/api/drawingsearch/saveControlledCopy";
        const res = await instance.post(url, state);

        if (res.status !== 200) {
            const message = `An error has occured, Please try again.`;
            throw new Error(message);
        }

        return res;
    } catch (error) {
        console.error("catch", error);
        CatchError(error)
    }
}

//#endregion

// #region Helper constant
export const recKey = [
    "baloonDrwID",
    "baloonDrwFileID",
    "productionOrderNumber",
    "part_Revision",
    "page_No",
    "drawingNumber",
    "revision",
    "balloon",
    "spec",
    "nominal",
    "minimum",
    "maximum",
    "measuredBy",
    "measuredOn",
    "measure_X_Axis",
    "measure_Y_Axis",
    "circle_X_Axis",
    "circle_Y_Axis",
    "circle_Width",
    "circle_Height",
    "balloon_Thickness",
    "balloon_Text_FontSize",
    "balloonShape",
    "zoomFactor",
    "crop_X_Axis",
    "crop_Y_Axis",
    "crop_Width",
    "crop_Height",
    "type",
    "subType",
    "unit",
    "serial_No",
    "quantity",
    "toleranceType",
    "plusTolerance",
    "minusTolerance",
    "minTolerance",
    "maxTolerance",
    "cropImage",
    "createdBy",
    "createdDate",
    "modifiedBy",
    "modifiedDate",
    "isCritical",
    'actual',
    'decision',
    'balloonColor',
    'characteristics',
    "isSaved",
    "convert",
    "converted",
    "actualDecision"
];
export const orgKey = [
      "BaloonDrwID"
    , "BaloonDrwFileID"
    , "ProductionOrderNumber"
    , "Part_Revision"
    , "Page_No"
    , "DrawingNumber"
    , "Revision"
    , "Balloon"
    , "Spec"
    , "Nominal"
    , "Minimum"
    , "Maximum"
    , "MeasuredBy"
    , "MeasuredOn"
    , "Measure_X_Axis"
    , "Measure_Y_Axis"
    , "Circle_X_Axis"
    , "Circle_Y_Axis"
    , "Circle_Width"
    , "Circle_Height"
    , "Balloon_Thickness"
    , "Balloon_Text_FontSize"
    , "BalloonShape"
    , "ZoomFactor"
    , "Crop_X_Axis"
    , "Crop_Y_Axis"
    , "Crop_Width"
    , "Crop_Height"
    , "Type"
    , "SubType"
    , "Unit"
    , "Serial_No"
    , "Quantity"
    , "ToleranceType"
    , "PlusTolerance"
    , "MinusTolerance"
    , "MinTolerance"
    , "MaxTolerance"
    , "CropImage"
    , "CreatedBy"
    , "CreatedDate"
    , "ModifiedBy"
    , "ModifiedDate"
    , "IsCritical"
    , "Actual"
    , "Decision"
    , "BalloonColor"
    , "Characteristics"
    , "isSaved"
    , "convert"
    , "converted"
    , "ActualDecision"
];
// #endregion

// #region Helper function
export const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to capitalize the first letter of each key in an object
export const capitalizeKeys = (obj) => {
    return _.mapKeys(obj, (_, key) => capitalizeFirstLetter(key));
}

export const showAlertOnReAnnotation = (state) => {
    Swal.fire({
        title: 'Do you want to save the changes?',
        showCancelButton: true,
        confirmButtonText: 'Save',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
               // console.log("originalRegions", "handleMouseUp")
                useStore.setState({
                    drawingRegions: state.drawingRegions,
                    originalRegions: state.originalRegions,
                    draft: state.draft,
                });
                selectedRegionProcess(state.originalRegions);
            } 
        })
}

export const showinfoAlert = () => {
    Swal.fire({
        title: "Do you want to clear the existing Routing?",
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "Yes",
        denyButtonText: `No`
    }).then((result) => {

    });
}

export const getDiff = (arr1, arr2) => {
    return arr2.filter(item => !arr1.includes(item));
};

export const rearrangedPageBalloon = (drawingitems) => {

    const groupedData = drawingitems.reduce((acc, curr) => {
        const { Page_No } = curr;
        if (!acc[Page_No]) {
            acc[Page_No] = [];
        }
        acc[Page_No].push(curr);
        return acc;
    }, {});


    let newitems = [];
    let bcnt = [];
    Object.values(groupedData).map((deletedOrg, i) => {

        const resetOverData = [...deletedOrg];

        let resetOverSingle = resetOverData.reduce((res, item) => {
            if (!res[parseInt(item.Balloon)]) {
                res[parseInt(item.Balloon)] = item;
            }
            return res;
        }, []);

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

        unique.reduce((prev, curr, index) => {
            const id = uuid();
            let newarr = [];
            bcnt.push(0);
            let Balloon = parseInt(bcnt.length);
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
                newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: id, DrawLineID: i, Balloon: pb });
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

                    let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b, selectedRegion: "" };
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
                    newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b });
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

                            newarr.push({ ...nmi, newarr: { ...nmi.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
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

        newitems = [...newitems];
        return deletedOrg;
    });
   // console.log(newitems)
    return newitems;
}

export const resetBalloonsProcess = ( ) => {
    const state = useStore.getState();
    const {
        originalRegions,
        ItemView,
        controllCopy,
        drawingDetails
    } = state;
    let Page_No = 0;
    if (drawingDetails.length > 0 && ItemView != null) {
        Page_No = parseInt(Object.values(drawingDetails)[parseInt(ItemView)].currentPage);
    }
    useStore.setState({ selectedRowIndex: null });
    useStore.setState({ isLoading: true, loadingText: "Resetting Balloon... Please Wait..." })
    let resetData = originalRegions.map((item) => {
        if (item.Page_No !== Page_No) {
            return item;
        }
        return false;
    }).filter(item => item !== false);
    setTimeout(() => {
        let cc = controllCopy.filter(x => x.pageNo === Page_No);
        if (cc.length > 0) {
            cc[0].textGroupPlaced = false;
        }
        //const resetOverData = JSON.parse(JSON.stringify(resetData));
        const resetOverData = [...resetData];

        let resetOverSingle = resetOverData.reduce((res, item) => {
            if (!res[parseInt(item.Balloon)]) {
                res[parseInt(item.Balloon)] = item;
            }
            return res;
        }, []);
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
        //useStore.setState({ isLoading: false });
       // return;

        let newitems = [];
    
         unique.reduce((prev, curr, index) => {
            const id = uuid();
            let newarr = [];
            let Balloon = index + 1;
            Balloon = Balloon.toString();
            if (curr.Quantity === 1 && curr.subBalloon.length === 0) {
                prev.push({ b:  (Balloon), c: prev.length + 1 })
                let i = prev.length;
                newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: Balloon }, id: id, DrawLineID: i, Balloon: Balloon });
            }
            if (curr.Quantity === 1 && curr.subBalloon.length > 0) {
                let pb = parseInt(Balloon).toString() + ".1";
                prev.push({b:pb, c:  prev.length + 1 })
                let i = prev.length;
                newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb },  id: id, DrawLineID: i, Balloon: pb });
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
 
                    let setter = { ...e, newarr: { ...e.newarr, Balloon: b },  id: sid, DrawLineID: i, Balloon: b };
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
                    newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b });
                }
            }
            if (curr.Quantity > 1 && curr.subBalloon.length > 0) {
                for (let qi = 1; qi <= curr.Quantity; qi++) {
                    if (qi > config.maxBalloonQty) { break; }
                    let pb = parseInt(curr.Balloon).toString() + "." + qi.toString();
                    let newMainItem = [];
                    newMainItem = Qtyparent.map(item => {
                        if (pb === item.Balloon) {
                            return item;
                        }
                        return false;
                    }).filter(x => x !== false);
                    if (newMainItem.length > 0) {

                        newMainItem.map((nmi) => {
                            const qid = uuid();
                            let pb = parseInt(Balloon).toString() + "." + (qi).toString();
                            prev.push({ b: pb, c: prev.length + 1 })
                            let i = prev.length;

                            newarr.push({ ...nmi, newarr: { ...nmi.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
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
                                let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sqid, DrawLineID: i, Balloon: b };
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
        if (config.console)
        console.log(newitems)
        //useStore.setState({ isLoading: false });
        //return; 
        const newstate = useStore.getState();
        newitems = rearrangedPageBalloon(newitems);
        let newrect = newBalloonPosition(newitems, newstate);
        useStore.setState({
            originalRegions: newitems,
            draft: newitems, 
            drawingRegions: newrect,
            balloonRegions: newrect
        });
        useStore.setState({ isLoading: false });
    }, 300);
     
    return false;

}

export const selectedSPLRegionProcess = (newAnnotation) => {
    const state = useStore.getState();
    if (state.isErrImage) {
        return;
    }
    const {
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
    let CrevNo = drawingHeader[0].revision_No;
    let Page_No = 0;
    let totalPage = 0;
    let rotation = 0;
    let rotate_properties = [];
    let origin = [];

    if (drawingDetails.length > 0 && ItemView != null) {
        Page_No = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
        totalPage = Object.values(drawingDetails)[parseInt(ItemView)].totalPage;
        rotation = Object.values(drawingDetails)[parseInt(ItemView)].rotation;
        let rotate = drawingDetails.map(s => parseInt(s.rotation));
        rotate_properties = JSON.stringify(rotate);
        origin = Object.values(partial_image)[parseInt(ItemView)];
    }
    useStore.setState({ isLoading: true, loadingText: `Processing...` })


    const oldDraw = newAnnotation.map((item, i) => {
        let ii = {};
        
        if (item.hasOwnProperty("newarr")) {
            const id = uuid();
            if (item.hasOwnProperty("isSaved") && !item.isSaved) {
                item.newarr.Actual = "";
                item.newarr.BalloonColor = "";
                item.newarr.Decision = "";

            }
            let w = parseInt(item.newarr.Crop_Width * 1);
            let h = parseInt(item.newarr.Crop_Height * 1);
            let x = parseInt(item.newarr.Crop_X_Axis * 1);
            let y = parseInt(item.newarr.Crop_Y_Axis * 1);
            let cx = parseInt(item.newarr.Circle_X_Axis * 1);
            let cy = parseInt(item.newarr.Circle_Y_Axis * 1);
            let mx = parseInt(item.newarr.Measure_X_Axis * 1);
            let my = parseInt(item.newarr.Measure_Y_Axis * 1);
            return { ...ii, ...item.newarr, Measure_X_Axis: mx, Measure_Y_Axis:my, Crop_Width: w, Crop_Height: h, Crop_X_Axis: x, Crop_Y_Axis: y, Circle_X_Axis: cx, Circle_Y_Axis: cy, x, y, width:w, height:h, id, isballooned: true, selectedRegion: "" };
        }
        return false;
    }).filter(item => item !== false);

    const newDraw = newAnnotation.map((item, i) => {
        if (!item.hasOwnProperty("newarr")) {
            return { ...item };
        }
        return false;
    }).filter(item => item !== false);

    oldDraw.push(newDraw[0]);

    if (config.console)
        console.log("selectedRegionProcess", newDraw, oldDraw)
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
        pageNo: Page_No,
        totalPage: totalPage,
        annotation: oldDraw,
        selectedRegion: selectedRegion,
        balloonRegions: [],
        drawingRegions: [],
        originalRegions: oldDraw,
        rotate: rotate_properties,
        origin: [origin],
        bgImgRotation: rotation
        , routingNo: routingNo,
        Quantity: Quantity,
        Settings: Settings

    };
    useStore.setState({ selectedRowIndex: null });
    setTimeout(() =>
        makeSPLballoonApi(req).then(r => {
            return r.data;
        })
            .then(r => {
                useStore.setState({ isLoading: false });

                if (r.length > 0) {
                   // if (config.console)
                        console.log("saved data", r)
                     r.map((item, index) => {
                        if (item.hasOwnProperty("drawLineID")) {
                            delete item.drawLineID;
                        }
                         item.balloon = item.balloon.replaceAll("-", ".");
                        return item;
                    });
                    let newrects = [];

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
                            items[i] = { ...c.value[0], subBalloon: [], id: id, DrawLineID: i };
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
                                            items[i] = { ...main[0], id: qid, DrawLineID: i };

                                            let sub = c.value.map(a => {
                                                if (a.balloon.includes(b + ".")) {
                                                    const sqid = uuid();
                                                    r.push({ b: a.balloon });
                                                    let isub = r.length;
                                                    a.isDeleted = false;
                                                    items[isub] = { ...a, id: sqid, DrawLineID: isub };
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

                    //return false;
                    newrects = newitems.map((item, ind) => {
                        const id = uuid();
                        var keys = Object.keys(item);
                        //console.log(item)
                        let newarr = [];
                        var res = keys.reduce((prev, curr, index) => {
                            //console.log(curr , recKey[index])
                            const recIndex = recKey.indexOf(curr);
                            if (recIndex !== -1) {
                                newarr[orgKey[recIndex]] = ((item[curr] === null) ? "" : item[curr]);
                                return { ...newarr, newarr }
                            }

                            if (curr === "subBalloon") {
                                let es = item.subBalloon.map(obj => {
                                    let cap = capitalizeKeys(obj);
                                    cap.isDeleted = cap.IsDeleted;
                                    cap.isSaved = cap.IsSaved;
                                    delete cap.IsDeleted;
                                    delete cap.Isballooned;
                                    delete cap.IsSaved;
                                    return { ...cap, isballooned: true, newarr: cap }
                                });
                                newarr["subBalloon"] = ((item[curr] === null) ? [] : es);
                                return { ...newarr, newarr }
                            }
                            return {
                                ...newarr, newarr: { ...newarr }
                            }
                        }, {});
                        if (config.console)
                            console.log(res)

                        delete res.newarr.subBalloon;
                        let w = parseInt(item.crop_Width * 1);
                        let h = parseInt(item.crop_Height * 1);
                        let x = parseInt(item.crop_X_Axis * 1);
                        let y = parseInt(item.crop_Y_Axis * 1);

                        return { ...res, x, y, width: w, height: h, id: id, isballooned: true, selectedRegion: "", DrawLineID: ind + 1 };
                    })
                    newrects = shortBalloon(newrects, "DrawLineID");
                    newrects = rearrangedPageBalloon(newrects);
                    if (config.console)
                        console.log(newrects)
                    const newrectsPage = newrects.reduce((acc, curr) => {
                        const { Page_No } = curr;
                        if (!acc[Page_No]) {
                            acc[Page_No] = [];
                        }
                        acc[Page_No].push(curr);
                        return acc;
                    }, {});
                    if (config.console)
                        console.log(newrectsPage)
                    const { ItemView, drawingDetails, } = useStore.getState();
                    let Page_No = 0;
                    if (drawingDetails.length > 0 && ItemView != null) {
                        Page_No = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
                    }
                    let cp = newrectsPage[Page_No];
                    let cpl = cp.slice(-1);
                    if (config.console)
                        console.log(cp, cpl)
                    // let dummy = newrects.slice(-1);
                    let dummy = cpl;
     
                    if (dummy[0].Spec === "") {
                        //alert("The OCR Unable to extract Balloon details on this SPl region.");
                        
                        Swal.fire({
                            title: 'Oops!',
                            icon: "",
                            html: "The OCR Unable to extract Balloon details on this SPl region.",
                            showConfirmButton: true
                        }).then((r) => {
                            if (r.isConfirmed) {
                                const dstate = useStore.getState();
                                setTimeout(function () {
                                    let scrollElement = document.querySelector('#konvaMain');
                                    if (scrollElement !== null) {
                                        scrollElement.scrollLeft = dstate.scrollPosition;
                                    }

                                }, 500);
                            }
                        });
                        newrects.map((item) => {
                            if (parseInt(item.Balloon) === parseInt(dummy[0].Balloon)) {
                                item.isballooned = false;
                                item.isDeleted = false;
                                return item;
                            }
                            return false;
                        }).filter((item) => item !== false);
                        useStore.setState({ selectedBalloon: dummy[0].Balloon });
                    }
                    newrects = rearrangedPageBalloon(newrects);
                    useStore.setState({
                        originalRegions: newrects,
                        draft: newrects,
                        intBubble: 1
                    });
                    const state1 = useStore.getState();
                    let newDraw = newBalloonPosition(newrects, state1);
                    useStore.setState({
                        drawingRegions: newDraw,
                        balloonRegions: newDraw,
                        intBubble: 1
                    });
                } else {
                    useStore.setState({
                        originalRegions: [],
                        draft: [],
                        drawingRegions: [],
                        balloonRegions: [],
                    });
                }


            }, (error) => {
                let state = useStore.getState();
                const prev = state.originalRegions.filter(r => r.isballooned === true);
                useStore.setState({
                    originalRegions: prev,
                    draft: state.draft,
                })
                let nstate = useStore.getState();
                const nprev = nstate.originalRegions.filter(r => r.isballooned === true);
                let prevDraw = newBalloonPosition(nprev, nstate);
                useStore.setState({
                    drawingRegions: prevDraw,
                    balloonRegions: prevDraw,
                });
                console.log("Error", error);
                useStore.setState({ isLoading: false });
            }).catch(error => {
                console.log(error);
                useStore.setState({ isLoading: false });
            })
        , 100);
    return false;

}

export const selectedRegionProcess = (newAnnotation, skipConflictCheck = false) => {
    const state = useStore.getState();
    if (state.isErrImage) {
        return;
    }
    const {
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
    let CrevNo = drawingHeader[0].revision_No;
    let Page_No = 0;
    let totalPage = 0;
    let rotation = 0;
    let rotate_properties = [];
    let origin = [];

    if (drawingDetails.length > 0 && ItemView != null) {
        Page_No = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
        totalPage = Object.values(drawingDetails)[parseInt(ItemView)].totalPage;
        rotation = Object.values(drawingDetails)[parseInt(ItemView)].rotation;
        let rotate = drawingDetails.map(s => parseInt(s.rotation));
        rotate_properties = JSON.stringify(rotate);
        origin = Object.values(partial_image)[parseInt(ItemView)];
    }
    useStore.setState({ isLoading: true, loadingText: `Processing...` })
    const newDraw = newAnnotation.map((item, i) => {
        if (!item.hasOwnProperty("newarr")) {
            return { ...item };
        } 
        return false;
    }).filter(item => item !== false);

    let oldDraw = newAnnotation.map((item, i) => {
  
        if (item.hasOwnProperty("newarr")) {
           // console.log("i am here")
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
            return { ...item, Measure_X_Axis: mx, Measure_Y_Axis:my, Crop_Width: w, Crop_Height: h, Crop_X_Axis: x, Crop_Y_Axis: y, Circle_X_Axis: cx, Circle_Y_Axis: cy, height: h, width: w, x: x, y: y, id, isballooned: true, selectedRegion :""};
        }

        return false;
    }).filter(item => item !== false);
    let newitems = [];

    // Helper: check if a balloon's center point falls inside a rectangle
    const isBalloonInsideRect = (item, rect) => {
        if (!item || !item.newarr || !rect) return false;
        const bx = parseInt(item.newarr.Circle_X_Axis);
        const by = parseInt(item.newarr.Circle_Y_Axis);
        const rx = parseInt(rect.Crop_X_Axis);
        const ry = parseInt(rect.Crop_Y_Axis);
        const rw = parseInt(rect.Crop_Width);
        const rh = parseInt(rect.Crop_Height);
        return bx >= rx && bx <= (rx + rw) && by >= ry && by <= (ry + rh);
    };

    if (selectedRegion === "Unselected Region") {
        const selectionRect = newDraw[0];

        // Conflict Detection: check for existing balloons inside the selection region
        if (!skipConflictCheck && selectionRect) {
            const balloonsInsideSelection = newAnnotation.filter(item =>
                item.hasOwnProperty("newarr") &&
                parseInt(item.Page_No) === parseInt(Page_No) &&
                isBalloonInsideRect(item, selectionRect)
            );

            if (balloonsInsideSelection.length > 0) {
                // Pause loading — show confirmation popup
                useStore.setState({ isLoading: false });
                Swal.fire({
                    title: 'Existing Balloons Detected',
                    html: `<p style="font-size:14px;">Existing balloons (<b>${balloonsInsideSelection.length}</b>) are detected in the selected region.</p>
                           <p style="font-size:14px;">Do you want to remove balloons from the selected region and generate balloons for the remaining drawing?</p>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#1e88e5',
                    cancelButtonColor: '#6c757d',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Remove balloons inside the selection, keep everything else
                        const filteredAnnotation = newAnnotation.filter(item => {
                            if (item.hasOwnProperty("newarr") &&
                                parseInt(item.Page_No) === parseInt(Page_No) &&
                                isBalloonInsideRect(item, selectionRect)) {
                                return false; // Remove this balloon (inside selection)
                            }
                            return true; // Keep everything else
                        });
                        // Re-enter with conflict check skipped
                        selectedRegionProcess(filteredAnnotation, true);
                    } else {
                        // Cancel — restore state, remove the drawn selection rectangle
                        const restored = newAnnotation.filter(item => item.hasOwnProperty("newarr"));
                        useStore.setState({ originalRegions: restored, selectedRegion: "" });
                        const s = useStore.getState();
                        let drawPositions = newBalloonPosition(restored, s);
                        useStore.setState({
                            drawingRegions: drawPositions,
                            balloonRegions: drawPositions,
                        });
                    }
                });
                return false;
            }
        }

        // Keep other-page balloons + current-page balloons OUTSIDE the selection
        oldDraw = newAnnotation.map((item, i) => {
            if (item.hasOwnProperty("newarr")) {
                // Always keep balloons from other pages
                if (parseInt(item.Page_No) !== parseInt(Page_No)) {
                    return item;
                }
                // Keep current-page balloons that are OUTSIDE the selection region
                if (selectionRect && !isBalloonInsideRect(item, selectionRect)) {
                    return item;
                }
            }
            return false;
        }).filter(item => item !== false);
        
        if (oldDraw.length > 0) {
            let resetOverData = [...oldDraw];

            let resetOverSingle = resetOverData.reduce((res, item) => {
                if (!res[parseInt(item.Balloon)]) {
                    res[parseInt(item.Balloon)] = item;
                }
                return res;
            }, []);
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
            // console.log(unique)
            //useStore.setState({ isLoading: false });
            // return;

           

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
                    newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: id, DrawLineID: i, Balloon: pb });
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

                        let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b, selectedRegion: "" };
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
                        newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b });
                    }
                }
                if (curr.Quantity > 1 && curr.subBalloon.length > 0) {
                    for (let qi = 1; qi <= curr.Quantity; qi++) {
                        if (qi > config.maxBalloonQty) { break; }
                        let pb = parseInt(curr.Balloon).toString() + "." + qi.toString();
                        let newMainItem = [];
                        newMainItem = Qtyparent.map(item => {
                            if (pb === item.Balloon) {
                                return item;
                            }
                            return false;
                        }).filter(x => x !== false);
                        if (newMainItem.length > 0) {

                            newMainItem.map((nmi) => {
                                const qid = uuid();
                                let pb = parseInt(Balloon).toString() + "." + (qi).toString();
                                prev.push({ b: pb, c: prev.length + 1 })
                                let i = prev.length;

                                newarr.push({ ...nmi, newarr: { ...nmi.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
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
            oldDraw = newitems;
        }
       
    }

    oldDraw.push(newDraw[0]);
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
        pageNo: Page_No,
        totalPage: totalPage,
        annotation: oldDraw,
        selectedRegion: selectedRegion,
        balloonRegions: [],
        drawingRegions: [],
        originalRegions: oldDraw,
        rotate: rotate_properties,
        origin: [origin],
        bgImgRotation: rotation,
        routingNo: routingNo,
        Quantity: Quantity,
        Settings: Settings,
        accurateGDT: state.accurateGDT || false

    };
    console.log("selectedRegionProcess", newDraw, oldDraw, req)
    //return false;
    useStore.setState({ selectedRowIndex: null });
    setTimeout(() =>
        makeAutoballoonApi(req).then(r => {
            return r.data;
        })
            .then(r => {
                useStore.setState({ isLoading: false });

                if (r.length > 0) {
                    if (config.console)
                        console.log(r, "selectedRegionProcess res")
                    r = r.map((item, index) => {
                        if (item.hasOwnProperty("drawLineID")) {
                            delete item.drawLineID;
                        }
                        item.balloon = item.balloon.replaceAll("-", ".");
                        return item;
                    });
 
                    let newrects = [];

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
                            items[i] = { ...c.value[0], subBalloon: [], id: id, DrawLineID: i };
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
                                            items[i] = { ...main[0], id: qid, DrawLineID: i };

                                            let sub = c.value.map(a => {
                                                if (a.balloon.includes(b + ".")) {
                                                    const sqid = uuid();
                                                    r.push({ b: a.balloon });
                                                    let isub = r.length;
                                                    a.isDeleted = false;
                                                    items[isub] = { ...a, id: sqid, DrawLineID: isub };
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

                    //return false;
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
                            if (curr === "characteristics") {
                                newarr["Characteristics"] = ((item[curr] === null) ? "" : item[curr]);
                                return { ...newarr, newarr }
                            }
                            if (curr === "balloonColor") {
                                newarr["BalloonColor"] = ((item[curr] === null) ? "" : item[curr]);
                                return { ...newarr, newarr }
                            }
                            if (curr === "actual") {
                                newarr["Actual"] = ((item[curr] === null) ? "" : item[curr]);
                                return { ...newarr, newarr }
                            }
                            if (curr === "decision") {
                                newarr["Decision"] = ((item[curr] === null) ? "" : item[curr]);
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
                        return { ...res, x, y, width: w, height: h, id: id, isballooned: true, selectedRegion: "", DrawLineID: ind+1 };
                    })
                    newrects = shortBalloon(newrects, "DrawLineID");
                    if (config.console)
                        console.log(newrects)
                    newrects = rearrangedPageBalloon(newrects);
                    useStore.setState({
                        originalRegions: newrects,
                        draft: newrects,
                        intBubble: 1
                    });
                        const state1 = useStore.getState();
                        let newDraw = newBalloonPosition(newrects, state1);
                        useStore.setState({
                            drawingRegions: newDraw,
                            balloonRegions: newDraw,
                            intBubble: 1
                        });
                        // Success notification
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: `${newrects.length} balloon${newrects.length !== 1 ? 's' : ''} created successfully`,
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    } else {
                        useStore.setState({
                            originalRegions: [],
                            draft: [],
                            drawingRegions: [],
                            balloonRegions: [],
                        });
                    }


            }, (error) => {
                let state = useStore.getState();
                const prev = state.originalRegions.filter(r => r.isballooned === true);
                useStore.setState({
                    originalRegions: prev,
                    draft: state.draft,
                })
                let nstate = useStore.getState();
                const nprev = nstate.originalRegions.filter(r => r.isballooned === true);
                let prevDraw = newBalloonPosition(nprev, nstate);
                useStore.setState({
                    drawingRegions: prevDraw,
                    balloonRegions: prevDraw,
                });
                console.log("Error", error);
                useStore.setState({ isLoading: false });
            }).catch(error => {
                console.log(error);
                useStore.setState({ isLoading: false });
            })
        , 100);
    return false;
}

export const actualSize = () => {
    let stte = useStore.getState();
    if (stte.isErrImage) {
        return;
    }
    
    const props = useStore.getState();
    let pageNo = 0;
    let resize = "false";
    let superScale = [];
    if (props.drawingDetails.length > 0 && props.ItemView != null) {
        pageNo = parseInt(Object.values(props.drawingDetails)[parseInt(props.ItemView)].currentPage);
        resize = props.drawingDetails.length > 0 ? Object.values(props.drawingDetails)[parseInt(props.ItemView)].resize : "false";
        superScale = props.partial_image.filter((a) => { return a.item === parseInt(props.ItemView); });
    }
    if (config.console)
    console.log( pageNo, resize, superScale, window.innerWidth, window.innerHeight, superScale );
    
    useStore.setState({  fitscreen:false, win: initialState.win, isDisabledZoomIn: false, isDisabledFIT: false });
   // useStore.setState({ zoomingfactor: 0, zoomed: false });

       // useStore.setState({ history: [], win: initialState.win, isDisabledZoomIn: false, isDisabledFIT: false });
        requestAnimationFrame(function () {
            let state = useStore.getState();
            var padding = state.pad;
            var w = state.imageWidth;
            var h = state.imageHeight;

            // get the aperture we need to fit by taking padding off the stage size.
            var targetW = initialState.win.width - (2 * padding);
            var targetH = initialState.win.height - (2 * padding);

            // compute the ratios of image dimensions to aperture dimensions 
            var widthFit = targetW / w;
            var heightFit = targetH / h;

            // compute a scale for best fit and apply it
            let diffscale = w / h;
            if (diffscale < 1) {

                useStore.setState({ scrollPosition: 0 });
            }
            var scale = (widthFit > heightFit) ? ((diffscale < 1) ? widthFit : heightFit) : widthFit;

            w = parseInt(w * scale , 10);
            h = parseInt(h * scale , 10);

            let x = 0;
            let y = 0;
          //  let minusWidth = 0
            
            if (w < state.win.width) {
                x = (state.win.width - w) / 2;
            }
            if (h < state.win.height) {
                y = (state.win.height - h) / 2;
            }
            
           /*
            if (h > state.win.height) {
                y = state.win.height
                minusWidth = state.imageWidth * (state.win.height / parseFloat(state.imageHeight.toString()));
                x = minusWidth;
            }
            if (w > state.win.width) {
                x = state.win.height - minusWidth;
                y = state.imageHeight * ((state.win.width - minusWidth) / parseFloat(state.imageWidth.toString()));
            }
            */
            let sub = (1 - scale);
            const step = sub / 5; // 5 step to view
            let rpobj = { scaleStep: step, InitialScale: sub, imgscale: scale, bgImgScale: scale, bgImgW: w, bgImgH: h, bgImgX: x, bgImgY: y };
            useStore.setState(rpobj);
            let nstate = useStore.getState();
            let rescale = 1.15;
            let nscale = nstate.scaleStep + nstate.InitialScale;
            if (resize === "true") {
                if (config.console)
                    console.log(superScale)
                if (nstate.imageHeight >= nstate.maxScaleSize || nstate.imageWidth >= nstate.maxScaleSize) {
                    // rescale = (nstate.imageWidth / nstate.imageHeight) / 2;
                    let maxsize = (superScale[0].fullWidth > superScale[0].fullHeight) ? superScale[0].fullWidth : superScale[0].fullHeight;
                    rescale = (maxsize / nstate.maxScaleSize);
                    rescale = nstate.imageWidth / superScale[0].fullWidth;
                    nscale = 0.75;
                    if (config.console)
                        console.log("as", rescale, nstate.imageWidth / superScale[0].fullWidth)
                }
            } else {
                if (nstate.imageHeight >= nstate.maxScaleSize || nstate.imageWidth >= nstate.maxScaleSize) {
                    // rescale = (nstate.imageWidth / nstate.imageHeight) / 2;
                    let maxsize = (nstate.imageWidth > nstate.imageHeight) ? nstate.imageWidth : nstate.imageHeight;
                    rescale = (maxsize / nstate.maxScaleSize);
                    if (config.console)
                        console.log("as", rescale)
                }
            }
            if (config.console)
            console.log("sss", rescale, nstate.imageWidth / nstate.imageHeight)

            let nw = parseInt(nstate.bgImgW * (nscale * rescale), 10);
            let nh = parseInt(nstate.bgImgH * (nscale * rescale), 10);
            let x1 = 0;
            let y1 = 0;
            if (nstate.imageWidth > nw && nstate.imageHeight > nh) {

                if (nw > nstate.win.width || nh > nstate.win.height) {
                    let newwin = {
                        width: (nw > nstate.win.width ? (nw + (2 * padding)) : (nstate.win.width)),
                        height: (nh > nstate.win.height ? (nh + (2 * padding)) : (nstate.win.height))
                        }
                     useStore.setState({ win: newwin });
                }

                let newstate = useStore.getState();
               // if (nw < newstate.win.width) {
                    x1 = (newstate.win.width - nw) / 2;
               // }
               // if (nh < newstate.win.height) {
                    y1 = (newstate.win.height - nh) / 2;
               // }
               // console.log('resized')
            }
            let nhstate = useStore.getState();
            if (Math.abs(nh) > nhstate.win.height) {
                nh = Math.abs(nh);
                nw = Math.abs(nw);
                let newwin = {
                    width: (nw > nhstate.win.width ? (nw + (2 * padding)) : (nhstate.win.width)),
                    height: (nh > nhstate.win.height ? (nh + (2 * padding)) : (nhstate.win.height))
                }
                useStore.setState({ win: newwin });
                let absnewstate = useStore.getState();
                x1 = (absnewstate.win.width - nw) / 2;
                y1 = (absnewstate.win.height - nh) / 2;
            }
          //  console.log(nw, nh, x1, y1, scale, nscale, nstate.win, initialState.win, resize)
            let zobj = {
                bgImgScale: nscale, bgImgW: nw, bgImgH: nh, bgImgX: x1, bgImgY: y1,
                rectPadding: initialState.rectPadding * 1,
                rectWidth: initialState.rectWidth * 1,
                rectHeight: initialState.rectHeight * 1,
            };
            useStore.setState(zobj);
            let originalRegions = nstate.originalRegions;
            let newrect = newBalloonPosition(originalRegions, nstate);
            useStore.setState({
                savedDetails: false,
                drawingRegions: newrect,
                balloonRegions: newrect,
                //    isDisabledAutoB: true

            });
            let scrollElement = document.querySelector('#konvaMain');
            if (scrollElement !== null) {
                // console.log("fitToActualsize ")
                scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
            }

        });

        const dstate = useStore.getState();
        if (dstate.scrollPosition === 0) {
                requestAnimationFrame(function () {
                    let scrollElement = document.querySelector('#konvaMain');
                    if (scrollElement !== null) {
                        scrollElement.scrollLeft = ((scrollElement.scrollWidth - scrollElement.clientWidth) / 2);
                    }

                });
            } else {
                requestAnimationFrame(function () {
                    let scrollElement = document.querySelector('#konvaMain');
                    if (scrollElement !== null) {
                        scrollElement.scrollLeft = dstate.scrollPosition;
                        scrollElement.scrollTop = dstate.konvaPositionTop;

                    }
                    document.body.scrollTop = dstate.documentPositionTop

                });
            }


};

export const fitSize = () => {
    useStore.setState({ history: [], fitscreen: true, win: { width: window.innerWidth - 100, height: window.innerHeight } });
    useStore.setState({   zoomingfactor: 0, zoomed: false });
    let props = useStore.getState();
    if (props.isErrImage) {
        return;
    }

    const width = props.win.width;
    //  const width = window.innerWidth;
    const height = props.win.height;
    //  const height = window.innerHeight;
    const aspectRatio = width / height;

    let newWidth;
    let newHeight;

    const imageRatio = props.imageWidth / props.imageHeight;

    if (aspectRatio >= imageRatio) {
        newWidth = width;
        newHeight = width / aspectRatio;
    } else {
        newWidth = height * aspectRatio;
        newHeight = height;
    }
    let win = { width: newWidth, height: newHeight };
    //console.log(newWidth, newHeight)
    useStore.setState({ win: win });
    requestAnimationFrame(function () {
        let state = useStore.getState();
        let w = state.imageWidth;
        let h = state.imageHeight;

        let scaleX = state.win.width / w;
        let scaleY = state.win.height / h;

        let scale = Math.min(scaleX, scaleY);
        let nw = 0;
        let nh = 0;
        let x = 0;
        let y = 0;
        nw = w * scale;
        nh = h * scale;
        let winwidth = state.win.width;
        if (nw < state.win.width) {
            x = (winwidth - nw) / 2;
        }
        let win = { width: winwidth, height: nh };
        let rpobj = {
            win: win, bgImgScale: scale, bgImgW: nw, bgImgH: nh, bgImgX: x, bgImgY: y,
        };
        useStore.setState(rpobj);
        let nstate = useStore.getState();
        let originalRegions = nstate.originalRegions;
        let newrect = newBalloonPosition(originalRegions, nstate);
        useStore.setState({
            savedDetails: false,
            drawingRegions: newrect,
            balloonRegions: newrect,
        });

        let scrollElement = document.querySelector('#konvaMain');
        scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
        scrollElement.scrollTop = 0;
        document.body.scrollTop = 0;


    });
}
export function scalledPosition(item) {
    const props = useStore.getState();
    let scaleFactor = props.bgImgScale;
    const x = item.dx * scaleFactor;
    const y = item.dy * scaleFactor;
    const w = item.dw * scaleFactor;
    const h = item.dh * scaleFactor;
    return { x, y, w, h }
}

export function newBalloonPosition(originalRegions, state) {
    const props = useStore.getState();
 
    let pageNo = 0;
    let resize = "false";
    let superScale = [];
    if (props.drawingDetails.length > 0 && props.ItemView != null) {
        pageNo = parseInt(Object.values(props.drawingDetails)[parseInt(props.ItemView)].currentPage);
        resize = props.drawingDetails.length > 0 ? Object.values(props.drawingDetails)[parseInt(props.ItemView)].resize : "false";
        superScale = props.partial_image.filter((a) => { return a.item === pageNo; });
    }
    if (config.console)
    console.log(pageNo, resize, superScale )

    // Scalling the Original values and assign to drawingRegions
    const newballoon = originalRegions.map((item) => {
        if (config.console)
        console.log("newballoon all", item);
        if (item.Page_No === parseInt(pageNo) && item.isballooned === true) {
            // Calculate scaling factors
           //  console.log("newballoon page", item)
            //if (item.hasOwnProperty("newarr") && item.hasOwnProperty("subBalloon")  ) {
                const scaleX = props.bgImgW / props.imageWidth;
                const scaleY = props.bgImgH / props.imageHeight;
                let x = item.newarr.Circle_X_Axis * scaleX + props.bgImgX;
                let y = item.newarr.Circle_Y_Axis * scaleY + props.bgImgY;
                let w = item.newarr.Crop_Width * scaleX;
                let h = item.newarr.Crop_Height * scaleY;
             
                if (item.newarr.Crop_X_Axis === 0) { x = 28; w = item.newarr.Crop_Width; }
                if (item.newarr.Crop_Y_Axis === 0) { y = 28; h = item.newarr.Crop_Height; }

                if (scaleX === Infinity || scaleY === Infinity || x === Infinity || y === Infinity || w === Infinity || h === Infinity ) {
                    item.dx = 0;
                    item.dy = 0;
                    item.radius = 1;
                    return item;
            }
            item.Circle_X_Axis = 0;
            item.Circle_Y_Axis = 0;
            let a = item.newarr.Circle_X_Axis * scaleX + props.bgImgX;
            let b = item.newarr.Circle_Y_Axis * scaleY + props.bgImgY;
            let ma = item.newarr.Measure_X_Axis * scaleX + props.bgImgX;
            let mb = item.newarr.Measure_Y_Axis * scaleY + props.bgImgY;
            //console.log("newballoon page", parseInt(item.Balloon), a, b)
                item.dx = 0;
                item.dy = 0;
            
            let intBalloon = parseInt(item.Balloon)
            let radius = 7.5;

            switch (intBalloon.toString().length) {
                case 1:
                    radius = 7.5;
                    break;
                case 2:
                    radius = 10;
                    break;
                case 3:
                    radius = 12.5;
                    break;
                case 4:
                    radius = 15;
                    break;
                default:
                    radius = 7.5;
                    break;
            }
            item.radius = radius;
            item.x = x;
            item.y = y;
            item.width = w;
            item.height = h;
            item.Crop_X_Axis = x;
            item.Crop_Y_Axis = y;
            item.Crop_Width = w;
            item.Crop_Height = h;
            item.Circle_X_Axis = a;
            item.Circle_Y_Axis = b;
            item.Measure_X_Axis = ma;
            item.Measure_Y_Axis = mb;
            item.intBalloon = intBalloon;
            //}
            return item;
        }
        return item;
    });
    if (config.console)
    console.log("newballoon", newballoon)

    // Get all original values from API and remove part value by int of balloon to remove partial balloons
    const real = originalRegions.map(a => {
        if (config.console)
        console.log("real a", a.Page_No, pageNo, a.isballooned, props.drawingDetails)
        if (a.Page_No === pageNo && a.isballooned === true) {
            let intBalloon = parseInt(a.Balloon);
            return { ...a.newarr, intBalloon: intBalloon };
        }
        return false;
        })
        // remove false item
        .filter(item => item !== false)
        // remove duplicates propert by key as intBalloon
        .reduce((resArr, currentArr) => {
        let other = resArr.some((ele) => currentArr.intBalloon === ele.intBalloon)
        if (!other) resArr.push(currentArr)
        return resArr
    }, [])
    if (config.console)
        console.log("real", real)
    let scaleY = props.bgImgH / props.imageHeight;
    if (scaleY === 0 || scaleY === Infinity) {
        scaleY = 1;
    }
    const validNumbers = real.filter((num) => (num.Crop_Height * scaleY) <= 12 );// 
    //if (config.console)
        console.log("validNumbers", validNumbers)
    let averageValue = 0; // fallback value
    if (validNumbers.length !== 0) {
        averageValue = validNumbers.reduce((acc, num) => acc + (num.Crop_Height * scaleY), 0) / validNumbers.length;
    }
    //if (config.console)
        console.log("averageValue", averageValue)
    if (props.balloonFont === 0) {
        useStore.setState({ balloonFont: averageValue > 5 ? 8 : averageValue });
    }
    useStore.setState({ zoomoriginalRegions: [] });
    // reset the movable balloon for current page and create move action
    let thiscircles = props.zoomoriginalRegions;

    thiscircles = newballoon.map(a => {
        if (a.Page_No === pageNo && a.Circle_X_Axis === a.Crop_X_Axis) {
            a.intBalloon = parseInt(a.Balloon);
            return a;
        }
        return false;
        })
        // remove false item
        .filter(item => item !== false)
        // remove duplicates propert by key
        .reduce((resArr, currentArr) => {
            let other = resArr.some((ele) => currentArr.intBalloon === ele.intBalloon)
            if (!other) resArr.push(currentArr)
            return resArr
        }, [])
    if (config.console)
    console.log("thiscircles", thiscircles)
    let circles = [];
    circles = real.map(item => {
        const scaleX = state.bgImgW / state.imageWidth;
        const scaleY = state.bgImgH / state.imageHeight;
        let a = item.Circle_X_Axis * scaleX + state.bgImgX;
        let b = item.Circle_Y_Axis * scaleY + state.bgImgY ;
        let intBalloon = parseInt(item.Balloon)
        let radius = 10;

        switch (intBalloon.toString().length) {
            case 1:
                radius = 10;
                break;
            case 2:
                radius = 13;
                break;
            case 3:
                radius = 15;
                break;
            case 4:
                radius = 18;
                break;
            default:
                radius = 10;
                break;
        }


        if (state.fitscreen) {
            radius = radius / 1.5;
        }
       // a = item.Circle_X_Axis - circleWidth * bgImgScale;
       // b = item.Circle_Y_Axis - circleWidth * bgImgScale;
        return { x: a, y: b, id: intBalloon, radius: radius, intBalloon: intBalloon }
    }).reduce((resArr, currentArr) => {
        let other = resArr.some((ele) => currentArr.intBalloon === ele.intBalloon)
        if (!other) resArr.push(currentArr)
        return resArr
    }, [])
    if (config.console)
        console.log("extracted", circles)
    thiscircles = movablec(circles, thiscircles);
     
    useStore.setState({
        zoomoriginalRegions: thiscircles
});

    return newballoon; 

}
 

export const movablec = (circles, thiscircles) => {
    if (!circles || circles.length === 0) return thiscircles;

    const MIN_SPACING = 4; // Minimum gap between balloon edges
    const MAX_PASSES = 5;  // Multiple passes to resolve chain overlaps

    // Build a mutable position map for iterative resolution
    let positions = {};
    circles.forEach(c => {
        const tc = thiscircles.find(t => t.intBalloon === c.id);
        positions[c.id] = {
            x: c.x + (tc ? tc.dx : 0),
            y: c.y + (tc ? tc.dy : 0),
            radius: c.radius,
            origX: c.x,
            origY: c.y
        };
    });

    // Multi-pass balloon-to-balloon overlap resolution
    for (let pass = 0; pass < MAX_PASSES; pass++) {
        let anyOverlap = false;
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                const id1 = circles[i].id;
                const id2 = circles[j].id;
                const p1 = positions[id1];
                const p2 = positions[id2];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = p1.radius + p2.radius + MIN_SPACING;

                if (distance < minDist && distance > 0) {
                    anyOverlap = true;
                    const moveDistance = (minDist - distance) / 2 + 1;
                    const nx = dx / distance;
                    const ny = dy / distance;

                    p1.x -= nx * moveDistance;
                    p1.y -= ny * moveDistance;
                    p2.x += nx * moveDistance;
                    p2.y += ny * moveDistance;
                } else if (distance === 0) {
                    // Exact same position — push apart diagonally
                    anyOverlap = true;
                    p1.x -= p1.radius + 2;
                    p2.x += p2.radius + 2;
                }
            }
        }
        if (!anyOverlap) break;
    }

    // Apply resolved positions back to thiscircles as dx/dy offsets
    thiscircles = thiscircles.map(item => {
        const p = positions[item.intBalloon];
        if (p) {
            let newDx = p.x - p.origX;
            let newDy = p.y - p.origY;
            if (isNaN(newDx)) newDx = 0;
            if (isNaN(newDy)) newDy = 0;
            return { ...item, dx: newDx, dy: newDy };
        }
        return item;
    });

    return thiscircles;
}
export function ballonOriginalPosition(newone) {
   // console.log("ballonOriginalPosition",newone)
    const props = useStore.getState();
    const scaleX = props.bgImgW / props.imageWidth;
    const scaleY = props.bgImgH / props.imageHeight;
    let old_Circle_X_Axis = 0;
    let old_Circle_Y_Axis = 0;
    if (newone.hasOwnProperty("newarr")) {
        old_Circle_X_Axis = newone.newarr.Circle_X_Axis;
        old_Circle_Y_Axis = newone.newarr.Circle_Y_Axis;
    }
    let scaledX = old_Circle_X_Axis + (newone.xx / scaleX);
    let scaledY = old_Circle_Y_Axis + (newone.xy / scaleY);
    return { x: scaledX, y: scaledY };
}

export function originalPosition(newone) {
    const props = useStore.getState();
 
    let pageNo = 0;
    let resize = "false";
    if (props.drawingDetails.length > 0 && props.ItemView != null) {
        pageNo = parseInt(Object.values(props.drawingDetails)[parseInt(props.ItemView)].currentPage);
        resize = Object.values(props.drawingDetails)[parseInt(props.ItemView)].resize ;
    }
    if (config.console)
    console.log(pageNo, resize)
    //return false;
    let originalImageWidth = props.imageWidth;
    let originalImageHeight = props.imageHeight;
    let scaledImageWidth = props.bgImgW;
    let scaledImageHeight = props.bgImgH;
    // Rectangle position and size on the scaled image
    let scaledX = newone.x;
    let scaledY = newone.y;
    let scaledWidth = newone.width;
    let scaledHeight = newone.height;
    // Calculate scaling factors
    const scaleX = originalImageWidth / scaledImageWidth;
    const scaleY = originalImageHeight / scaledImageHeight;
    // Calculate original position and size
    let x = 0; let y = 0; let width = 0; let height = 0;
    let newX = scaledX - props.bgImgX;
    let newY = scaledY - props.bgImgY;
    let newW = scaledWidth * scaleX;
    let newH = scaledHeight * scaleY;
    const originalX = newX * scaleX;
    const originalY = newY * scaleY;

    // console.log("Original",originalX, originalY, newW, newH)
    // Find x position from the Canvas
    if (Math.sign(newX) === -1) {
        x = 0;
    } else if (newX < props.imageWidth) {
        x = originalX;
    } else {
        x = props.imageWidth;
    }
    // Find y position from the Canvas
    if (Math.sign(newY) === -1) {
        y = 0;
    } else if (newY < props.imageHeight) {
        y = originalY;
    } else {
        y = props.imageHeight;
    }
    // Find Width position from the Canvas
    if (Math.sign(newW) === -1) {
        width = 0;
    } else if (newW < props.imageWidth) {
        width = newW;
    } else {
        width = props.imageWidth;
    }
    // Find Height position from the Canvas
    if (Math.sign(newH) === -1) {
        height = 0;
    } else if (newH < props.imageHeight) {
        height = newH;
    } else {
        height = props.imageHeight;
    }
    return { x, y, width, height };
}

export const rotatePoint = ({ x, y }, rad) => {
    const rcos = Math.cos(rad);
    const rsin = Math.sin(rad);
    return { x: x * rcos - y * rsin, y: y * rcos + x * rsin };
};

export const rotateAroundCenter = (node, rotation) => {
    const topLeft = { x: -node.width / 2, y: -node.height / 2 };
    const current = this.rotatePoint(topLeft.x, topLeft.y, 0);
    const rotated = this.rotatePoint(topLeft.x, topLeft.y, 90);
    const dx = rotated.x - current.x,
        dy = rotated.y - current.y;

    node.rotation(rotation);

    node.x(node.x() + dx);
    node.y(node.y() + dy);

    return node;
}

export const GetRotatePosition = (rotation) => {
    const state = useStore.getState();
    // let bgImgRotation = state.bgImgRotation;
    var padding = state.pad;
    var w = state.imageWidth;
    var h = state.imageHeight;

    // get the aperture we need to fit by taking padding off the stage size.
    var targetW = state.win.width - (2 * padding);
    var targetH = state.win.height - (2 * padding);

    // compute the ratios of image dimensions to aperture dimensions 
    var widthFit = targetH / w;
    var heightFit = targetW / h;

    // compute a scale for best fit and apply it
    var scale = (widthFit > heightFit) ? heightFit : widthFit;

    w = parseInt(w * scale, 10);
    h = parseInt(h * scale, 10);

    let x = 0;
    let y = 0;
    if (w < state.win.height) {
        x = (state.win.height - w) / 2;
    }
    if (h < state.win.width) {
        y = (state.win.width - h) / 2;
    }
    let rpobj = { x, y, w, h }
    if (rotation === 360 || rotation === 0) {
        rpobj = { bgImgX: 0, bgImgY: 0 };
        //  useStore.setState(rpobj);
    } else {
        rpobj = { bgImgX: 1315, bgImgY: 0 };
        //  useStore.setState(rpobj);
    }

    return rpobj;
}

export const validate = (drawingNo, revNo) => {

    const errors = [];
    if (drawingNo.length === 0) {

        errors.push({ field: "drawingNo", "message": "Drawing.No can't be empty" });
    }
    if (revNo.length === 0) {

        errors.push({ field: "revNo", "message": "Revision.No can't be empty" });
    }
    return errors;
}

export const validateSearch = (state) => {

    const errors = [];
    const r = (state.user[0].role === "Admin" || state.user[0].role === "Supervisor") ? true : false;
    if (state.drawingNo.trim().length === 0) {

        errors.push({ field: "drawingNo", "message": "Drawing.No can't be empty" });
    }
    if (state.revNo.trim().length === 0) {

        errors.push({ field: "revNo", "message": "Revision.No can't be empty" });
    }
    if (state.routerno.trim().length === 0) {
        if(!r)
        errors.push({ field: "routerno", "message": "Router.No can't be empty" });
    }
    if (state.MaterialQty.trim().length === 0) {
        if (!r)
        errors.push({ field: "MaterialQty", "message": "MaterialQty can't be empty" });
    }
    return errors;
}

export const shortBalloon = (json, prop) => {

    return json.sort(function (a, b) {
        if (parseFloat(a[prop]) > parseFloat(b[prop])) {
            return 1;
        } else if (parseFloat(a[prop]) < parseFloat(b[prop])) {
            return -1;
        }
        return 0;
    });

}

export const showAlert = (title, text) => {
  const isError = title.toLowerCase() === 'error';
  return  Swal.fire({
        title: title,
        html: text,
        icon: isError ? 'error' : 'info',
        confirmButtonText: 'OK',
        customClass: { popup: 'swal-professional' },
        buttonsStyling: true
    });
}

export const showAlertOnReset = () => {
    Swal.fire({
        title: 'Do you want to Clear Drawing?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            const { user, sessionId,roles } = useStore.getState();
            // Clear persisted drawing info so refresh doesn't auto-reload
            sessionStorage.removeItem('lastDrawingNo');
            sessionStorage.removeItem('lastRevNo');
            sessionStorage.removeItem('lastSessionId');
            useStore.setState({
                ...initialState, originalRegions: [],
                draft: [], sidebarIsOpen: false, roles: roles,
                user: user, sessionId: sessionId, Convert_to_mm: false
            });
            seo({
                title: '',
                metaDescription: config.APP_TITLE
            });
           // const element = document.getElementById("DrawingNo");
           // window.setTimeout(() => element.focus(), 0);
        }
    })
}

export const seo = (data = {}) => {
    data.title = data.title || config.APP_TITLE;
    data.metaDescription = data.metaDescription || config.APP_TITLE;
    if (config.console)
    console.log(data)
    document.title = (data.title !== '' && data.title !== config.APP_TITLE ) ? `${data.title} | ${config.APP_TITLE}` : config.APP_TITLE;
   // document.querySelector('meta[name="description"]').setAttribute('content', data.metaDescription);
}

export const simulateMouseClick = (el) => {
    let opts = { view: window, bubbles: true, cancelable: true, buttons: 1 };
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    el.dispatchEvent(new MouseEvent("click", opts));
}

export const nthElement = (arr, n = 0) =>
    (n === -1 ? arr.slice(n) : arr.slice(n, n + 1))[0];

export const MultipleDelete = (deleteItem) => {
    const { originalRegions } = useStore.getState();

    useStore.setState({ isLoading: true, loadingText: "Delete Balloon... Please Wait..." });

    let newrects = originalRegions.filter((item) => !deleteItem.includes(parseInt(item.Balloon)));

    setTimeout(() => {
        //const agOverData = JSON.parse(JSON.stringify(newrects));
        const agOverData = [...newrects];
        let agOverSingle = agOverData.reduce((res, item) => {
            if (!res[parseInt(item.Balloon)]) {
                res[parseInt(item.Balloon)] = item;
            }
            return res;
        }, []);


        let unique = Object.values(agOverSingle);
        if (config.console)
            console.log("td", unique)

        //useStore.setState({ isLoading: false });
        //return false;
        let qtyi = 0;
        // get all quantity parent
        let Qtyparent = agOverData.reduce((res, item) => {
            if (item.hasOwnProperty("subBalloon") && item.subBalloon.length >= 0 && item.Quantity > 1) {
                res[qtyi] = item;
                qtyi++;
            }
            return res;
        }, []);
        if (config.console)
            console.log("td", Qtyparent, newrects)

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
                newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: id, DrawLineID: i, Balloon: pb });
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

                    let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b };
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
                    newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b });
                }
            }
            if (curr.Quantity > 1 && curr.subBalloon.length > 0) {
                for (let qi = 1; qi <= curr.Quantity; qi++) {
                    if (qi > config.maxBalloonQty) { break; }
                    const qid = uuid();
                    let pb = parseInt(curr.Balloon).toString() + "." + qi.toString();


                    let newMainItem = Qtyparent.map(item => {
                        if (pb === item.Balloon) {
                            return item;
                        }
                        return false;
                    }).filter(x => x !== false);
                    if (newMainItem.length > 0) {
                        let nmi = newMainItem[0];
                        pb = parseInt(Balloon).toString() + "." + qi.toString();
                        prev.push({ b: pb, c: prev.length + 1 })
                        let i = prev.length;

                        newarr.push({ ...nmi, newarr: { ...nmi.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
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
                            let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sqid, DrawLineID: i, Balloon: b };
                            newarr.push(setter);
                            return e;
                        })

                    }
                    if (config.console)
                        console.log("td", newMainItem, pb)

                }

            }

            newitems = newitems.slice();
            newitems.splice(newitems.length, 0, ...newarr);

            return prev;
        }, []);
        if (config.console)
            console.log("Table delete", newitems)
        const newstate = useStore.getState();
        let pageNo = 0;

        if (newstate.drawingDetails.length > 0 && newstate.ItemView !== null) {
            pageNo = Object.values(newstate.drawingDetails)[parseInt(newstate.ItemView)].currentPage;
        }
        let AfterPageData = newitems.map((item) => {
            if (parseInt(item.Page_No) === parseInt(pageNo)) {
                return item;
            }
            return false;
        }).filter(item => item !== false);
        if (AfterPageData.length === 0) {
            let cc = newstate.controllCopy.filter(x => parseInt(x.pageNo) === parseInt(pageNo));
            if (config.console)
                console.log(cc)
            if (cc.length > 0) {
                newstate.controllCopy.map((x) => {
                    if (parseInt(x.pageNo) === parseInt(pageNo)) {
                        x.textGroupPlaced = false;
                    }
                    return x;
                })
                if (config.console)
                    console.log(newstate.controllCopy)
            }
        }

        let newrect = newBalloonPosition(newitems, newstate);
        useStore.setState({
            originalRegions: newitems,
            draft: newitems,
            drawingRegions: newrect,
            balloonRegions: newrect
        });
        setTimeout(() => {
            useStore.setState({ ItemView: null });
        }
            , 200);
        setTimeout(() => {
            useStore.setState({ ItemView: newstate.ItemView });
        }
            , 200);
        useStore.setState({ isLoading: false });

    }, 300);
}

// #endregion

// #region  Data Table Start
export const DoublingEditor = React.memo(
    React.forwardRef((props, ref) => {
        const [value, setValue] = React.useState(props.value);
        const refInput = React.useRef(null);

        React.useEffect(() => {
            refInput.current.focus();
        }, []);

        /* Component Editor Lifecycle methods */
        React.useImperativeHandle(ref, () => {
            return {
                getValue() {
                    return value;
                },
                isCancelBeforeStart() {
                    return false;
                },
                isCancelAfterEnd() {
                    return false;
                },
            };
        });

        return (
            <input
                type="text"
                ref={refInput}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="doubling-input"
            />
        );
    })
);

export const transactionData = () => {
    const props = useStore.getState();
    let originalRegions = props.originalRegions;
    let pageNo = 0;

    if (props.drawingDetails.length > 0 && props.ItemView != null) {
        pageNo = parseInt(Object.values(props.drawingDetails)[parseInt(props.ItemView)].currentPage);
    }

    const newrects = originalRegions.map((item) => {
        if (!item.hasOwnProperty("newarr")) {
            return false;
        } 
        if (item.hasOwnProperty("isDeleted") && item.isDeleted) {
            return false;
        }
        if (item.isballooned !== true) {
            //return false;
        }
        //console.log(item)
        if (item.Page_No === pageNo ) {
            const scaleX = props.bgImgW / props.imageWidth;
            const scaleY = props.bgImgH / props.imageHeight;
            let x = item.newarr.Crop_X_Axis * scaleX + props.bgImgX;
            let y = item.newarr.Crop_Y_Axis * scaleY + props.bgImgY;
            let w = item.newarr.Crop_Width * scaleX;
            let h = item.newarr.Crop_Height * scaleY;
            if (item.newarr.Crop_X_Axis === 0) { x = 28; w = item.newarr.Crop_Width; }
            if (item.newarr.Crop_Y_Axis === 0) { y = 28; h = item.newarr.Crop_Height; }
           // let cx = item.newarr.Circle_X_Axis * scaleX + props.bgImgX;
           // let cy = item.newarr.Circle_Y_Axis * scaleY + props.bgImgY;
            item.x = x;
            item.y = y;
            item.width = w;
            item.height = h;
            item.Crop_X_Axis = x;
            item.Crop_Y_Axis = y;
            item.Crop_Width = w;
            item.Crop_Height = h;
            if (item.newarr.MinusTolerance === "0" || item.newarr.MinusTolerance === "-0" ) {
                item.MinusTolerance = "-0"
            }
            if (item.newarr.PlusTolerance === "0" || item.newarr.PlusTolerance === "+0" ) {
                item.PlusTolerance = "+0"
            }
            
            //item.Circle_X_Axis = cx;
            //item.Circle_Y_Axis = cy;
            item.intBalloon = parseInt(item.Balloon);
            const isInteger = item.Balloon % 1 === 0;
            if (isInteger) {
                item.hypenBalloon = item.Balloon;
            } else {
                item.hypenBalloon = item.Balloon.replaceAll(".","-");
            }
            return item;
        }
        return false;
    }).filter(item => item !== false);
    
    let a = shortBalloon(newrects, "DrawLineID")
    //console.log(a)
    return a;
};

export const myCellRenderer = params => {
    return '';
};

export const moveInArray = (arr, fromIndex, toIndex) => {
    if (toIndex === 0) {
      //  toIndex = 1;
    }
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}
function getGridBalloon(data) {
    let unique = data.map(d => d.intBalloon).filter(a => a !== '');
    unique = [...new Set(unique)];
    return unique;
}
function getMin(data) {
    return Math.min(...getGridBalloon(data));
}
function getMax(data) {
    return Math.max(...getGridBalloon(data));
}

function getdataList(pageData, Listballoon) {
    const resetOverData = [...pageData];

    let resetOvergroup = resetOverData.reduce((acc, obj) => {
        let key = obj.Balloon.toString().split('.')[0];
        acc[key] = acc[key] || [];
        acc[key].push(obj);
        return acc;
    }, {});
    let grouped = Object.values(resetOvergroup);
    let ui = 1;
    let resetOverSingle = resetOverData.reduce((res, item) => {
        if (!res[parseInt(item.Balloon)] && item.hasOwnProperty("subBalloon")) {
            let Balloon = ui.toString();
            ui++;
            res[parseInt(item.Balloon)] = { ...item, Balloon: Balloon, newarr: { ...item.newarr, Balloon: Balloon }, Old: parseInt(item.Balloon) };
        }
        return res;
    }, []).filter((a) => a);
    let unique = Object.values(resetOverSingle);
    let dragunique = shortBalloon(unique, "Balloon");
    let c = grouped.reduce((res, curr) => {
        if (!res[parseInt(curr[0].Balloon)] && curr[0].hasOwnProperty("subBalloon") && curr[0].subBalloon.length > 0 && curr[0].Quantity > 1) {
            res[parseInt(curr[0].Balloon)] = { key: parseInt(curr[0].Balloon), value: curr }
        }
        return res;
    }, []);
    let qtygroup = c.filter((a) => a);
    let newitems = [];
    let counter = dragunique.reduce((prev, curr,index) => {
        const id = uuid();
        let newarr = [];
        let Balloon = Listballoon.length + 1 + index;
        Balloon = Balloon.toString();
        if (curr.Quantity === 1 && curr.subBalloon.length === 0) {
            prev.push({ b: (Balloon), c: prev.length + 1 })
            let i = prev.length;
            newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: Balloon }, id: id, DrawLineID: i, Balloon: Balloon });
        }
        if (curr.Quantity === 1 && curr.subBalloon.length > 0) {
            let newsubItem = curr.subBalloon.filter(a => { return a.isDeleted === false; });
            let pb = parseInt(Balloon).toString();
            if (newsubItem.length > 0) {
                pb = parseInt(Balloon).toString() + ".1";
            }

            prev.push({ b: pb, c: prev.length + 1 })
            let i = prev.length;
            newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: id, DrawLineID: i, Balloon: pb });
            newsubItem.map(function (e, ei) {
                let sno = ei + 2;
                const sid = uuid();
                let b = parseInt(Balloon).toString() + "." + sno.toString();
                prev.push({ b: b, c: prev.length + 1 })
                let i = prev.length;
                if (e.hasOwnProperty("Isballooned"))
                    delete e.Isballooned;
                if (e.hasOwnProperty("Id"))
                    delete e.Id;

                let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b };
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
                newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b });
            }
        }
        if (curr.Quantity > 1 && curr.subBalloon.length > 0) {
            let line = qtygroup.filter(a => {
                if (parseInt(a.key) === parseInt(curr.Old)) { return a.value; }
                return false;
            }).filter(a => a);
            if (line.length > 0) {
                line[0].value.map(item => {
                    let key = item.Balloon.toString().split('.');
                    key[0] = Balloon.toString();
                    let pb = key.join('.');
                    if (config.console)
                        console.log(pb, parseInt(curr.Balloon), key, item)
                    prev.push({ b: pb, c: prev.length + 1 })
                    let i = prev.length
                    const qid = uuid();
                    newarr.push({ ...item, newarr: { ...item.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
                    return item;
                });
            }


        }

        newitems = newitems.slice();
        newitems.splice(newitems.length, 0, ...newarr);

        return prev;
    }, []);
    let prevOvergroup = newitems.reduce((acc, obj) => {
        let key = obj.Balloon.toString().split('.')[0];
        acc[key] = acc[key] || [];
        acc[key].push(obj);
        return acc;
    }, {});
    let prevgrouped = Object.values(prevOvergroup);

    return { items: [...newitems], group: [...prevgrouped], counter: [...counter] };
}

// Function to set the scroll position from outside the component

const DeleteComponent = (props) => {
    return (
        <>
            <img src={del} alt={props.alt} className="icon" />
        </>
    );
};

export const CustomHeader = ( props ) => {

    const handleClick = (event) => {
        
        window.agHandleDelClick(event);
    };

    return (
        <div className="custom-header">

            <button onClick={handleClick} style={{ marginLeft: '0px' }} className={"light-btn btn buttons primary primary_hover " }>
                <DeleteComponent alt={props.displayName} />
            </button>
        </div>
    );
};

export const transactionDataColumns = (ref) => {
    const props = useStore.getState();
    const r = (props.user[0].role === "Admin" || props.user[0].role === "Supervisor") ? true : false;
    const valueCellRenderer = (params) => {
       // console.log(params.data)
        if (params.data.convert) {
            return params.value;
        }
    };

    let _window = window;
  
    _window['agHandleDelClick'] = (event) => {
        event.preventDefault();
        event.stopPropagation();
       // console.log(event)
        const selectedData = ref.current.api.getSelectedRows();
       // console.log(event, selectedData)
        var deleteItem = selectedData.map(s => parseInt(s.Balloon)).reduce((resArr, currentArr) => {
            let other = resArr.some((ele) => currentArr === ele)
            if (!other) resArr.push(currentArr)
            return resArr
        }, []);
        if (deleteItem.length === 0) return false;
        Swal.fire({
            title: `Are you want to delete Balloon (${deleteItem})?`,
            showCancelButton: true,
            confirmButtonText: 'Yes',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {

            if (result.isConfirmed) {
                MultipleDelete(deleteItem);
            }
        });
        return false;

    };
 

    return  [
        
        {
            field: 'Balloon',
            headerName: "Balloon No",
            checkboxSelection: true,
           // suppressMovable: true,
            cellRenderer: myCellRenderer,
            headerCheckboxSelection: true,
            headerComponentFramework: CustomHeader, 
            headerComponentParams: { displayName: 'Delete Selected'},
            /*
            headerComponentParams: {
                template: 
                    '<div>' +

                    `<button onclick="agHandleDelClick" ref="eCustomButton" class="light-btn btn buttons primary primary_hover ">` +
                    `<img src="${del}" alt="Delete Selected" class="icon">` +
                    '</button> ' +
                    '</div>' 
            },
            */
            maxWidth: 120,
            cellClass: ["ag-cell--normal text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
         //   lockPosition: 'left',
            resizable: false,
            hide: ( !r ? true : false),
            rowDrag: true
        },

        {
            field: 'hypenBalloon',
            headerName: 'Balloon No',
            cellClass: ["ag-cell--normal text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            //   suppressMovable: true,
            maxWidth: 200,

            editable: (params) => {
                if (r) {
                    const isInteger = params.data.Balloon % 1 === 0;
                    console.log(isInteger, params.data.Balloon);
                    return isInteger;
                }
                return false;
            },
            lockPosition: 'right',
            valueSetter: (params) => {
                console.log('valueSetter: ', params);
                let allBalloon = getGridBalloon(transactionData());
                let getMinv = getMin(transactionData());
                let getMaxv = getMax(transactionData());
                var newValInt = parseInt(params.newValue);
                var oldValInt = parseInt(params.oldValue);
                if (config.console)
                    console.log(getMinv, getMaxv)
               
                if (newValInt && allBalloon.includes(newValInt) && oldValInt !== newValInt) {
                    Swal.fire({
                        title: "Are you sure?",
                        html: `To move the Balloon from ${oldValInt} to ${newValInt}`,
                        icon: "",
                        showCancelButton: true,
                        confirmButtonText: "OK",
                    }).then((r) => {
                        if (r.isConfirmed) {
                            let immutableStore = transactionData();
                            let sortable = params.api.rowModel.rootNode.allLeafChildren.map(a => a.data);
                            var movingData = params.node.data;
                            var overTemp = sortable.filter((item) => { return parseInt(item.Balloon) === newValInt; });
                            var overData = Object.values(overTemp)[0];
                            if (oldValInt > newValInt) {
                                overData = Object.values(overTemp)[0];
                            } else {
                                overData = Object.values(overTemp)[overTemp.length - 1];
                            }
                            
                            var fromIndex = immutableStore.indexOf(movingData);
                            var toIndex = immutableStore.indexOf(overData);
                            var newStore = immutableStore.slice();
                            
                            moveInArray(newStore, fromIndex, toIndex);
                            useStore.setState({ isLoading: true, loadingText: "Saving Balloons... Please Wait..." });
                            setTimeout(() => {

                                const { ItemView, drawingDetails, originalRegions } = useStore.getState();

                                let pageNo = 0;


                                if (drawingDetails.length > 0 && ItemView != null) {
                                    pageNo = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
                                }

                                let prevPageData = originalRegions.map((item) => {
                                    if (parseInt(item.Page_No) < parseInt(pageNo)) {
                                        return item;
                                    }
                                    return false;
                                }).filter(item => item !== false);

                                let nextPageData = originalRegions.map((item) => {
                                    if (parseInt(item.Page_No) > parseInt(pageNo)) {
                                        return item;
                                    }
                                    return false;
                                }).filter(item => item !== false);

                                let p = getdataList(prevPageData, []);
                                //console.log(p)
                                let prevgrouped = p.group;
                                //const resetOverData = JSON.parse(JSON.stringify(newStore));
                                const resetOverData = [...newStore];

                                let resetOvergroup = resetOverData.reduce((acc, obj) => {
                                    let key = obj.Balloon.toString().split('.')[0];
                                    acc[key] = acc[key] || [];
                                    acc[key].push(obj);
                                    return acc;
                                }, {});
                                let grouped = Object.values(resetOvergroup);
                                let uii = 1;
                                let OverSingle = grouped.reduce((res, curr) => {
                                    if (!res[parseInt(uii)] && curr[0].hasOwnProperty("subBalloon")) {
                                        res[parseInt(uii)] = { uii: uii, key: parseInt(curr[0].Balloon), value: curr }
                                        uii++;
                                    }
                                    return res;
                                }, []).filter((a) => a);

                                let ui = 1;
                                let resetOverSingle = resetOverData.reduce((res, item) => {
                                    if (!res[parseInt(item.Balloon)] && item.hasOwnProperty("subBalloon")) {
                                        let Balloon = ui.toString();
                                        ui++;
                                        res[parseInt(item.Balloon)] = { ...item, Balloon: Balloon, newarr: { ...item.newarr, Balloon: Balloon }, Old: parseInt(item.Balloon) };
                                    }
                                    return res;
                                }, []).filter((a) => a);


                                let unique = Object.values(resetOverSingle);
                                let dragunique = shortBalloon(unique, "Balloon");
                                if (config.console)
                                    console.log(dragunique)

                                let c = grouped.reduce((res, curr) => {
                                    if (!res[parseInt(curr[0].Balloon)] && curr[0].hasOwnProperty("subBalloon") && curr[0].subBalloon.length > 0 && curr[0].Quantity > 1) {
                                        res[parseInt(curr[0].Balloon)] = { key: parseInt(curr[0].Balloon), value: curr }
                                    }
                                    return res;
                                }, []);
                                let qtygroup = c.filter((a) => a);
                                if (config.console)
                                    console.log(resetOverSingle, OverSingle, unique, dragunique, qtygroup)
                                //useStore.setState({ isLoading: false });
                                //return false;
                                let newitems = [];
                                //15�
                             
                                dragunique.reduce((prev, curr,index) => {
                                    const id = uuid();
                                    let newarr = [];
                                    let Balloon = prevgrouped.length + 1 + index;
                                    Balloon = Balloon.toString();
                                    if (curr.Quantity === 1 && curr.subBalloon.length === 0) {
                                        prev.push({ b: (Balloon), c: prev.length + 1 })
                                        let i = prev.length;
                                        newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: Balloon }, id: id, DrawLineID: i, Balloon: Balloon });
                                    }
                                    if (curr.Quantity === 1 && curr.subBalloon.length > 0) {
                                        let newsubItem = curr.subBalloon.filter(a => { return a.isDeleted === false; });
                                        let pb = parseInt(Balloon).toString();
                                        if (newsubItem.length > 0) {
                                            pb = parseInt(Balloon).toString() + ".1";
                                        }
                                       // console.log(curr, pb, newsubItem)
                                        prev.push({ b: pb, c: prev.length + 1 })
                                        let i = prev.length;
                                        newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: id, DrawLineID: i, Balloon: pb });
                                        newsubItem.map(function (e, ei) {
                                            let sno = ei + 2;
                                            const sid = uuid();
                                            let b = parseInt(Balloon).toString() + "." + sno.toString();
                                            prev.push({ b: b, c: prev.length + 1 })
                                            let i = prev.length;
                                            if (e.hasOwnProperty("Isballooned"))
                                                delete e.Isballooned;
                                            if (e.hasOwnProperty("Id"))
                                                delete e.Id;

                                            let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b };
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
                                            newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b });
                                        }
                                    }
                                    if (curr.Quantity > 1 && curr.subBalloon.length > 0) {
                                        let line = qtygroup.filter(a => {
                                            if (parseInt(a.key) === parseInt(curr.Old)) { return a.value; }
                                            return false;
                                        }).filter(a => a);
                                        if (line.length > 0) {
                                            line[0].value.map(item => {
                                                let key = item.Balloon.toString().split('.');
                                                key[0] = Balloon.toString();
                                                let pb = key.join('.');
                                                if (config.console)
                                                    console.log(pb, parseInt(curr.Balloon), key, item)
                                                prev.push({ b: pb, c: prev.length + 1 })
                                                let i = prev.length
                                                const qid = uuid();
                                                newarr.push({ ...item, newarr: { ...item.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
                                                return item;
                                            });
                                        }


                                    }

                                    newitems = newitems.slice();
                                    newitems.splice(newitems.length, 0, ...newarr);

                                    return prev;
                                }, []);
                                if (config.console)
                                    console.log(newitems)
                                let prevOvergroup = newitems.reduce((acc, obj) => {
                                    let key = obj.Balloon.toString().split('.')[0];
                                    acc[key] = acc[key] || [];
                                    acc[key].push(obj);
                                    return acc;
                                }, {});
                                let prevovergrouped = Object.values(prevOvergroup);

                                let ne = getdataList(nextPageData, [...p.group,...prevovergrouped]);

                                //console.log([...prevovergrouped, ...p.group])
                                newitems = [...p.items, ...newitems, ...ne.items];
                                //console.log(newitems)
                               // useStore.setState({ isLoading: false });
                               // return;
                               
                                let currentPageData = newitems.map((item) => {
                                    if (parseInt(item.Page_No) === parseInt(pageNo)) {
                                        return item;
                                    }
                                    return false;
                                }).filter(item => item !== false);
                                params.api.setRowData(currentPageData);
                                params.api.clearFocusedCell();
                                useStore.setState({
                                    originalRegions: newitems,
                                    savedDetails: ((newitems.length > 0) ? true : false),
                                    drawingRegions: [],
                                    balloonRegions: []
                                });
                                const newstate = useStore.getState();
                                if (newstate.savedDetails) {
                                    let originalRegions = newstate.originalRegions;
                                    let newrect = newBalloonPosition(originalRegions, newstate);
                                    useStore.setState({
                                        drawingRegions: newrect,
                                        balloonRegions: newrect,
                                    });
                                }
                                setTimeout(() => { useStore.setState({ ItemView: null }); }, 1);
                                setTimeout(() => { useStore.setState({ ItemView: newstate.ItemView }); }, 2);
                                useStore.setState({ isLoading: false });
                            }, 300);
                        }

                    });
                    return newValInt;
                } else {
                    return oldValInt;
                }
                
            }
        },
        {
            headerName: "",
            field: "validationStatus",
            maxWidth: 40,
            width: 40,
            editable: false,
            sortable: false,
            filter: false,
            resizable: false,
            cellRenderer: (params) => {
                const flags = params.data.validationFlags || [];
                if (flags.length === 0) return '';
                const hasError = flags.some(f => f.severity === 'error');
                const icon = hasError ? '\u26A0' : '\u2139';
                const color = hasError ? '#d32f2f' : '#f57c00';
                return `<span style="color:${color};font-size:16px;cursor:pointer" title="${flags.map(f => f.suggestion || f.issue || '').join('; ')}">${icon}</span>`;
            },
            onCellClicked: (params) => {
                const flags = params.data.validationFlags || [];
                if (flags.length === 0) return;
                const flagHtml = flags.map(f => {
                    const color = f.severity === 'error' ? '#d32f2f' : '#f57c00';
                    return `<div style="margin-bottom:8px;padding:8px;border-left:3px solid ${color};background:#fff8f0;">
                        <b style="color:${color}">${(f.issue || '').replace(/_/g, ' ').toUpperCase()}</b><br/>
                        <span>${f.suggestion || ''}</span>
                    </div>`;
                }).join('');
                Swal.fire({
                    title: `Balloon ${params.data.Balloon} - Issues`,
                    html: flagHtml,
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                    showCancelButton: true,
                    cancelButtonText: 'Close',
                });
            }
        },
        {
            field: 'Spec',
            headerName: 'Specification',
            editable: false,
            cellClass: ["ag-cell--math text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            lockPosition: 'right',
            cellEditor: DoublingEditor,
            tooltipField: "Spec",
            tooltipComponent: "customTooltip",
        },
        {
            headerName: "Inches To MM",
            field: "converted",
            cellClass: ["ag-cell--math text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            lockPosition: 'right',
            hide: !props.Convert_to_mm,
            cellRenderer: valueCellRenderer,
            tooltipField: "converted",
            tooltipComponent: "customTooltip",
            editable: false
        },
        {
            field: 'Characteristics',
            headerName: 'Characteristics',
            editable: false,
            cellClass: ["ag-cell--math text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            lockPosition: 'right',
            tooltipField: "Characteristics",
            tooltipComponent: "customTooltip",
        },
        {
            field: 'Unit',
            headerName: 'Unit',
            editable: false,
            cellClass: ["ag-cell--math text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            lockPosition: 'right',
        },
        {
            field: 'ToleranceType',
            headerName: 'Tolerance Type',
            editable: false,
            cellClass: ["ag-cell--math text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            lockPosition: 'right',
        },
        {
            field: 'Minimum',
            headerName: 'Min Value',
            editable: false,
            cellClass: ["ag-cell--math text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            lockPosition: 'right',
            cellStyle: (params) => {
                if (params.data.hasValidationIssue) {
                    const flags = params.data.validationFlags || [];
                    const hasError = flags.some(f => f.severity === 'error');
                    return { backgroundColor: hasError ? '#ffebee' : '#fff3e0' };
                }
                return null;
            },
        },
        {
            field: 'Maximum',
            headerName: 'Max Value',
            editable: false,
            cellClass: ["ag-cell--math text-center"],
            headerClass: "header-center",
            filter: false,
            sortable: false,
            lockPosition: 'right',
            cellStyle: (params) => {
                if (params.data.hasValidationIssue) {
                    const flags = params.data.validationFlags || [];
                    const hasError = flags.some(f => f.severity === 'error');
                    return { backgroundColor: hasError ? '#ffebee' : '#fff3e0' };
                }
                return null;
            },
        },
        {
            headerName: "",
            field: "riskLevel",
            width: 35,
            maxWidth: 40,
            editable: false,
            sortable: false,
            filter: false,
            lockPosition: 'right',
            cellRenderer: (params) => {
                const risk = params.data?.riskLevel;
                if (!risk || risk === "none") return "";
                const colors = { high: "#f44336", medium: "#ff9800", low: "#4caf50" };
                const labels = { high: "High risk", medium: "Medium risk", low: "Low risk" };
                const data = params.data?.riskData;
                const tooltip = data
                    ? `${labels[risk]}: Failed ${data.fail_count || data.failCount || 0}/${data.total_inspections || data.totalInspections || 0} (${data.fail_rate || data.failRate || 0}%)`
                    : labels[risk] || "";
                return `<span title="${tooltip}" style="color:${colors[risk]};cursor:pointer;font-size:14px;">&#9679;</span>`;
            }
        }
        
    ] 
};

export const CustomTooltip = (props) => {
    if (!props.value) {
        return null; // Do not render tooltip if there's no value
    }

    const customStyle = {
        backgroundColor: "#000",
        color: "#fff",
        padding: "5px 10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontFamily: "'IMS', sans-serif", // Your custom font family
        fontSize: "14px",
    };

    return (
        <div style={customStyle}>
            {props.value} {/* Tooltip text */}
        </div>
    );
};

export const AGTable = (props) => {
    // let state = useStore.getState();
    //console.log("ssss",props);
    const prevProps = React.useRef();
    const gridRef = React.useRef(null);
    const defaultColDef = React.useMemo(() => {
        return {
            editable: false,
            sortable: false,
            resizable: true,
            filter: false,
            flex: 1,
            minWidth: 100,
        };
    }, []);
    const DeSelectDataGrid = () => {
        gridRef.current.api.deselectAll();
        useStore.setState({ selectedBalloon: null, selectedGridBalloons: [] });
    }
    /*
    const onGridReady = React.useCallback((params) => {
       
        params.api.setRowData(transactionData());
    }, []);
 
    const onRowDragMove = (e) => {
        if (config.console)
            console.log('onRowDragMove', e);
    }
    */

    const onRowDragEnd = (e) => {
       // if (config.console)
        console.log('onRowDragEnd', e);
        let s = [];
        e.api.forEachLeafNode((node) => {
            
            s.push( node.data);
          
        });
        console.log(s)
        let immutableStore = transactionData();
        let movingNodes = e.nodes.map((e) => e.data);
        let sortable = e.api.rowModel.rootNode.allLeafChildren.map(a => a.data);
        var movingNode = e.node;
        var overNode = e.overNode;
        let compare = [];
        let error = [];
        let reqTotal = 0;
        //if (config.console)
        console.log('onRowDragEnd', e.api.rowModel.rootNode);
        movingNodes.map((a, i) => {
            const isInteger = a.Balloon % 1 === 0;
            if (!isInteger) {
                compare[parseInt(a.Balloon)] = immutableStore.filter(word => word.Balloon.includes(parseInt(a.Balloon).toString() + "."));
            } else {
                compare[parseInt(a.Balloon)] = [a.Balloon];
            }
            return a;
        });
        compare = compare.filter(function (el) { return el != null; });
        compare.forEach((el) => { reqTotal = reqTotal + el.length; });

        if (movingNodes.length !== reqTotal && e.overIndex !== -1) {
            var movingData = movingNode.data;
            var overData = overNode.data;
            var fromIndex = immutableStore.indexOf(movingData);
            var toIndex = immutableStore.indexOf(overData);
            var newStore = immutableStore.slice();
            moveInArray(newStore, fromIndex, toIndex);
            if (config.console)
                console.log("error group item.")
            error[0] = 'error group item';
            Swal.fire({
                title: "Error",
                html: "You can't move the group items seperately.",
                icon: "",
                confirmButtonText: "OK",
            }).then((r) => {
                if (r.isConfirmed) {
                    e.api.setRowData(immutableStore);
                    e.api.clearFocusedCell();
                }

            });
        }

        let prev, next;
        let diff = [];
        prev = e.nodes[0].rowIndex - 1;
        next = e.nodes[0].rowIndex + movingNodes.length;

        gridRef.current.api.forEachNode((node) => {
            if (node.rowIndex === prev) {
                diff.push(node.data.intBalloon);
                if (config.console)
                console.log("prev " + prev, node.data, node.rowIndex, e, e.nodes[0].rowIndex)
            }
            if (node.rowIndex === next) {
                diff.push(node.data.intBalloon);
                 if (config.console)
                console.log("next " + next, node.data, node.rowIndex, e, e.nodes[0].rowIndex)
            }
        });

        let variable = diff.reduce((resArr, currentArr) => {
            let other = resArr.some((ele) => currentArr === ele)
            if (!other) resArr.push(currentArr)
            return resArr
        }, []);
        if (config.console)
        console.log(prev, next, diff, variable)
        if (prev !== -1 && next !== sortable.length) {

            if (variable.length !== 2) {
            if (config.console)
                console.log("error moving between group item.")
            error[0] = 'error moving between group item.';
            Swal.fire({
                title: "Error",
                html: "You can't move the Balloon in between group item.",
                icon: "",
                confirmButtonText: "OK",
            }).then((r) => {
                if (r.isConfirmed) {
                    e.api.setRowData(immutableStore);
                    e.api.clearFocusedCell();
                }

            });

            }
        }

        
        if (error.length === 0) {
            if (JSON.stringify(immutableStore) !== JSON.stringify(sortable)) {
                if (config.console)
                    console.log("save", immutableStore, sortable)

                const { ItemView, drawingDetails, originalRegions } = useStore.getState();

                let pageNo = 0;


                if (drawingDetails.length > 0 && ItemView != null) {
                    pageNo = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
                }
                /***
                 * 
                 */

                let prevPageData = originalRegions.map((item) => {
                    if (parseInt(item.Page_No) < parseInt(pageNo)) {
                        return item;
                    }
                    return false;
                }).filter(item => item !== false);

                let nextPageData = originalRegions.map((item) => {
                    if (parseInt(item.Page_No) > parseInt(pageNo)) {
                        return item;
                    }
                    return false;
                }).filter(item => item !== false);
                let p = getdataList(prevPageData, []);
                //console.log(p)
                let prevgrouped = p.group;
                /* 
                * 
                */
                // const resetOverData = JSON.parse(JSON.stringify(sortable));
                const resetOverData = [...sortable];

                let ui = 1;
                let resetOverSingle = resetOverData.reduce((res, item) => {
                    if (!res[parseInt(item.Balloon)] && item.hasOwnProperty("subBalloon")) {
                        let Balloon = ui.toString();
                        ui++;
                        res[parseInt(item.Balloon)] = { ...item, Balloon: Balloon, newarr: { ...item.newarr, Balloon: Balloon }, Old: parseInt(item.Balloon) };
                    }
                    return res;
                }, []);
                let resetOvergroup = resetOverData.reduce((acc, obj) => {
                    let key = obj.Balloon.toString().split('.')[0];
                    acc[key] = acc[key] || [];
                    acc[key].push(obj);
                    return acc;
                }, {});

                let unique = Object.values(resetOverSingle);
                let grouped = Object.values(resetOvergroup);
                let dragunique = shortBalloon(unique, "Balloon");
                if (config.console)
                console.log( dragunique)

                let c = grouped.reduce((res, curr) => {
                    if (!res[parseInt(curr[0].Balloon)] && curr[0].hasOwnProperty("subBalloon") && curr[0].subBalloon.length > 0 && curr[0].Quantity > 1) {
                        res[parseInt(curr[0].Balloon)] = { key: parseInt(curr[0].Balloon), value: curr }
                    }
                    return res;
                }, []);
                let qtygroup = c.filter((a) => a);


                let newitems = [];

                dragunique.reduce((prev, curr,index) => {
                    const id = uuid();
                    //console.log(curr, index)
                    let newarr = [];
                    let Balloon = prevgrouped.length + 1 + index;
                    Balloon = Balloon.toString();
                    if (curr.Quantity === 1 && curr.subBalloon.length === 0) {
                        prev.push({ b: (Balloon), c: prev.length + 1 })
                        let i = prev.length;
                        newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: Balloon }, id: id, DrawLineID: i, Balloon: Balloon });
                    }
                    if (curr.Quantity === 1 && curr.subBalloon.length > 0) {
                        let newSubItem = curr.subBalloon.filter(a => { return a.isDeleted === false; });
                        let pb = parseInt(Balloon).toString();
                        if (newSubItem.length > 0) {
                              pb = parseInt(Balloon).toString() + ".1";
                        }

                        prev.push({ b: pb, c: prev.length + 1 })
                        let i = prev.length;
                        newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: id, DrawLineID: i, Balloon: pb });
                        newSubItem.map(function (e, ei) {
                            let sno = ei + 2;
                            const sid = uuid();
                            let b = parseInt(Balloon).toString() + "." + sno.toString();
                            prev.push({ b: b, c: prev.length + 1 })
                            let i = prev.length;
                            if (e.hasOwnProperty("Isballooned"))
                                delete e.Isballooned;
                            if (e.hasOwnProperty("Id"))
                                delete e.Id;

                            let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b };
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
                            newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: b }, id: qid, DrawLineID: i, Balloon: b });
                        }
                    }
                    if (curr.Quantity > 1 && curr.subBalloon.length > 0) {
                        //for (let qi = 1; qi <= curr.Quantity; qi++) {
                        // const qid = uuid();
                        //let pb = parseInt(curr.Balloon).toString() + "." + qi.toString();
                        let line = qtygroup.filter(a => {
                            if (parseInt(a.key) === parseInt(curr.Old)) { return a.value; }
                            return false;
                        }).filter(a => a);
                        //console.log(line, Balloon)
                        if (line.length > 0) {
                            line[0].value.map(item => {
                                let key = item.Balloon.toString().split('.');
                                key[0] = Balloon.toString();
                                let pb = key.join('.');
                                if (config.console)
                                console.log(pb, parseInt(curr.Balloon), key, item)
                                prev.push({ b: pb, c: prev.length + 1 })
                                let i = prev.length
                                const qid = uuid();
                                newarr.push({ ...item, newarr: { ...item.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
                                return item;
                            });
                        }


                        /*

                        newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });

                        curr.subBalloon.filter(a => { return a.isDeleted === false; }).map(function (e, ei) {
                            let sqno = ei + 1;
                            const sqid = uuid();
                            let b = pb + "." + sqno.toString();
                            prev.push({ b: b, c: prev.length + 1 })
                            let i = prev.length;
                            if (e.hasOwnProperty("Isballooned"))
                                delete e.Isballooned;
                            if (e.hasOwnProperty("Id"))
                                delete e.Id;
                            let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sqid, DrawLineID: i, Balloon: b };
                            newarr.push(setter);
                            return e;
                        })
                        */
                        //}

                    }

                    newitems = newitems.slice();
                    newitems.splice(newitems.length, 0, ...newarr);

                    return prev;
                }, []);

                if (config.console)
                    console.log("new", newitems)
                //useStore.setState({ isLoading: false });
                // return;
                let prevOvergroup = newitems.reduce((acc, obj) => {
                    let key = obj.Balloon.toString().split('.')[0];
                    acc[key] = acc[key] || [];
                    acc[key].push(obj);
                    return acc;
                }, {});
                let prevovergrouped = Object.values(prevOvergroup);

                let ne = getdataList(nextPageData, [...p.group, ...prevovergrouped]);

                //console.log([...prevovergrouped, ...p.group])
                newitems = [...p.items, ...newitems, ...ne.items];
                let currentPageData = newitems.map((item) => {
                    if (parseInt(item.Page_No) === parseInt(pageNo)) {
                        return item;
                    }
                    return false;
                }).filter(item => item !== false);


                useStore.setState({ isLoading: true, loadingText: "Saving Balloons... Please Wait..." });
                setTimeout(() => {
                    e.api.setRowData(currentPageData);
                    e.api.clearFocusedCell();
                    useStore.setState({
                        originalRegions: newitems,
                        savedDetails: ((newitems.length > 0) ? true : false),
                        drawingRegions: [],
                        balloonRegions: []
                    });
                    const newstate = useStore.getState();
                    if (newstate.savedDetails) {
                        let originalRegions = newstate.originalRegions;
                        let newrect = newBalloonPosition(originalRegions, newstate);
                        useStore.setState({
                            drawingRegions: newrect,
                            balloonRegions: newrect,
                        });
                    }
                    useStore.setState({ isLoading: false });
                }, 300);
                
            }
        }
    }

    const _syncingFromCanvas = React.useRef(false);
    const onSelectionChanged = React.useCallback((params) => {
        // Skip if this event was triggered by canvas→grid sync to prevent circular updates
        if (_syncingFromCanvas.current) return;

        const selectedRows = params.api.getSelectedRows();
        const selectedNums = selectedRows.map(s => parseInt(s.Balloon)).reduce((arr, curr) => {
            if (!arr.some(e => e === curr)) arr.push(curr);
            return arr;
        }, []);
        useStore.setState({ selectedGridBalloons: selectedNums });

        // Highlight balloon on canvas when single row clicked (no popup)
        if (selectedRows.length === 1) {
            useStore.setState({ selectAnnotation: selectedRows[0].id });
        } else if (selectedRows.length === 0) {
            useStore.setState({ selectAnnotation: null });
        }
    })
    /*
    const onSelectionChanged = React.useCallback((params) => {
        const selectedRows = params.api.getSelectedRows();
       
        if (config.console)
            console.log(selectedRows)
    })
    
    const onSelectionChanged = React.useCallback(() => {
        //let state = useStore.getState();
        const selectedRows = gridRef.current.api.getSelectedRows();
       //console.log(selectedRows)
       // console.log(selectedRows, state.immutableStore)
       /*
        let immutableStore = transactionData();
        let createshape = immutableStore.map(a => a.Balloon);
        let movingNodes = selectedRows.map(a => a.Balloon);
        
        let compare = [];
        movingNodes.map((a, i) => {
            const isInteger = a % 1 === 0;
            if (!isInteger) {
                compare = createshape.filter(word => word.includes(parseInt(a).toString() + "."));
            } else {
                compare = [a];
            }
           // console.log(compare)
           
            gridRef.current.api.forEachNode((node) => {
                compare.forEach((el) => {
                    if (el === node.data.Balloon) {
                       // console.log(node.data.Balloon, node.rowIndex, el)
                        gridRef.current.api.getRowNode(node.rowIndex).setSelected(true);
                    }
                });
               
            });
            const selectedRows1 = gridRef.current.api.getSelectedRows();
            console.log(selectedRows1)
            useStore.setState({
                immutableStore: selectedRows1.map(a => a.Balloon)
            });
            
        })
        /
        
    }, []);
    */

    let colElements = transactionDataColumns(gridRef);
 
  //  const rowData = transactionData();
    //const gridStyle = React.useMemo(() => ({ height: '100%', width: '100%' }), []);
    const containerStyle = React.useMemo(() => ({ width: '100%', height: '100%' }), []);
    setTimeout(() => {
        if (props.selectedRowIndex !== null && gridRef.current && gridRef.current.api) {
            const gridApi = gridRef.current.api;
            const selectedGrid = useStore.getState().selectedGridBalloons || [];

            // Set flag to prevent onSelectionChanged from firing during sync
            _syncingFromCanvas.current = true;

            // Sync grid checkboxes with selectedGridBalloons from canvas clicks
            gridApi.forEachNode((node) => {
                const balloonNum = parseInt(node.data.Balloon);
                const shouldSelect = selectedGrid.includes(balloonNum);
                if (node.isSelected() !== shouldSelect) {
                    node.setSelected(shouldSelect, false, true);
                }
                // Scroll to the clicked balloon row
                if (node.data.Balloon === props.selectedRowIndex.toString()) {
                    gridApi.ensureIndexVisible(node.rowIndex, 'middle');
                }
            });

            // Clear flag after sync
            setTimeout(() => { _syncingFromCanvas.current = false; }, 50);
        }
    }, 10);
    const {    successPicker, errorPicker } = useStore.getState();
 
    const getRowStyle = (params) => {
       // console.log(params.data.newarr)
        if (params.data.newarr.BalloonColor === `${errorPicker}`) {
            const backgroundColor = hexToRGBA(`${errorPicker}`, 0.1);
            return { backgroundColor: backgroundColor };
        }
        if (params.data.newarr.BalloonColor === `${successPicker}`) {
            const backgroundColor = hexToRGBA(`${successPicker}`, 0.1);
            return { backgroundColor: backgroundColor };
        }
        return { backgroundColor: 'transparent' };
    };

    const [rowData, setRowData] = useState(() => transactionData());

    // Load data on initial mount
    useEffect(() => {
        const initialData = transactionData();
        setRowData(initialData);
        if (gridRef.current && gridRef.current.api) {
            gridRef.current.api.setRowData(initialData);
        }
    }, []);

    // Update data when balloon regions change
    useEffect(() => {
        const state = useStore.getState();
        let originalRegions = state.originalRegions;
        if (prevProps.current && prevProps.current.props.originalRegions !== originalRegions) {
             setTimeout(() => {
                const newData = transactionData();
                setRowData(newData);
                if (gridRef.current && gridRef.current.api) {
                    gridRef.current.api.setRowData(newData);
                }
             }, 2000);
        }
        prevProps.current = { props }
    }, [props]);
    /*
    const [rowData, setRowData] = useState([]);
    const [gridKey, setGridKey] = useState(0);
    useEffect(() => {
        setTimeout(() => {

            setRowData(transactionData());
            setGridKey(prevKey => prevKey + 1); // Update the grid key to trigger re-render
        }, 5000);
    }, [rowData]);
    */
 
    const scrollToBalloon = (balloonData) => {
        if (!balloonData) return;
        const scrollElement = document.querySelector('#konvaMain');
        if (!scrollElement) return;

        const cx = balloonData.Circle_X_Axis || 0;
        const cy = balloonData.Circle_Y_Axis || 0;
        if (cx < 1 && cy < 1) return;

        const props = useStore.getState();
        const scale = props.bgImgScale || 1;
        const containerW = scrollElement.clientWidth;
        const containerH = scrollElement.clientHeight;

        // Scroll so the balloon is centered in the viewport
        const targetLeft = (cx * scale) - (containerW / 2);
        const targetTop = (cy * scale) - (containerH / 2);

        scrollElement.scrollTo({
            left: Math.max(0, targetLeft),
            top: Math.max(0, targetTop),
            behavior: 'smooth'
        });
    };

    const handleDoubleTap = (e) => {

        const cell = gridRef.current.api.getEditingCells();
        console.log("handleCellDoubleClicked", cell,e)
        if (cell.length === 0) {
            useStore.setState({ selectedBalloon: e.data.Balloon });
            // Auto-scroll canvas to the balloon location
            scrollToBalloon(e.data);
        } else {
            if (cell[0].column.colDef.field === 'Balloon') {
                //e.event.stopPropagation();
                console.log("Balloon")
                useStore.setState({ selectedBalloon: null });
            }
        }
    }
    const handleCellClicked = (e) => {
        // Detect double-tap for touch devices
        const currentTime = Date.now();
        const tapGap = currentTime - (e.node.lastTapTime || 0);
        console.log(e)
        if (tapGap < 300 && tapGap > 0 && e.type === "rowClicked" && e.event.pointerType === "touch" && e.event.target.attributes[4].value === "hypenBalloon") {
            console.log("Balloon")
            const cell = gridRef.current.api.getEditingCells();
            console.log("handleCellDoubleClicked", cell, e)
            useStore.setState({ selectedBalloon: null });
            // Start editing on double-tap
            e.api.startEditingCell({
                rowIndex: e.rowIndex,
                colKey: e.column.colId,
            });
        }
    };
    const handleRowClick = (e) => {
        const currentTime = Date.now();
        const tapGap = currentTime - (e.node.lastTapTime || 0);

        if (tapGap < 300 && tapGap > 0 && e.type === "rowClicked" && e.event.pointerType === "touch" && e.event.target.attributes[4].value !== "hypenBalloon") {
            // Handle double-tap
            handleDoubleTap(e);
        }

        // Auto-scroll to balloon when Identify mode is active
        const identifyMode = useStore.getState().identifyMode;
        if (identifyMode && identifyMode !== 'off' && e.data) {
            scrollToBalloon(e.data);
        }

        e.node.lastTapTime = currentTime;
    };
    return (
        <>
            {(rowData.length === 0) && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '300px',
                    color: '#6c757d',
                    textAlign: 'center',
                    padding: '40px 20px'
                }}>
                    <i className="fa fa-table" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}></i>
                    <h5 style={{ fontWeight: '600', color: '#495057', marginBottom: '8px' }}>No Balloons Yet</h5>
                    <p style={{ fontSize: '13px', maxWidth: '250px', lineHeight: '1.5' }}>
                        Use <b>Selected</b> or <b>Unselected</b> from the sidebar to create balloons. They will appear here.
                    </p>
                </div>
            )}
            {(rowData.length > 0) && (
                <>
                    <div style={{ ...containerStyle, padding: '8px 0 0 0' }}>
                    <div style={{
                        background: '#1a2744',
                        color: '#fff',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        letterSpacing: '0.3px',
                        borderRadius: '6px 6px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>Balloon Extraction Results ({rowData.length} items)</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {(() => {
                                const selected = useStore.getState().selectedGridBalloons || [];
                                const hasSelected = selected.length > 0;
                                return (<>
                                    {/* Delete button — always visible, changes behavior based on selection */}
                                    <button
                                        onClick={() => {
                                            if (hasSelected) {
                                                // Has selections → confirm and delete
                                                Swal.fire({
                                                    title: `Delete ${selected.length} balloon(s)?`,
                                                    text: `Balloon(s): ${selected.join(', ')}`,
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Yes, Delete',
                                                    confirmButtonColor: '#dc3545',
                                                    allowOutsideClick: false,
                                                    allowEscapeKey: false
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        MultipleDelete(selected);
                                                        useStore.setState({ selectedGridBalloons: [] });
                                                        DeSelectDataGrid();
                                                    }
                                                });
                                            } else {
                                                // No selections → show toast guide
                                                Swal.fire({
                                                    toast: true,
                                                    position: 'top',
                                                    icon: 'info',
                                                    title: 'Select balloons using checkboxes, then click Delete again',
                                                    showConfirmButton: false,
                                                    timer: 3000,
                                                    timerProgressBar: true
                                                });
                                            }
                                        }}
                                        style={{
                                            background: hasSelected ? '#dc3545' : 'transparent',
                                            border: hasSelected ? '1px solid #dc3545' : '1px solid rgba(255,255,255,0.4)',
                                            color: '#fff',
                                            padding: '3px 10px',
                                            fontSize: '11px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            letterSpacing: '0.3px',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        title={hasSelected ? `Delete ${selected.length} selected balloon(s)` : 'Click to start selecting balloons for deletion'}
                                    >
                                        <i className="fa fa-trash" style={{ fontSize: '10px', pointerEvents: 'none' }}></i>
                                        <span style={{ pointerEvents: 'none' }}>{hasSelected ? `Delete (${selected.length})` : 'Delete'}</span>
                                    </button>
                                    {/* Clear Selection — only when something is selected */}
                                    {hasSelected && (
                                        <button
                                            onClick={DeSelectDataGrid}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.4)',
                                                color: '#fff',
                                                padding: '3px 10px',
                                                fontSize: '11px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                letterSpacing: '0.3px',
                                                transition: 'all 0.2s',
                                            }}
                                            title="Clear all selected balloons"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </>);
                            })()}
                        </div>
                    </div>
                    <div
                            className="ag-theme-alpine"
                            style={{
                                height: "calc(100% - 35px)",
                                minHeight: "350px",
                                width: "100%",
                                borderRadius: '0 0 6px 6px',
                            }}
                            
                    >
                            <AgGridReact
                                id="myAgGrid"
                              //  key={gridKey} 
                                ref={gridRef}
                                tooltipShowDelay={500}
                                frameworkComponents={{
                                    customTooltip: CustomTooltip,
                                }}
                                rowHeight={40} // Set appropriate row height
                            //   domLayout="autoHeight" // or 'normal', depending on your use case
                                rowData={rowData}
                                getRowStyle={getRowStyle}
                               // onGridReady={onGridReady}
                                // immutableData={true}
                                columnDefs={colElements}
                                defaultColDef={defaultColDef}
                                rowSelection={'multiple'}
                                rowDragManaged={true}
                                // rowDragEntireRow={true}
                                animateRows={true}
                                //  onRowDragEnter={onRowDragEnter}
                                onRowDragEnd={onRowDragEnd}
                                // onRowDragMove={onRowDragMove}
                                //  onRowDragLeave={onRowDragLeave}
                                rowDragMultiRow={true}
                                rowDeselection={true}
                                //onFirstDataRendered={onFirstDataRendered }
                                //  groupDefaultExpanded={false}
                                onSelectionChanged={onSelectionChanged}
                                onRowClicked={handleRowClick} // Listen for row clicks
                                onCellClicked={handleCellClicked} // Handle touch events
                                stopEditingWhenCellsLoseFocus={true} // Optional: Stop editing on focus loss
                                onRowDoubleClicked={(e) => {
                                   // e.preventDefault();
                                    handleDoubleTap(e);
                              //  useStore.setState({ selectedBalloon: e.data.Balloon });
                                 }}
                            pagination={false}
                        >
                        </AgGridReact>
                    </div>
                    </div>
                </>
            )}
        </>
    );
};

// #endregion
