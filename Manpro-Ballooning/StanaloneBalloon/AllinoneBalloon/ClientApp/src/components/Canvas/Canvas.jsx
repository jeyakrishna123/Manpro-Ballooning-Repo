// #region Component Imports
import React, { useState, useEffect, useCallback } from "react";
import { Layer, Stage, Image, Group, Circle, Arrow as KonvaArrow  } from "react-konva";
import { showAlert, selectedSPLRegionProcess, config, AGTable, originalPosition, ballonOriginalPosition, MultipleDelete, resetBalloonsProcess, fitSize, actualSize, selectedRegionProcess, newBalloonPosition } from "../Common/Common";
import { v1 as uuid } from "uuid";
import classNames from "classnames";
import Annotation from "./Annotation";
import Measurement from "./Measurement";
import Controlledcopy from "./Controlledcopy";
import WatermarkOverlay from "./WatermarkOverlay";
import PopupModal from "../Common/Modal";
import useStore from "../Store/store";
import initialState from "../Store/init";
import Swal from 'sweetalert2'
import { Button, Nav, NavItem, Input, Row, Col, Label  } from "reactstrap";
import { Modal } from "react-bootstrap";
import ListGroup from 'react-bootstrap/ListGroup';
import minus from "../../assets/minus.svg"
import plus from "../../assets/plus.svg"
import { ReactComponent as Multishapes } from "../../assets/Multishapes.svg";
import { ReactComponent as ControllCopyIcon } from "../../assets/copy-controll.svg";
import { ReactComponent as Delete } from "../../assets/delete.svg";
import { ReactComponent as Deletewhite } from "../../assets/delete-white.svg";
import { ReactComponent as DraggableStage } from "../../assets/draggableStage.svg";
import { ReactComponent as PaletteIcon } from "../../assets/palette.svg";

// #endregion

// #region Remove element from the list of array
function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
// #endregion

// #region Utility
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
// #endregion

// #region Generic IconButtonWithTooltip
const IconButtonWithTooltip = ({ onClick, disabled, style, alt, icon }) => {
    return (
        <button
            type="button"
            tabIndex={-1}
            className="qty-btn"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onFocus={(e) => { e.stopPropagation(); }}
            disabled={disabled}
            style={style}
        >
            <img src={icon} alt={alt} style={{ width: "10px", height: "10px" }} />
        </button>
    );
};
// #endregion

// #region FontSizeControl
export const FontSizeControl = () => {
    const [max] = useState(50);
    const [min] = useState(-8);
    const [disableInc, setDisableInc] = useState(false);
    const [disableDec, setDisableDec] = useState(false);

    const fontScale = useStore((s) => s.fontScale);

    // #region Increase FontSize
    const increaseFontSize = (e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const current = parseFloat(useStore.getState().fontScale);
        const bgImgScale = useStore.getState().bgImgScale;
        let scale = 1 + current / 10 * bgImgScale;
        if (scale < 0.1) {
            useStore.setState({ fontScale: current + 1 });
            setDisableDec(false);
            return;
        }
        let cur = current + 1;
        setDisableDec(false);
        if (cur >= max) {
            setDisableInc(true);
            useStore.setState({ fontScale: max });
            return;
        }
        useStore.setState({ fontScale: cur });
    };
    // #endregion

    // #region Decrease FontSize
    const decreaseFontSize = (e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const current = parseFloat(useStore.getState().fontScale);
        const bgImgScale = useStore.getState().bgImgScale;
        let scale = 1 + current / 10 * bgImgScale;
        if (scale < 0.1) {
            useStore.setState({ fontScale: current - 1 });
            setDisableInc(false);
            return;
        }
        let cur = current - 1;
        setDisableInc(false);
        if (cur <= min) {
            setDisableDec(true);
            useStore.setState({ fontScale: min });
            return;
        }
        useStore.setState({ fontScale: cur });
    };
    // #endregion

    // #region Render HTML
    return (
        <div
            id={"fontScale_wrapper"}
            className={"d-inline-flex align-items-center"}
            style={{ flexShrink: 0, gap: "2px" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <IconButtonWithTooltip
                alt="Decrease"
                onClick={decreaseFontSize}
                disabled={disableDec}
                icon={minus}
            />
            <input
                name="fontScale"
                id="fontScale"
                type="number"
                min={min}
                max={max}
                value={fontScale}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onChange={(e) => {
                    e.stopPropagation();
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 0;
                    val = clamp(val, min, max);
                    useStore.setState({ fontScale: val });
                }}
                className="qty-input"
            />
            <IconButtonWithTooltip
                alt="Increase"
                onClick={increaseFontSize}
                disabled={disableInc}
                icon={plus}
            />
        </div>
    );
    // #endregion
};
// #endregion

// #region Component for Control Copy
export const ControlCopyFontSizeControl = () => {
    const [max] = useState(500);
    const [min] = useState(-500);
    const [disableInc, setDisableInc] = useState(false);
    const [disableDec, setDisableDec] = useState(false);

    const ccFontScale = useStore((s) => s.ccFontScale);

    // Increase CC font size
    const increaseCCFontSize = (e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const current = parseFloat(useStore.getState().ccFontScale);
        const next = current + 1;
        setDisableDec(false);
        if (next >= max) {
            setDisableInc(true);
            useStore.setState({ ccFontScale: max });
            return;
        }
        useStore.setState({ ccFontScale: next });
    };

    // Decrease CC font size
    const decreaseCCFontSize = (e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const current = parseFloat(useStore.getState().ccFontScale);
        const next = current - 1;
        setDisableInc(false);
        if (next <= min) {
            setDisableDec(true);
            useStore.setState({ ccFontScale: min });
            return;
        }
        useStore.setState({ ccFontScale: next });
    };

    return (
        <div
            id={"ccFontScale_wrapper"}
            className={"d-inline-flex align-items-center"}
            style={{ flexShrink: 0, gap: "2px" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <IconButtonWithTooltip
                alt="Decrease"
                onClick={decreaseCCFontSize}
                disabled={disableDec}
                icon={minus}
            />
            <input
                name="ccFontScale"
                id="ccFontScale"
                type="number"
                value={ccFontScale}
                min={min}
                max={max}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onChange={(e) => {
                    e.stopPropagation();
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 0;
                    val = clamp(val, min, max);
                    useStore.setState({ ccFontScale: val });
                }}
                className="qty-input"
            />
            <IconButtonWithTooltip
                alt="Increase"
                onClick={increaseCCFontSize}
                disabled={disableInc}
                icon={plus}
            />
        </div>
    );
};
// #endregion

export class ControlCopy extends React.Component {

    // #region constructor
    constructor(props) {
        super(props);
        this.state = {
            color: useStore.getState().defaultPicker,
        };
    }
    // #endregion

    // #region Render HTML
    render() {
        let { defaultPicker } = useStore.getState();
        return (
            <Button className="btn btn-primary buttons"
                style={{ position: "relative", flexShrink: 0 }}
                onMouseEnter={() => { this.setState({ color: "white" }); }}
                onMouseLeave={() => { this.setState({ color: defaultPicker }); }}
                onClick={this.props.startDraggingGroup}
            >
                {this.state.color === "white" && (
                    <span className="EI48Lc" style={{
                        position: "absolute", left: "50%", top: "100%",
                        transform: "translateX(-50%)", marginTop: "4px",
                        pointerEvents: "none", whiteSpace: "nowrap", zIndex: 100
                    }}>Control Copy</span>
                )}
                <ControllCopyIcon className="icon m-1" style={{ fill: this.state.color }}   ></ControllCopyIcon>
            </Button>
            
        )
    }
    // #endregion
};
// #endregion

// #region Component for ChangeShapeBalloon
export class ChangeShapeBalloon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            color: useStore.getState().defaultPicker,
        };
    }
    render() {
        let { defaultPicker } = useStore.getState();
        return (
            <Button className="btn btn-primary buttons"
                style={{ position: "relative", flexShrink: 0 }}
                onClick={this.props.handleChangeShapes}
                onMouseEnter={() => { this.setState({ color: "white" }); }}
                onMouseLeave={() => { this.setState({ color: defaultPicker }); }}
            >
                {this.state.color === "white" && (
                    <span className="EI48Lc" style={{
                        position: "absolute", left: "50%", top: "100%",
                        transform: "translateX(-50%)", marginTop: "4px",
                        pointerEvents: "none", whiteSpace: "nowrap", zIndex: 100
                    }}>Change Shapes</span>
                )}
                <Multishapes className="icon m-1" style={{ fill: this.state.color }}></Multishapes>
            </Button>
        )
    }
};
// #endregion

// #region Component for ChangeBalloonColor
export class ChangeBalloonColor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            color: useStore.getState().defaultPicker,
        };
    }
    render() {
        let { defaultPicker } = useStore.getState();
        return (
            <Button className="btn btn-primary buttons"
                style={{ position: "relative", flexShrink: 0 }}
                onClick={this.props.handleChangeColors}
                onMouseEnter={() => { this.setState({ color: "white" }); }}
                onMouseLeave={() => { this.setState({ color: defaultPicker }); }}
            >
                {this.state.color === "white" && (
                    <span className="EI48Lc" style={{
                        position: "absolute", left: "50%", top: "100%",
                        transform: "translateX(-50%)", marginTop: "4px",
                        pointerEvents: "none", whiteSpace: "nowrap", zIndex: 100
                    }}>Change Color</span>
                )}
                <PaletteIcon className="icon m-1" style={{ fill: this.state.color }}></PaletteIcon>
            </Button>
        )
    }
};
// #endregion

// #region Component for Delete Balloon
export class DeleteBalloon extends React.Component {
    // #region constructor
    constructor(props) {
        super(props);
        this.state = {
            color: useStore.getState().defaultPicker,
        };
    }
    // #endregion

    // #region xustom fn
    DeleteMultiBalloon = () => {
        let { originalRegions, selectedGridBalloons, selectAnnotation, drawingRegions, ItemView, drawingDetails } = useStore.getState();

        // Collect all selected balloon numbers from any source
        let deleteItem = [];

        // From canvas multi-select (selectedIds)
        if (this.props.selectedIds && this.props.selectedIds.length > 0) {
            const canvasSelected = originalRegions
                .filter(s => this.props.selectedIds.includes(s.id))
                .map(s => parseInt(s.Balloon))
                .filter(a => a !== undefined && a !== false);
            deleteItem = [...new Set([...deleteItem, ...canvasSelected])];
        }

        // From grid checkboxes
        if (selectedGridBalloons && selectedGridBalloons.length > 0) {
            deleteItem = [...new Set([...deleteItem, ...selectedGridBalloons])];
        }

        // From single canvas selection
        if (selectAnnotation !== null && deleteItem.length === 0) {
            const selected = drawingRegions.filter(a => a.id === selectAnnotation);
            if (selected.length > 0) {
                deleteItem.push(parseInt(selected[0].Balloon));
            }
        }

        // If any balloons are selected — delete them directly with one confirm
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
                    this.props.setSelectedIds([]);
                }
            });
            return;
        }

        // No balloons selected — show 2-option popup: All or Specific
        let pageNo = 0;
        if (drawingDetails.length > 0 && ItemView !== null) {
            pageNo = parseInt(Object.values(drawingDetails)[parseInt(ItemView)].currentPage);
        }
        const currentPageBalloons = originalRegions.filter(r => r.hasOwnProperty("newarr") && parseInt(r.Page_No) === parseInt(pageNo));
        if (currentPageBalloons.length === 0) {
            showAlert("Info", "No balloons on this page to delete.");
            return;
        }

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
    }
    // #endregion

    // #region Render HTML
    render() {
        let { defaultPicker } = useStore.getState();
        return (
            <Button className="btn buttons btn-primary"
                style={{ position: "relative", flexShrink: 0 }}
                onClick={(e) => {
                    this.DeleteMultiBalloon()
                }}
                onMouseEnter={() => { this.setState({ color: "white" }); } }
                onMouseLeave={() => { this.setState({ color: defaultPicker }); } }
            >
                {this.state.color === "white" && (
                    <span className="EI48Lc" style={{
                        position: "absolute", left: "50%", top: "100%",
                        transform: "translateX(-50%)", marginTop: "4px",
                        pointerEvents: "none", whiteSpace: "nowrap", zIndex: 100
                    }}>Delete</span>
                )}
                {this.state.color !== "white" && (<Delete className="icon" style={{ fill: this.state.color }}></Delete>)}
                {this.state.color === "white" && (<Deletewhite className="icon" style={{ fill: this.state.color }}></Deletewhite>)}
            </Button>
        )
    }
    // #endregion
};
// #endregion

// #region Canvas Background Pattern Image
class PatternImage extends React.Component {
    // #region constructor
    constructor(props) {
        super(props);

        this.state = {
            image: null,
        };
    }
    // #endregion

    // #region fn
    componentDidMount() {
        this.loadImage();
    }
    componentDidUpdate(oldProps) {
        if (oldProps.src !== this.props.src) {
            this.loadImage();
        }
    }
    componentWillUnmount() {
        this.image.removeEventListener('load', this.handleLoad);
 
    }
    loadImage() {
        this.image = new window.Image();
        this.image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABlBMVEUAAADY2NjnFMi2AAAAAXRSTlMAQObYZgAAABVJREFUGNNjYIQDBgQY0oLDxBsIQQCltADJNa/7sQAAAABJRU5ErkJggg==";
        this.image.addEventListener('load', this.handleLoad);
    }
    handleLoad = () => {
        this.setState({
            image: this.image,
        });
    };
    // #endregion

    // #region Render HTML
    render() {
        return (
            <Image
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.height}
                fillPatternImage={this.state.image}
                ref={(node) => {
                    this.imageNode = node;
                }}
            />
        );
    }
    // #endregion
}
// #endregion

// #region Canvas render Drawing Image
class URLImage extends React.Component {

    // #region constructor
    constructor(props) {
        super(props);
        this.state = {
            image: null,
            err_img:null,
            error:[],
        };
    }
    // #endregion

    // #region default fn
    componentDidMount() {
        this.loadImage();
    }
    componentDidUpdate(oldProps) {
        if (oldProps.src !== this.props.src) 
            this.loadImage();
    }
    componentWillUnmount() {
        const state = useStore.getState();
        this.image.removeEventListener('load', this.handleLoad);
        if (state.isErrImage)
            this.err_img.removeEventListener('load', () => { console.log("error") });
    }
    // #endregion

    // #region custom fn to load image
    loadImage() {
        useStore.setState({ win: initialState.win, isErrImage : false });
        this.setState({ error: [] });
        // #region Promise to resolve load Image
        new Promise((resolve, reject) => {
            this.image = new window.Image();
            let str = this.props.src;
            let xx = "";

            // #region trying to get Image url
            try {
                if (config.ENVIRONMENT === "production") {
                    const { sessionId } = useStore.getState();
                     const uri = `/StaticFiles/src/drawing/${sessionId}/${str}`;
                    xx = config.BASE_URL + uri + "?a=" + Math.random();
                } else {
                    //console.log(" before ", str, "xx => " + xx, process.env)
                    xx = require(`./../../drawing/${str}`);
                    //console.log(" middle ", str, "xx => " + xx, this.props)
                }

            } catch (e) {
                // const { drawingDetails } = useStore.getState();
                console.log("Image is Too Large / Damaged." + e)
            }
            // #endregion

            this.image.src = xx;

            // #region Promise resolve to load image
            this.image.onload = () => {
                var maxsize = (this.image.width > this.image.height) ? this.image.width : this.image.height;
                let timer = (maxsize/100)*2;
                setTimeout(() => {
                    resolve(xx)
                    useStore.setState({ history: [], bgImgRotation: 0, imageWidth: this.image.width, imageHeight: this.image.height });
                    const state = useStore.getState();
                    if (state.fitscreen) {
                        fitSize();
                    } else {
                        actualSize();
                    }
                }, timer);
            };
            // #endregion

            // #region Promise reject handle to load error image
            this.image.onerror = err => {
                this.setState({ error: [err] });
                let state = useStore.getState();
                this.err_img = new window.Image();
                let xx = require(`./../../assets/error.png`);
                this.err_img.src = xx;
                // set error image as w 700 h 400 & center position
                useStore.setState({ isErrImage: true, isLoading: false, history: [], bgImgRotation: 0, bgImgW: 700, bgImgH: 400, bgImgX: ((state.win.width - 700) / 2), bgImgY: ((state.win.height - 400) / 2), imageWidth: this.err_img.width, imageHeight: this.err_img.height });
                this.err_img.addEventListener("load", () => {
                    this.setState({ err_img: this.err_img });
                    let scrollElement = document.querySelector('#konvaMain');
                    scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
                });
                // reject(err);
            }
            // #endregion
        });
        // #endregion
       
        this.image.addEventListener('load', this.handleLoad);
    }
    handleLoad = () => {
        setTimeout(() => {
            const state = useStore.getState();
            this.setState({ image: this.image });
            if (state.fitscreen) {
                fitSize();
            } else {
                actualSize();
            }
            useStore.setState({ isLoading: false })
            if (state.savedDetails) {
                let originalRegions = state.originalRegions;
                let newrect = newBalloonPosition(originalRegions, state);
                useStore.setState({
                    savedDetails: false,
                    drawingRegions: newrect,
                    balloonRegions: newrect,
                });
            }

            let scrollElement = document.querySelector('#konvaMain');
            scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
        }, 500);

        const dstate = useStore.getState();
        setTimeout(function () {
            let scrollElement = document.querySelector('#konvaMain');
            if (scrollElement !== null) {
                scrollElement.scrollLeft = dstate.scrollPosition;
                scrollElement.scrollTop = dstate.konvaPositionTop;
            }
            document.body.scrollTop = dstate.documentPositionTop
        }, 500);
    };
    // #endregion

    // #region Render HTML
    render() {
        let state = useStore.getState();
 
        //console.log("on render", state )
        return (
            <>
                {this.state.error.length > 0 && (
                    <Image
                        id="error"
                        name="error"
                        className="error"
                        image={this.state.err_img}
                        x={state.bgImgX}
                        y={state.bgImgY}
                        width={state.bgImgW}
                        height={state.bgImgH}
                        onMouseDown={(e) => {
                            e.evt.preventDefault();
                            return false;
                        }}
                        onMouseMove={(e) => {
                            e.evt.preventDefault();
                            return false;
                        }}
                        onMouseUp={(e) => {
                           e.evt.preventDefault();
                            return false;
                        }}
                        ref={(node) => {
                            this.imageNode = node;
                        }}
                        listening={false}
                    />
                )}
                {this.state.error.length === 0 && (
                    <Image
                        id="product-img"
                            name="product"
                        className="product"
                        x={state.bgImgX}
                        y={state.bgImgY}
                        width={state.bgImgW}
                            height={state.bgImgH}
                          // rotation={state.bgImgRotation}
                        image={this.state.image}
                        ref={(node) => {
                            this.imageNode = node;
                        }}
                    
                        onMouseDown={this.props.onMouseDown}
                    />
                )}
            </>
        );
    }
    // #endregion
}
// #endregion

// #region Right side tool box
export class RightToolBox extends React.Component {

    // #region constructor
    constructor(props) {
        super(props);
        this.state = {
            color: useStore.getState().defaultPicker,
        };
    }
    // #endregion

    // #region Render HTML
    render() {
        let { drawingDetails, ItemView, isErrImage, defaultPicker } = useStore.getState();
        if (config.console)
            console.log(this.props.draggableStage)
        return (
            <Nav className={classNames("d-inline-flex ", { "d-none": (drawingDetails.length === 0 && ItemView === null && isErrImage === false) })}
                style={{ marginLeft:"auto" }} >
                <NavItem>
                    <Button className={classNames("btn btn-primary buttons ", { "primary_hover": (this.props.draggableStage === true) })}
                        onClick={() => this.props.setdraggableStage(!this.props.draggableStage)}
                        onMouseEnter={() => { this.setState({ color:  "white" }); }}
                        onMouseLeave={() => { this.setState({ color: this.props.draggableStage ? "#fff" : defaultPicker }); }}
                    >
                        <div style={{ position: "relative" }}>
                            <span className="PySCBInfoBottomLeft EI48Lc" style={{ left: "-100px", display: this.state.color === "white" ? "block" : "none" }} >
                                {this.state.color === "white" && (
                                    "Draggable"
                                )}
                            </span>
                        </div>
                        <DraggableStage className="icon m-1" style={{ fill: this.state.color }} />
                    </Button>
                </NavItem>
            </Nav>
            
        )
    }
    // #endregion
};
// #endregion
export default function Canvas({ stageRef }) {
    const props = useStore.getState();
     //if (config.console)
        console.log("props",props)

    // #region  Canvas Reference
   // const stageRef = React.useRef();
    const groupRef = React.useRef();
    const layerRef = React.useRef(null);
    const myElementRef = React.useRef(null);
    const mypopup = React.useRef(null);
    // #endregion

    // #region Component Controll Copy Handling
    const [textGroupPlaced, setTextGroupPlaced] = useState(false); // To track if the group is placed
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 }); // Track the position of the group
    const [isDragging, setIsDragging] = useState(false); // Track if the group is being dragged
    const [StartBalloon, setStartBalloon] = useState("");
    const [EndBalloon, setEndBalloon] = useState("");
 
    // Function to start dragging the group
    const startDraggingGroup = () => {
        setIsDragging(true);
        handleClearShape()
        useStore.setState({ selectedRegion: "" });
    };
   
    // Place the group on mouse click
    const handleMouseClick = (e) => {
        if (isDragging) {
            setIsDragging(false); // Stop dragging
            setTextGroupPlaced(true); // Group is now placed
        }
        if (e.target?.attrs?.id !== selectedMeasureId) {
            selectMeasureAnnotation(null);
        }
    };
    // #endregion

    // #region Handling event and Canvas element Position
    const [positionLeft, setPositionLeft] = useState(0);
    const [positionWidth, setPositionWidth] = useState(0);
    const [positionTop, setPositionTop] = useState(0);
    const [positionscrollTop, setPositionscrollTop] = useState(0);
    useEffect(() => {
        var menuNode = document.getElementsByClassName('contextmenu');
        var popupNode = document.getElementsByClassName('popup');
        const element = myElementRef.current;
        const scrollDemo = document.querySelector("body");
        const popel = mypopup.current;

        const handleScroll = () => {
            setPositionLeft(element.scrollLeft);
            setPositionWidth(element.scrollWidth);
            setPositionTop(element.scrollTop)
        };

        const handlemenuNode = (e) => {
            for (let i = 0; i < menuNode.length; i++) {
                let selectedRegion = e?.view?.Konva?.stages[0].mouseClickEndShape?.attrs?.text;
                let contexmenu = ['Select', 'Delete', 'Move Balloon', 'Change Shape', 'Change Color'];
                let Selectedmenu = e?.target?.innerText;
                if (typeof selectedRegion === 'undefined')
                    menuNode[i].style.display = 'none';
                if (typeof selectedRegion !== 'undefined' && contexmenu.includes(Selectedmenu))
                    menuNode[i].style.display = 'none';
            }
        };

        const handlepopupNode = () => {
            for (let i = 0; i < popupNode.length; i++) {
                popupNode[i].style.display = 'none';
            }
        };

        const getScrollPosition = () => {
            const position = document.body.scrollTop;
            setPositionscrollTop(position);
        };
       
        if (popel !== null) 
            popel.addEventListener("click", handlepopupNode);
        element.addEventListener("scroll", handleScroll);
        element.addEventListener("touchmove", handleScroll);
        window.addEventListener("click", handlemenuNode);
        window.addEventListener("touchstart", handlemenuNode);
        scrollDemo.addEventListener("scroll", getScrollPosition, { passive: true });
        scrollDemo.addEventListener("touchmove", getScrollPosition, { passive: true });
        return () => {
            if (popel !== null)
                window.removeEventListener("click", handlepopupNode);
            element.removeEventListener("scroll", handleScroll);
            element.removeEventListener("touchmove", handleScroll);
            window.removeEventListener("click", handlemenuNode);
            window.removeEventListener("touchstart", handlemenuNode);
            scrollDemo.removeEventListener("scroll", getScrollPosition);
            scrollDemo.removeEventListener("touchmove", getScrollPosition);
        };
    }, []);
    // #endregion

    // #region Variables
    let selectedRegion = props.selectedRegion;
    let annotations = props.drawingRegions;
    let originalRegions = props.originalRegions;
    let pageNo = 0;
    let fileName = "";
    let routingNo = "";
    let dim_image = "";
    if (props.drawingDetails.length > 0 && props.ItemView != null) {
        pageNo = parseInt(Object.values(props.drawingDetails)[parseInt(props.ItemView)].currentPage);
        fileName = Object.values(props.drawingDetails)[parseInt(props.ItemView)].fileName;
        routingNo = props.drawingHeader[0].routingNo;
        dim_image = props.drawingDetails.length > 0 ? Object.values(props.drawingDetails)[parseInt(props.ItemView)].drawing : "";
    }
    // #endregion

    // #region Canvas Annotation process
    const [newAnnotation, setNewAnnotation] = useState([]);
    const [newRegion, setNewRegion] = useState([]);
    const [selectedId, selectAnnotation] = useState(null);
    const [selectedMeasureId, selectMeasureAnnotation] = useState(null);
    const [scale, setScale] = useState(1);
    const [draggableStage, setdraggableStage] = useState(true);
    const [draggableCC, setdraggableCC] = useState(false);

    // #region Keyboard shortcuts for zoom/fit/rotate
    useEffect(() => {
        const scaleBy = 1.15;
        const applyStageZoom = (direction) => {
            const stage = stageRef.current;
            if (!stage) return;
            const oldScale = stage.scaleX();
            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const clampedScale = Math.max(0.1, Math.min(10, newScale));
            // Zoom centered on stage center
            const centerX = stage.width() / 2;
            const centerY = stage.height() / 2;
            const mousePointTo = {
                x: (centerX - stage.x()) / oldScale,
                y: (centerY - stage.y()) / oldScale,
            };
            stage.scale({ x: clampedScale, y: clampedScale });
            stage.position({
                x: centerX - mousePointTo.x * clampedScale,
                y: centerY - mousePointTo.y * clampedScale,
            });
            stage.batchDraw();
        };

        const handleKeyDown = (e) => {
            const state = useStore.getState();
            if (state.isErrImage || state.drawingDetails.length === 0 || state.ItemView == null) return;
            // Ctrl+= or Ctrl+Plus: Zoom In
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                applyStageZoom(1);
            }
            // Ctrl+- : Zoom Out
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                applyStageZoom(-1);
            }
            // Ctrl+0 : Reset zoom to 1:1
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                const stage = stageRef.current;
                if (stage) {
                    stage.scale({ x: 1, y: 1 });
                    stage.position({ x: 0, y: 0 });
                    stage.batchDraw();
                }
                const fitBtn = document.querySelector('.FitImage');
                if (fitBtn) fitBtn.click();
            }
            // Ctrl+1 : Actual Size / Screen Size
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                const stage = stageRef.current;
                if (stage) {
                    stage.scale({ x: 1, y: 1 });
                    stage.position({ x: 0, y: 0 });
                    stage.batchDraw();
                }
                const actBtn = document.querySelector('.screen-size');
                if (actBtn) actBtn.click();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [stageRef]);

    // Prevent native scroll on canvas container so wheel events reach Konva Stage for zoom
    useEffect(() => {
        const el = myElementRef.current;
        if (!el) return;
        const preventScroll = (e) => {
            const state = useStore.getState();
            if (state.drawingDetails.length > 0 && state.ItemView != null) {
                e.preventDefault();
            }
        };
        el.addEventListener('wheel', preventScroll, { passive: false });
        return () => el.removeEventListener('wheel', preventScroll);
    }, []);
    // #endregion

    // #region  Event to Start annotation
    const handleMouseDown = e => {
        if (props.drawingDetails.length === 0) {
            return;
        }
        const state = useStore.getState();
        
        if (state.isErrImage) {
            return;
        }
        if (selectedId === null && newAnnotation.length === 0) {
      
           let { x, y } = e.target.getStage().getPointerPosition();
            const stage = stageRef.current;
            const oldScale = stage.scaleX();
            x = stage.getPointerPosition().x / oldScale - stage.x() / oldScale;
            y = stage.getPointerPosition().y / oldScale - stage.y() / oldScale;
            let { bgImgX, bgImgY, bgImgW, bgImgH } = props;
            if (config.console)
                console.log(x, "<", (bgImgX + bgImgW), x, ">", bgImgX, y, ">", bgImgY, y, "<", (bgImgY + bgImgH), selectedRegion)
            const id = uuid();
            let date = new Date();
            date.toISOString().slice(0, 19).replace('T', ' ')

            if ((selectedRegion === "Spl"
                || selectedRegion === "Selected Region"
                || selectedRegion === "Unselected Region"
            ) && x < (bgImgX + bgImgW) && x > bgImgX && y > bgImgY && y < (bgImgY + bgImgH)) {
                
                // #region Start annotation position
                setNewAnnotation([{
                    DrawLineID: 0
                    , BaloonDrwID: 0
                    , BaloonDrwFileID: fileName
                    , ProductionOrderNumber: routingNo
                    , Part_Revision: ""
                    , Page_No: pageNo
                    , DrawingNumber: props.drawingNo
                    , Revision: props.revNo.toUpperCase()
                    , Balloon: annotations.length + 1
                    , Spec: ""
                    , Nominal: ""
                    , Minimum: ""
                    , Maximum: ""
                    , MeasuredBy: ""
                    , MeasuredOn: date
                    , Measure_X_Axis: x
                    , Measure_Y_Axis: y
                    , Circle_X_Axis: x
                    , Circle_Y_Axis: y
                    , Circle_Width: 28
                    , Circle_Height: 28
                    , Balloon_Thickness: 10
                    , Balloon_Text_FontSize: 10
                    , ZoomFactor: "0.0"
                    , Crop_X_Axis: x
                    , Crop_Y_Axis: y
                    , Crop_Width: 0
                    , Crop_Height: 0
                    , Type: ""
                    , SubType: ""
                    , Unit: ""
                    , Serial_No:""
                    , Characteristics: ""
                    , Quantity: 1
                    , ToleranceType: ""
                    , PlusTolerance: ""
                    , MinusTolerance: ""
                    , MaxTolerance: ""
                    , MinTolerance: ""
                    , CropImage: ""
                    , CreatedBy: ""
                    , CreatedDate: date
                    , ModifiedBy: ""
                    , ModifiedDate: date
                    , IsCritical: 0
                    , x
                    , y
                    , width: 0
                    , height: 0
                    , id
                    , selectedRegion
                    , isSaved: false
                    , isballooned: false
                    , isDeleted: false
                    , subBalloon: []
                    , BalloonColor: ""
                    , Actual: ""
                    , Decision: ""
                    , convert: false
                    , converted: 0
                    , ActualDecision: [
                        {
                            OP: { Actual: "" ,Decision: "" }
                        },
                        {
                            LI: { Actual: "", Decision: "" }
                        },
                        {
                            Final: { Actual: "", Decision: "" }
                        },
                    ]
                }]);
                setNewRegion([{
                      DrawLineID: 0
                    , BaloonDrwID: 0
                    , BaloonDrwFileID: fileName
                    , ProductionOrderNumber: routingNo
                    , Part_Revision: ""
                    , Page_No: pageNo
                    , DrawingNumber: props.drawingNo
                    , Revision: props.revNo.toUpperCase()
                    , Balloon: annotations.length + 1
                    , Spec: ""
                    , Nominal: ""
                    , Minimum: ""
                    , Maximum: ""
                    , MeasuredBy: ""
                    , MeasuredOn: date
                    , Measure_X_Axis: x
                    , Measure_Y_Axis: y
                    , Circle_X_Axis: x
                    , Circle_Y_Axis: y
                    , Circle_Width: 28
                    , Circle_Height: 28
                    , Balloon_Thickness: 10
                    , Balloon_Text_FontSize: 10
                    , ZoomFactor: "0.0"
                    , Crop_X_Axis: x
                    , Crop_Y_Axis: y
                    , Crop_Width: 0
                    , Crop_Height: 0
                    , Type: ""
                    , SubType: ""
                    , Unit: ""
                    , Serial_No: ""
                    , Characteristics: ""
                    , Quantity: 1
                    , ToleranceType: ""
                    , PlusTolerance: ""
                    , MinusTolerance: ""
                    , MaxTolerance: ""
                    , MinTolerance: ""
                    , CropImage: ""
                    , CreatedBy: ""
                    , CreatedDate: date
                    , ModifiedBy: ""
                    , ModifiedDate: date
                    , IsCritical: 0
                    , x
                    , y
                    , width: 0
                    , height: 0
                    , id
                    , selectedRegion
                    , isSaved: false
                    , isballooned: false
                    , isDeleted: false
                    , subBalloon: []
                    , BalloonColor: ""
                    , Actual: ""
                    , Decision: ""
                    , convert: false
                    , converted: 0
                    , ActualDecision: [
                        {
                            OP: { Actual: "", Decision: "" }
                        },
                        {
                            LI: { Actual: "", Decision: "" }
                        },
                        {
                            Final: { Actual: "", Decision: "" }
                        },
                    ]
                }]);
                // #endregion
            }
        }
    };
    // #endregion

    // #region  Event to Update annotation
    const handleMouseMove = event => {
        if (props.drawingDetails.length === 0) {
            return;
        }
        if (selectedRegion === "" && selectedId === null && newAnnotation.length !== 1) {
            if (!isDragging) return;
            let { x, y } = event.target.getStage().getPointerPosition();
            const { bgImgX, bgImgY, bgImgW, bgImgH, rectWidth } = props;
            const stage = stageRef.current;
            const oldScale = stage.scaleX();
            x = stage.getPointerPosition().x / oldScale - stage.x() / oldScale;
            y = stage.getPointerPosition().y / oldScale - stage.y() / oldScale;
            if (x < (bgImgX + bgImgW + rectWidth) && x > bgImgX && y > bgImgY && y < (bgImgY + bgImgH)) {
                setTextPosition({ x: x, y: y });
            }
        }
        if (selectedId === null && newAnnotation.length === 1) {
            const sx = newAnnotation[0].x;
            const sy = newAnnotation[0].y;
            let { x, y } = event.target.getStage().getPointerPosition();
            const stage = stageRef.current;
            const oldScale = stage.scaleX();
            x = stage.getPointerPosition().x / oldScale - stage.x() / oldScale;
            y = stage.getPointerPosition().y / oldScale - stage.y() / oldScale;
            if (config.console)
                console.log(x, y, sx, sy, groupRef.current.getRelativePointerPosition())
            let date = new Date();
            date.toISOString().slice(0, 19).replace('T', ' ')
            const id = uuid();

            // #region Update annotation position
            setNewAnnotation([
                {
                      DrawLineID: 0
                    , BaloonDrwID: 0
                    , BaloonDrwFileID: fileName
                    , ProductionOrderNumber: routingNo
                    , Part_Revision: ""
                    , Page_No: pageNo
                    , DrawingNumber: props.drawingNo
                    , Revision: props.revNo.toUpperCase()
                    , Balloon: annotations.length + 1
                    , Spec: ""
                    , Nominal: ""
                    , Minimum: ""
                    , Maximum: ""
                    , MeasuredBy: ""
                    , MeasuredOn: date
                    , Measure_X_Axis: sx
                    , Measure_Y_Axis: sy
                    , Circle_X_Axis: sx
                    , Circle_Y_Axis: sy
                    , Circle_Width: 28
                    , Circle_Height: 28
                    , Balloon_Thickness: 10
                    , Balloon_Text_FontSize: 10
                    , ZoomFactor: "0.0"
                    , Crop_X_Axis: sx
                    , Crop_Y_Axis: sy
                    , Crop_Width: x - sx
                    , Crop_Height: y - sy
                    , Type: ""
                    , SubType: ""
                    , Unit: ""
                    , Serial_No: ""
                    , Characteristics: ""
                    , Quantity: 1
                    , ToleranceType: ""
                    , PlusTolerance: ""
                    , MinusTolerance: ""
                    , MaxTolerance: ""
                    , MinTolerance: ""
                    , CropImage: ""
                    , CreatedBy: ""
                    , CreatedDate: date
                    , ModifiedBy: ""
                    , ModifiedDate: date
                    , IsCritical: 0
                    , x:sx
                    , y:sy
                    , width: x - sx
                    , height: y - sy
                    , id
                    , selectedRegion
                    , isSaved: false
                    , isballooned: false
                    , isDeleted: false
                    , subBalloon: []
                    , BalloonColor: ""
                    , Actual: ""
                    , Decision: ""
                    , convert: false
                    , converted: 0
                    , ActualDecision: [
                        {
                            OP: { Actual: "", Decision: "" }
                        },
                        {
                            LI: { Actual: "", Decision: "" }
                        },
                        {
                            Final: { Actual: "", Decision: "" }
                        },
                    ]
                }
            ]);
            setNewRegion([{
                DrawLineID: 0
                , BaloonDrwID: 0
                , BaloonDrwFileID: fileName
                , ProductionOrderNumber: routingNo
                , Part_Revision: ""
                , Page_No: pageNo
                , DrawingNumber: props.drawingNo
                , Revision: props.revNo.toUpperCase()
                , Balloon: annotations.length + 1
                , Spec: ""
                , Nominal: ""
                , Minimum: ""
                , Maximum: ""
                , MeasuredBy: ""
                , MeasuredOn: date
                , Measure_X_Axis: sx
                , Measure_Y_Axis: sy
                , Circle_X_Axis: sx
                , Circle_Y_Axis: sy
                , Circle_Width: 28
                , Circle_Height: 28
                , Balloon_Thickness: 10
                , Balloon_Text_FontSize: 10
                , ZoomFactor: "0.0"
                , Crop_X_Axis: sx
                , Crop_Y_Axis: sy
                , Crop_Width: x - sx
                , Crop_Height: y - sy
                , Type: ""
                , SubType: ""
                , Unit: ""
                , Serial_No: ""
                , Characteristics: ""
                , Quantity: 1
                , ToleranceType: ""
                , PlusTolerance: ""
                , MinusTolerance: ""
                , MaxTolerance: ""
                , MinTolerance: ""
                , CropImage: ""
                , CreatedBy: ""
                , CreatedDate: date
                , ModifiedBy: ""
                , ModifiedDate: date
                , IsCritical: 0
                , x: sx
                , y: sy
                , width: x - sx
                , height: y - sy
                , id
                , selectedRegion
                , isSaved: false
                , isballooned: false
                , isDeleted: false
                , subBalloon: []
                , BalloonColor: ""
                , Actual: ""
                , Decision: ""
                , convert: false
                , converted: 0
                , ActualDecision: [
                    {
                        OP: { Actual: "", Decision: "" }
                    },
                    {
                        LI: { Actual: "", Decision: "" }
                    },
                    {
                        Final: { Actual: "", Decision: "" }
                    },
                ]
            }]);
            // #endregion
        }
    };
    // #endregion

    // #region Event to End annotation and ( assign the original cropped value to the newly created annotation / place the Controll Copy value )
    const handleMouseUp = (event) => {
        if (props.drawingDetails.length === 0) {
            return;
        }

        // #region place the Controll Copy value
        if (selectedRegion === "" && selectedId === null && newAnnotation.length !== 1) {
            if (!isDragging) return;
            const stage = stageRef.current;
            const oldScale = stage.scaleX();
            const pointerPos = stage.getPointerPosition();
            const x = pointerPos.x / oldScale - stage.x() / oldScale;
            const y = pointerPos.y / oldScale - stage.y() / oldScale;

            const { ItemView, drawingDetails, drawingNo, revNo, routerno, rectPadding, rectWidth, rectHeight } = useStore.getState();

            setTextPosition({ x: x, y: y });
            setStartBalloon("");
            setEndBalloon("");
            let PN = 0;
            if (drawingDetails.length > 0 && ItemView !== null) {
                PN = parseInt(Object.values(drawingDetails)[parseInt(ItemView)].currentPage);
            }
            let cc = props.controllCopy.filter(x => x.pageNo === PN);
            let newone = { x: (x - rectPadding), y: (y - rectPadding), width: rectWidth, height: rectHeight, };
            let origin = originalPosition(newone);
            let newTextplaced = { x: parseInt(origin.x), y: parseInt(origin.y), width: parseInt(origin.width), height: parseInt(origin.height), };
            let requestData = { drawingNo: drawingNo , revNo: revNo, routerno: routerno, pageNo: PN, origin: newTextplaced, textGroupPlaced : true };
           
            if (cc.length === 0) {
                props.controllCopy.push(requestData)
            } else {
                props.controllCopy.map((x) => {
                    if (x.pageNo === PN) {
                        x.textGroupPlaced = true;
                        x.origin = requestData.origin;
                        x.drawingNo = requestData.drawingNo;
                        x.revNo = requestData.revNo;
                        x.routerno = requestData.routerno;
                    }
                    return x;
                });
            }
            if (config.console)
                console.log("handleMouseUp", requestData)

        }
        // #endregion

        // #region Assign the original cropped value to the newly created annotation
        if (selectedId === null && newAnnotation.length === 1) {
            
            let newone = newAnnotation[0];
            const origin = originalPosition(newone);
            if (origin.width > 10 && origin.height > 10) {
                // Assign the original cropped value to the newly created annotation add newly created to list
                if (config.console)
                    console.log(origin.x, origin.y, origin.width, origin.height)
                if (config.console)
                    console.log(newone)
                newRegion[0].x = parseInt(origin.x);
                newRegion[0].y = parseInt(origin.y);
                newRegion[0].width = parseInt(origin.width);
                newRegion[0].height = parseInt(origin.height);

                newRegion[0].Crop_X_Axis = parseInt(origin.x);
                newRegion[0].Crop_Y_Axis = parseInt(origin.y);
                newRegion[0].Crop_Width = parseInt(origin.width);
                newRegion[0].Crop_Height = parseInt(origin.height);

                newRegion[0].Circle_X_Axis = parseInt(origin.x);
                newRegion[0].Circle_Y_Axis = parseInt(origin.y);
                newRegion[0].Measure_X_Axis = parseInt(origin.x);
                newRegion[0].Measure_Y_Axis = parseInt(origin.y);
                annotations.push(...newAnnotation);
                if (config.console)
                    console.log("originalRegions", "handleMouseUp", originalRegions, newRegion)
                originalRegions.push(...newRegion);
                useStore.setState({ drawingRegions: annotations })
                useStore.setState({ balloonRegions: annotations })
                useStore.setState({ scrollPosition: parseInt(positionLeft) });
                if (selectedRegion === "Selected Region" || selectedRegion === "Unselected Region") {
                    if (config.console)
                        console.log("new region ", newRegion)
                    // Remove the selection rectangle from display while API processes
                    const balloonedOnly = annotations.filter(a => a.isballooned === true);
                    useStore.setState({ drawingRegions: balloonedOnly, balloonRegions: balloonedOnly });
                    selectedRegionProcess(originalRegions);
                }
                if (selectedRegion === "Spl") {
                    selectedSPLRegionProcess(originalRegions);
                }
             }
            setNewAnnotation([]);
            setNewRegion([]);
        }
        // #endregion
    };
    // #endregion

    const handleMouseEnter = event => {
        const state = useStore.getState();
        if (selectedRegion === "Selected Region"
            || selectedRegion === "Unselected Region"
            || selectedRegion === "Spl"
        ) {
            handleClearShape();
            event.target.getStage().container().style.cursor = "crosshair";
        } 
        if (selectedRegion === "") {
            event.target.getStage().container().style.cursor = "auto";
        }
        if (state.isErrImage) {
            event.target.getStage().container().style.cursor = "auto";
        }
    };

    const handleKeyDown = event => {
        if (props.drawingDetails.length === 0) {
            return;
        }

        if (event.keyCode === 8 || event.keyCode === 46) {
            if (selectedId !== null) {
                const state = useStore.getState();
                const { originalRegions, drawingRegions } = state;
                const selected = drawingRegions.filter(a => a.id === selectedId);
                if (selected.length > 0) {
                    let ss = selected[0].ballonNo || '?';
                    Swal.fire({
                        title: `Delete Balloon ${ss}?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, Delete',
                        confirmButtonColor: '#dc3545',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            useStore.setState({ selectAnnotation: null });
                            const newAnnotations = drawingRegions.filter(a => a.id !== selectedId);
                            const newannota = newAnnotations.map((item, i) => ({ ...item, ballonNo: i + 1 }));
                            const newRegions = originalRegions.filter(r => r.id !== selectedId);
                            const newOrg = newRegions.map((item, i) => ({ ...item, ballonNo: i + 1 }));
                            useStore.setState({ originalRegions: newOrg, draft: newOrg, is_BalloonDrawingSaved: false });
                            useStore.setState({ drawingRegions: newannota, balloonRegions: newannota });
                        }
                    });
                }
            }
        }
    };
     
    let annotationsToDraw = [...annotations, ...newAnnotation];
    // #endregion

    if (selectedRegion === "Full Image" && !props.savedDetails && annotations.length === 0) {
        annotationsToDraw = [];
    }
    // #region Context Menu process
    const selectedD = e => {
        e.preventDefault();
        let selected = parseInt(e.target.dataset.value);

        const { ItemView, drawingDetails, originalRegions } = useStore.getState();
        useStore.setState({
            scrollPosition: parseInt(positionLeft),
            konvaPositionTop: parseInt(positionTop),
            documentPositionTop: parseInt(positionscrollTop)
        });
        let pageNo = 0;

        if (drawingDetails.length > 0 && ItemView != null) {
            pageNo = Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
        }

        let PageData = originalRegions.map((item) => {
            if (parseInt(item.Page_No) === parseInt(pageNo)) {
                return item;
            }
            return false;
        }).filter(item => item !== false);
        let selectedRowIndex = "";
        if (PageData.length > 0) {
            var overData = [];
            if (parseInt(selected) - 1 > 0) {
                let overTemp = PageData.filter((item) => { return parseInt(item.Balloon) === parseInt(selected) - 1; });
                overData = Object.values(overTemp)[0];
            } else {
                let overTemp = PageData.filter((item) => { return parseInt(item.Balloon) === parseInt(selected) + 1; });
                overData = Object.values(overTemp)[0];
            }
            let prenxtData = 0;
            if (typeof overData == "undefined") {
                let overTemp = originalRegions.filter((item) => { return parseInt(item.Balloon) === parseInt(selected); });
                overData = Object.values(overTemp)[0];
                prenxtData = PageData.indexOf(overData) - 1;
            } else {

                prenxtData = PageData.indexOf(overData);
            }
            if (prenxtData > -1) {
                //console.log(prenxtData, PageData, overData) 
                selectedRowIndex = PageData[prenxtData].Balloon
                useStore.setState({ selectedRowIndex: selectedRowIndex.toString() });
            }
        }
         if (config.console)
        console.log(PageData, originalRegions, selectedRowIndex, useStore.getState())

        Swal.fire({
            title: `Are you want to delete Balloon (${selected})?`,
            showCancelButton: true,
            confirmButtonText: 'Yes',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            
            if (result.isConfirmed) {
                useStore.setState({ isLoading: true, loadingText: "Delete Balloon... Please Wait..." })
               
                setTimeout(() => {
                    let deletedOrg = originalRegions.map((item) => {
                        if (parseInt(item.Balloon) !== parseInt(selected)) {
                            return item;
                        }
                        return false;
                    }).filter(item => item !== false);
                    //const resetOverData = JSON.parse(JSON.stringify(deletedOrg));
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

                                let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sid, DrawLineID: i, Balloon: b, selectedRegion :""};
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
                                        let pb = parseInt(Balloon).toString() + "." + (qi ).toString();
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
                                            let setter = { ...e, newarr: { ...e.newarr, Balloon: b }, id: sqid, DrawLineID: i, Balloon: b, selectedRegion:"" };
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
                    let AfterPageData = newitems.map((item) => {
                        if (parseInt(item.Page_No) === parseInt(pageNo)) {
                            return item;
                        }
                        return false;
                    }).filter(item => item !== false);
                    if (AfterPageData.length === 0) {
                        let cc = props.controllCopy.filter(x => parseInt(x.pageNo) === parseInt(pageNo));
                        if (config.console)
                        console.log(cc)
                        if (cc.length > 0) {
                            props.controllCopy.map((x) => {
                                if (parseInt(x.pageNo) === parseInt(pageNo)) {
                                    x.textGroupPlaced = false;
                                }
                                return x;
                            })
                            if (config.console)
                            console.log(props.controllCopy)
                        }
                    }

                    const newstate = useStore.getState();
                    let newrect = newBalloonPosition(newitems, newstate);
                    useStore.setState({
                        originalRegions: newitems,
                        draft: newitems,
                        drawingRegions: newrect,
                        balloonRegions: newrect
                    });
                    
                    useStore.setState({ isLoading: false });
                }, 300);
              //  return false;

               
                useStore.setState({ selectedBalloon: null });
                setTimeout(() => { useStore.setState({ ItemView: null });}, 200);
                setTimeout(() => { useStore.setState({ ItemView: ItemView }); } , 200);
                const dstate = useStore.getState();
                setTimeout(function () {
                    let scrollElement = document.querySelector('#konvaMain');
                    if (scrollElement !== null) {
                        scrollElement.scrollLeft = dstate.scrollPosition;
                        scrollElement.scrollTop = dstate.konvaPositionTop;
                        
                    }
                    document.body.scrollTop = dstate.documentPositionTop

                }, 500);
            } else {
                
                setTimeout(function () {
                    const dstate = useStore.getState();
                    let scrollElement = document.querySelector('#konvaMain');
                    if (scrollElement !== null) {
                        scrollElement.scrollLeft = dstate.scrollPosition;
                        scrollElement.scrollTop = dstate.konvaPositionTop;
                    }
                    document.body.scrollTop = dstate.documentPositionTop

                }, 500);
            }
        });
        return false;
    }

    const selectedB = e => {
        e.preventDefault();
        let s = (e.target.dataset.value);
        //console.log(typeof s)
        selectAnnotation(null);
        const props = useStore.getState();
        let annotations = props.drawingRegions;
        let drawingDetails = annotations.map((item) => {
            return { ...item, selected: false };
        });
        useStore.setState({
            scrollPosition: parseInt(positionLeft),
            konvaPositionTop: parseInt(positionTop),
            documentPositionTop: parseInt(positionscrollTop),
            selectedRowIndex:s,
            selectedBalloon: s, drawingRegions: drawingDetails
        })
    };

    const selectedMove = e => {
        e.preventDefault();
        let s = parseInt(e.target.dataset.value);
        let p = (positionLeft > 1) ? positionLeft : 1;
        useStore.setState({
            scrollPosition: parseInt(p),
            konvaPositionTop: parseInt(positionTop),
            documentPositionTop: parseInt(positionscrollTop)
        });
         //console.log("start", s,p)
        const props = useStore.getState();
        let annotations = props.drawingRegions;
        let drawingDetails = annotations.map((item) => {
            if (!item.hasOwnProperty("selected")) {
                item.selected = false;
            }
            return item;
        });
        drawingDetails = drawingDetails.map((item) => {
            if (s  === parseInt(item.Balloon)) {
                item.selected = true;
            } else {
                item.selected = false;
            }
            return item;
        });
        const n = drawingDetails.filter(a => a.selected === true)[0].id;
        //console.log(n)
        setTimeout(() => {
            useStore.setState({
                drawingRegions: drawingDetails,
                selectedRowIndex:s
            })
            selectAnnotation(n);
        }, 500);
    }
    // #endregion

    const overData = [...annotationsToDraw];
    const newstore = overData.map((i) => {
        return i;
    });
    let finalshape = [];
    const filtered = newstore.reduce((result, item) => {
        if (!result[parseInt(item.Balloon)]) {
            result[parseInt(item.Balloon)] = item;
        }
        return result;
    }, {});
    finalshape = Object.values(filtered);

    let createshape = annotationsToDraw.map(a => {
        return parseInt(a.Balloon);
    }).filter(a => !isNaN(a));
    createshape = [...new Set(createshape)];

    let menushape = annotationsToDraw.map(a => {
        return parseInt(a.Balloon);
    }).filter(a => !isNaN(a));
    menushape = [...new Set(menushape)];

    let measurementshape = annotationsToDraw.map(a => {
        return parseInt(a.Balloon);
    }).filter(a => a !== '');
    measurementshape = [...new Set(measurementshape)];

    const subItemList = (e) => {
        return e.map((value, i) => {
            if (!value.isDeleted) {
                return (<React.Fragment key={i + "_sub_frag"}>
                    <ListGroup.Item as="li" id={i + "s_spec"} key={i + "s_spec"} className="spec-button"><Label id={i + "label"}  key={i+"label" }>Sub: </Label> {value.Spec} </ListGroup.Item>
                     {
                        ((props.Convert_to_mm && value.convert) && (
                            <ListGroup.Item as="li" id={i + "inchToMM"}  key={i + "inchToMM"} className="badge">{value.converted} [mm] </ListGroup.Item>
                    ))
                }
                </React.Fragment> );
            }
            return false;
        }).filter(x => x!== false);
    }
    let PageData = props.originalRegions.map((item) => {
        if (parseInt(item.Page_No) === parseInt(pageNo)) {
            return item;
        }
        return false;
    }).filter(item => item !== false);
    if (config.console)
        console.log(PageData)
    let averageValue = props.balloonFont;
    if (config.console)
        console.log(props.balloonFont)
    const r = (props.user[0].role === "Admin" || props.user[0].role === "Supervisor") ? true : false;
    //console.log(selectedShapes,textGroupPlaced)

    // #region Handling the panel resize (Canvas and Table)
    const rightPanelOpen = useStore(state => state.rightPanelOpen);
    const identifyMode = useStore(state => state.identifyMode);
    const draggingBalloon = useStore(state => state._draggingBalloon);
    const [leftWidth, setLeftWidth] = useState(rightPanelOpen ? "60%" : "100%"); // Initial width of the left panel
    const containerRef = React.useRef(null);
    const isResizing = React.useRef(false);

    const toggleRightPanel = () => {
        if (rightPanelOpen) {
            useStore.setState({ rightPanelOpen: false });
            setLeftWidth("100%");
        } else {
            useStore.setState({ rightPanelOpen: true });
            setLeftWidth("60%");
        }
    };

    // Sync leftWidth when rightPanelOpen changes from store (e.g. sidebar table button)
    React.useEffect(() => {
        setLeftWidth(rightPanelOpen ? "60%" : "100%");
    }, [rightPanelOpen]);

    const handleStartResize = (e) => { isResizing.current = true; e.preventDefault(); };
    const handleEndResize = (e) => {    isResizing.current = false; };
    const handleMoveResize = (e) => {
        if (!isResizing.current) return;
        const container = containerRef.current;
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const clientX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
            const newWidth = clientX - containerRect.left;
            const maxWidth = containerRect.width * 0.85;
            const minWidth = containerRect.width * 0.30;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setLeftWidth(`${(newWidth / containerRect.width) * 100}%`);
            }
        }
    };

    React.useEffect(() => {
        document.addEventListener("mousemove", handleMoveResize);
        document.addEventListener("mouseup", handleEndResize);
        document.addEventListener("touchmove", handleMoveResize);
        document.addEventListener("touchend", handleEndResize);
        return () => {
            document.removeEventListener("mousemove", handleMoveResize);
            document.removeEventListener("mouseup", handleEndResize);
            document.removeEventListener("touchmove", handleMoveResize);
            document.removeEventListener("touchend", handleEndResize);
        };
    }, []);
    // #endregion

    // #region Handling Balloon Shape process
    const [selectedIds, setSelectedIds] = useState([]);
    const [showShapePanel, setShowShapePanel] = useState(false);
    const [newballoonShape, setnewballoonShape] = useState(props.balloonShape);
    const [applyToAll, setApplyToAll] = useState(false);
    const shapePanelRef = React.useRef(null);

    const handleChangeShape = (e) => {
        e.preventDefault();
        let s = e.target.dataset.value;
        setSelectedIds([s]);
        setApplyToAll(false);
        setShowShapePanel(true);
    };
    const handleChangeShapes = () => {
        useStore.setState({ selectedRegion: "" });
        // Auto-populate selectedIds from any selection source
        const state = useStore.getState();
        let ids = [...selectedIds];
        // From single canvas selection
        if (ids.length === 0 && state.selectAnnotation) {
            ids = [state.selectAnnotation];
        }
        // From grid checkbox selection
        if (ids.length === 0 && state.selectedGridBalloons && state.selectedGridBalloons.length > 0) {
            const gridIds = state.originalRegions
                .filter(r => r.hasOwnProperty("newarr") && state.selectedGridBalloons.includes(parseInt(r.Balloon)))
                .map(r => r.id);
            ids = gridIds;
        }
        if (ids.length > 0) {
            setSelectedIds(ids);
            setApplyToAll(false);
        } else {
            // No selection — default to All Balloons
            setApplyToAll(true);
        }
        setShowShapePanel(prev => !prev);
    };
    const applyShapeChange = (shapeName) => {
        const useAll = applyToAll || selectedIds.length === 0;
        const state = useStore.getState();
        const { originalRegions } = state;

        // Capture "before" snapshot for undo
        const beforeSnapshot = originalRegions.map((shape) => ({
            id: shape.id, BalloonShape: shape.BalloonShape
        }));

        // Mutate in place (matching codebase pattern) — updates both originalRegions and drawingRegions refs
        annotationsToDraw.forEach((shape) => {
            if (!shape.hasOwnProperty("newarr")) return;
            const shouldUpdate = useAll ? true : selectedIds.includes(shape.id);
            if (shouldUpdate) {
                shape.BalloonShape = shapeName;
                shape.newarr.BalloonShape = shapeName;
            }
        });
        originalRegions.forEach((shape) => {
            if (!shape.hasOwnProperty("newarr")) return;
            const shouldUpdate = useAll ? true : selectedIds.includes(shape.id);
            if (shouldUpdate) {
                shape.BalloonShape = shapeName;
                shape.newarr.BalloonShape = shapeName;
            }
        });

        // Capture "after" snapshot for redo
        const afterSnapshot = originalRegions.map((shape) => ({
            id: shape.id, BalloonShape: shape.BalloonShape
        }));

        // Push to shape history
        const currentIndex = state.shapeHistoryIndex;
        const truncatedHistory = state.shapeHistory.slice(0, currentIndex + 1);
        const newHistory = [...truncatedHistory, { before: beforeSnapshot, after: afterSnapshot }];

        useStore.setState({
            originalRegions: [...originalRegions],
            draft: [...originalRegions],
            shapeHistory: newHistory,
            shapeHistoryIndex: newHistory.length - 1,
            is_BalloonDrawingSaved: false
        });
        setnewballoonShape(shapeName);
        setShowShapePanel(false);
    };
    const handleClearShape = () => {
        setShowShapePanel(false);
        setnewballoonShape(props.balloonShape);
        setApplyToAll(false);
    };

    // Shape modal uses Modal component — no manual outside-click needed

    // Undo/Redo shape changes
    const handleUndoShapeChange = useCallback(() => {
        const state = useStore.getState();
        const { shapeHistory, shapeHistoryIndex } = state;
        if (shapeHistoryIndex < 0) return;
        const entry = shapeHistory[shapeHistoryIndex];
        const restoredShapes = state.originalRegions.map((shape) => {
            const prev = entry.before.find((b) => b.id === shape.id);
            if (prev) {
                if (entry.type === 'color') {
                    shape.BalloonColor = prev.BalloonColor;
                    if (shape.newarr) shape.newarr.BalloonColor = prev.BalloonColor;
                } else {
                    shape.BalloonShape = prev.BalloonShape;
                    if (shape.newarr) shape.newarr.BalloonShape = prev.BalloonShape;
                }
            }
            return shape;
        });
        useStore.setState({ originalRegions: restoredShapes, draft: restoredShapes, shapeHistoryIndex: shapeHistoryIndex - 1 });
    }, []);

    const handleRedoShapeChange = useCallback(() => {
        const state = useStore.getState();
        const { shapeHistory, shapeHistoryIndex } = state;
        if (shapeHistoryIndex >= shapeHistory.length - 1) return;
        const nextIndex = shapeHistoryIndex + 1;
        const entry = shapeHistory[nextIndex];
        const restoredShapes = state.originalRegions.map((shape) => {
            const next = entry.after.find((a) => a.id === shape.id);
            if (next) {
                if (entry.type === 'color') {
                    shape.BalloonColor = next.BalloonColor;
                    if (shape.newarr) shape.newarr.BalloonColor = next.BalloonColor;
                } else {
                    shape.BalloonShape = next.BalloonShape;
                    if (shape.newarr) shape.newarr.BalloonShape = next.BalloonShape;
                }
            }
            return shape;
        });
        useStore.setState({ originalRegions: restoredShapes, draft: restoredShapes, shapeHistoryIndex: nextIndex });
    }, []);

    useEffect(() => {
        const handleShapeUndoRedo = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                handleUndoShapeChange();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                handleRedoShapeChange();
            }
        };
        document.addEventListener('keydown', handleShapeUndoRedo);
        return () => document.removeEventListener('keydown', handleShapeUndoRedo);
    }, [handleUndoShapeChange, handleRedoShapeChange]);

    // SVG shape preview helpers
    const regularPolygonPoints = (cx, cy, sides, radius) => {
        const angle = (2 * Math.PI) / sides;
        const offset = -Math.PI / 2;
        return Array.from({ length: sides }, (_, i) => {
            const x = cx + radius * Math.cos(offset + angle * i);
            const y = cy + radius * Math.sin(offset + angle * i);
            return `${x},${y}`;
        }).join(' ');
    };
    const starPoints = (cx, cy, numPoints, outerR, innerR) => {
        const step = Math.PI / numPoints;
        const offset = -Math.PI / 2;
        return Array.from({ length: numPoints * 2 }, (_, i) => {
            const r = i % 2 === 0 ? outerR : innerR;
            const x = cx + r * Math.cos(offset + step * i);
            const y = cy + r * Math.sin(offset + step * i);
            return `${x},${y}`;
        }).join(' ');
    };
    const renderShapePreview = (shapeName) => {
        const cx = 30, cy = 28, r = 18;
        const stroke = "#0071be", fill = "white", sw = 1.5;
        switch (shapeName) {
            case 'Circle':
                return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Ring':
                return (<><circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={sw} />
                    <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={stroke} strokeWidth={sw} /></>);
            case 'Star':
                return <polygon points={starPoints(cx, cy, 6, r, r * 0.5)} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Triangle':
                return <polygon points={regularPolygonPoints(cx, cy, 3, r)} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Square':
                return <rect x={cx - r * 0.75} y={cy - r * 0.75} width={r * 1.5} height={r * 1.5} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Diamond':
                return <polygon points={regularPolygonPoints(cx, cy, 4, r)} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Pentagon':
                return <polygon points={regularPolygonPoints(cx, cy, 5, r)} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Hexagon':
                return <polygon points={regularPolygonPoints(cx, cy, 6, r)} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Octagon':
                return <polygon points={regularPolygonPoints(cx, cy, 8, r)} fill={fill} stroke={stroke} strokeWidth={sw} />;
            case 'Wedge': {
                const sa = -120 * Math.PI / 180, ea = sa + 60 * Math.PI / 180;
                return <path d={`M ${cx} ${cy} L ${cx + r * Math.cos(sa)} ${cy + r * Math.sin(sa)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(ea)} ${cy + r * Math.sin(ea)} Z`}
                    fill={fill} stroke={stroke} strokeWidth={sw} />;
            }
            case 'Tooltip-Down': case 'Tooltip-UP': case 'Tooltip-Left': case 'Tooltip-Right': {
                const pw = 8, ph = 8, rw = r * 1.5, rh = r * 1.2;
                const rx = cx - rw / 2, ry = cy - rh / 2;
                let ptr = '';
                if (shapeName === 'Tooltip-Down') ptr = `M ${cx - pw / 2} ${ry + rh} L ${cx} ${ry + rh + ph} L ${cx + pw / 2} ${ry + rh} Z`;
                else if (shapeName === 'Tooltip-UP') ptr = `M ${cx - pw / 2} ${ry} L ${cx} ${ry - ph} L ${cx + pw / 2} ${ry} Z`;
                else if (shapeName === 'Tooltip-Left') ptr = `M ${rx} ${cy - pw / 2} L ${rx - ph} ${cy} L ${rx} ${cy + pw / 2} Z`;
                else ptr = `M ${rx + rw} ${cy - pw / 2} L ${rx + rw + ph} ${cy} L ${rx + rw} ${cy + pw / 2} Z`;
                return (<><rect x={rx} y={ry} width={rw} height={rh} rx={3} fill={fill} stroke={stroke} strokeWidth={sw} />
                    <path d={ptr} fill={fill} stroke={stroke} strokeWidth={sw} /></>);
            }
            default:
                return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />;
        }
    };
    // #endregion

    // #region Handling Balloon Color process
    const [showColorModal, setShowColorModal] = useState(false);
    const [newBalloonColor, setNewBalloonColor] = useState(props.defaultPicker || "#1e88e5ff");
    const [applyColorToAll, setApplyColorToAll] = useState(false);
    const [colorSelectedIds, setColorSelectedIds] = useState([]);

    const handleChangeColor = (e) => {
        e.preventDefault();
        handleClearColor();
        let s = e.target.dataset.value;
        setColorSelectedIds([s]);
        setShowColorModal(true);
    };
    const handleChangeColors = () => {
        useStore.setState({ selectedRegion: "" });
        const state = useStore.getState();
        let ids = [...selectedIds];
        // From single canvas selection
        if (ids.length === 0 && state.selectAnnotation) {
            ids = [state.selectAnnotation];
        }
        // From grid checkbox selection
        if (ids.length === 0 && state.selectedGridBalloons && state.selectedGridBalloons.length > 0) {
            const gridIds = state.originalRegions
                .filter(r => r.hasOwnProperty("newarr") && state.selectedGridBalloons.includes(parseInt(r.Balloon)))
                .map(r => r.id);
            ids = gridIds;
        }
        if (ids.length > 0) {
            setColorSelectedIds(ids);
            setApplyColorToAll(false);
        } else {
            setColorSelectedIds([]);
            setApplyColorToAll(true);
        }
        setShowColorModal(true);
    };
    const handleUpdateColor = () => {
        const idsToUpdate = applyColorToAll ? annotationsToDraw.map(s => s.id) : colorSelectedIds;

        // Capture "before" snapshot for undo
        const beforeSnapshot = annotationsToDraw.map((shape) => ({
            id: shape.id, BalloonColor: shape.BalloonColor || ""
        }));

        const updatedShapes = annotationsToDraw.map((shape) => {
            if (applyColorToAll || idsToUpdate.includes(shape.id)) {
                shape.BalloonColor = newBalloonColor;
                if (shape.newarr) shape.newarr.BalloonColor = newBalloonColor;
                return shape;
            }
            return shape;
        });

        // Capture "after" snapshot for redo
        const afterSnapshot = updatedShapes.map((shape) => ({
            id: shape.id, BalloonColor: shape.BalloonColor || ""
        }));

        // Push to shape history (reuse same history for undo/redo)
        const state = useStore.getState();
        const currentIndex = state.shapeHistoryIndex;
        const truncatedHistory = state.shapeHistory.slice(0, currentIndex + 1);
        const newHistory = [...truncatedHistory, { type: 'color', before: beforeSnapshot, after: afterSnapshot }];
        useStore.setState({ shapeHistory: newHistory, shapeHistoryIndex: newHistory.length - 1 });

        setTimeout(() => { useStore.setState({ originalRegions: updatedShapes, draft: updatedShapes }); }, 50);
        handleClearColor();
    };
    const handleClearColor = () => {
        setColorSelectedIds([]);
        setShowColorModal(false);
        setNewBalloonColor(props.defaultPicker || "#1e88e5ff");
        setApplyColorToAll(false);
    };

    const presetColors = [
        { name: "Blue", value: "#1e88e5ff" },
        { name: "Red", value: "#ff0000ff" },
        { name: "Green", value: "#298535ff" },
        { name: "Orange", value: "#ff9800ff" },
        { name: "Purple", value: "#9c27b0ff" },
        { name: "Black", value: "#000000ff" },
    ];
    // #endregion

    const handleWheelZoom = (e) => {
        e.evt.preventDefault();
        if (PageData.length === 0 || props.ItemView == null || props.selectedBalloon !== null) {
            return;
        }
        const stage = e.target.getStage();
        if (!stage) return;

        const scaleBy = 1.08;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        // Scroll up = zoom in, scroll down = zoom out
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        // Clamp scale between 0.1x and 10x
        const clampedScale = Math.max(0.1, Math.min(10, newScale));

        stage.scale({ x: clampedScale, y: clampedScale });

        // Adjust position so zoom centers on mouse pointer
        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };
        stage.position(newPos);
        stage.batchDraw();
    };
    
    return ( 
            <main key="main"  className="mt-1" >     
                <div key="tools-buttons" className="tools-buttons no-select d-flex" width={props.win.width}
                    height={props.height}>
                    <Nav className={classNames("d-inline-flex ", { "d-none": (props.drawingDetails.length === 0 && props.ItemView === null && props.isErrImage === false  ) })}>
                        <NavItem
                            className={classNames("bg-light box  text-right d-flex", { "d-none": !r })}
                            style={{ position: 'relative' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => { if (e.target.closest('#fontScale_wrapper') || e.target.closest('#ccFontScale_wrapper')) e.stopPropagation(); }}
                        >
                            {/* Shape Change Modal — same pattern as Color modal */}
                            <Modal show={showShapePanel} backdrop={false} onHide={() => handleClearShape()} size="md" className="change-color-modal" dialogClassName="modal-side-left">
                                <Modal.Header closeButton>
                                    <Modal.Title>Change Balloon Shape</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Row className="mb-3">
                                        <Col>
                                            <Label style={{ fontSize: '.85rem', fontWeight: 500, marginBottom: '4px' }}>Apply To</Label>
                                            <div className="d-flex gap-3 mb-2">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="shapeApplyTo" id="shapeApplyAll"
                                                        checked={applyToAll} onChange={() => { setApplyToAll(true); setSelectedIds([]); }} />
                                                    <label className="form-check-label" htmlFor="shapeApplyAll">All Balloons</label>
                                                </div>
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="shapeApplyTo" id="shapeApplySelected"
                                                        checked={!applyToAll} onChange={() => setApplyToAll(false)} />
                                                    <label className="form-check-label" htmlFor="shapeApplySelected">Select Balloons</label>
                                                </div>
                                            </div>
                                            {!applyToAll && (
                                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px' }}>
                                                    {annotationsToDraw.filter(b => b.hasOwnProperty("newarr")).length === 0 ? (
                                                        <div style={{ fontSize: '.8rem', color: '#999', textAlign: 'center', padding: '8px' }}>No balloons available</div>
                                                    ) : (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {annotationsToDraw.filter(b => b.hasOwnProperty("newarr")).map((b) => {
                                                                const isChecked = selectedIds.includes(b.id);
                                                                const bColor = b.BalloonColor || props.defaultPicker || "#1e88e5ff";
                                                                return (
                                                                    <div key={b.id}
                                                                        onClick={() => {
                                                                            setSelectedIds(prev =>
                                                                                prev.includes(b.id) ? prev.filter(x => x !== b.id) : [...prev, b.id]
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                                            padding: '3px 8px', borderRadius: '14px', fontSize: '.75rem',
                                                                            border: isChecked ? '2px solid #1e88e5' : '1px solid #ccc',
                                                                            backgroundColor: isChecked ? '#e3f2fd' : '#f8f9fa',
                                                                        }}>
                                                                        <svg width="16" height="16" viewBox="0 0 16 16">
                                                                            <circle cx="8" cy="8" r="7" fill={bColor.substring(0, 7)} stroke={bColor.substring(0, 7)} strokeWidth="1" />
                                                                            <text x="8" y="11" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">{parseInt(b.Balloon)}</text>
                                                                        </svg>
                                                                        <span>#{parseInt(b.Balloon)}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <Label style={{ fontSize: '.85rem', fontWeight: 500, marginBottom: '4px' }}>Select Shape</Label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {props.balloonShapes.map((shapeName, i) => (
                                                    <div key={i}
                                                        style={{
                                                            cursor: 'pointer', textAlign: 'center', padding: '6px',
                                                            borderRadius: '8px', minWidth: '60px',
                                                            border: newballoonShape === shapeName ? '2px solid #1e88e5' : '1px solid #dee2e6',
                                                            backgroundColor: newballoonShape === shapeName ? '#e3f2fd' : '#fff',
                                                        }}
                                                        onClick={() => applyShapeChange(shapeName)}>
                                                        <svg width="36" height="36" viewBox="0 0 60 60">
                                                            {renderShapePreview(shapeName)}
                                                            <text x="30" y="33" textAnchor="middle" fontSize="10" fontFamily="Calibri" fill="#333" fontWeight="bold">42</text>
                                                        </svg>
                                                        <div style={{ fontSize: '.65rem', color: '#555', marginTop: '2px' }}>{shapeName.replace('Tooltip-', 'T-')}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                    </Row>
                                </Modal.Body>
                            </Modal>

                            <Modal show={showColorModal} backdrop={false} onHide={() => handleClearColor()} size="md" className="change-color-modal" dialogClassName="modal-side-right">
                                <Modal.Header closeButton>
                                    <Modal.Title>Change Balloon Color</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Row className="mb-3">
                                        <Col>
                                            <Label style={{ fontSize: '.85rem', fontWeight: 500, marginBottom: '4px' }}>Select Color</Label>
                                            <div className="d-flex align-items-center gap-2">
                                                <input type="color" value={newBalloonColor.substring(0, 7)}
                                                    onChange={(e) => setNewBalloonColor(e.target.value + "ff")}
                                                    style={{ width: '40px', height: '34px', border: '1px solid #dee2e6', borderRadius: '4px', cursor: 'pointer', padding: '2px' }} />
                                                <div className="color-preview-circle" style={{ backgroundColor: newBalloonColor }}></div>
                                                <span style={{ fontSize: '.8rem', color: '#666' }}>{newBalloonColor.substring(0, 7)}</span>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className="mb-3">
                                        <Col>
                                            <Label style={{ fontSize: '.85rem', fontWeight: 500, marginBottom: '4px' }}>Preset Colors</Label>
                                            <div className="d-flex gap-2 flex-wrap">
                                                {presetColors.map((pc, i) => (
                                                    <div key={i}
                                                        className={`color-swatch ${newBalloonColor === pc.value ? 'active' : ''}`}
                                                        style={{ backgroundColor: pc.value }}
                                                        title={pc.name}
                                                        onClick={() => setNewBalloonColor(pc.value)}></div>
                                                ))}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className="mb-3">
                                        <Col>
                                            <Label style={{ fontSize: '.85rem', fontWeight: 500, marginBottom: '4px' }}>Balloon Style</Label>
                                            <div className="d-flex gap-3 align-items-center">
                                                {["dark", "light"].map((mode) => {
                                                    const { balloonMode } = useStore.getState();
                                                    const isActive = balloonMode === mode;
                                                    return (
                                                        <div key={mode}
                                                            onClick={() => useStore.setState({ balloonMode: mode })}
                                                            style={{
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                                padding: '4px 12px', borderRadius: '6px',
                                                                border: isActive ? '2px solid #1e88e5' : '1px solid #ccc',
                                                                backgroundColor: isActive ? '#e3f2fd' : '#fff'
                                                            }}>
                                                            <svg width="28" height="28" viewBox="0 0 28 28">
                                                                <circle cx="14" cy="14" r="12"
                                                                    fill={mode === "dark" ? newBalloonColor : "transparent"}
                                                                    stroke={newBalloonColor} strokeWidth="1.5" />
                                                                <text x="14" y="18" textAnchor="middle" fontSize="10" fill={mode === "dark" ? "#fff" : "#333"} fontWeight="bold">42</text>
                                                            </svg>
                                                            <span style={{ fontSize: '.8rem', fontWeight: isActive ? 600 : 400, textTransform: 'capitalize' }}>{mode}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className="mb-2">
                                        <Col>
                                            <Label style={{ fontSize: '.85rem', fontWeight: 500, marginBottom: '4px' }}>Apply To</Label>
                                            <div className="d-flex gap-3 mb-2">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="colorApplyTo" id="colorApplyAll"
                                                        checked={applyColorToAll} onChange={() => { setApplyColorToAll(true); setColorSelectedIds([]); }} />
                                                    <label className="form-check-label" htmlFor="colorApplyAll">All Balloons</label>
                                                </div>
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="colorApplyTo" id="colorApplySelected"
                                                        checked={!applyColorToAll} onChange={() => setApplyColorToAll(false)} />
                                                    <label className="form-check-label" htmlFor="colorApplySelected">Select Balloons</label>
                                                </div>
                                            </div>
                                            {!applyColorToAll && (
                                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px', padding: '6px' }}>
                                                    {annotationsToDraw.length === 0 ? (
                                                        <div style={{ fontSize: '.8rem', color: '#999', textAlign: 'center', padding: '8px' }}>No balloons available</div>
                                                    ) : (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {annotationsToDraw.map((b) => {
                                                                const isChecked = colorSelectedIds.includes(b.id);
                                                                const bColor = b.BalloonColor || props.defaultPicker || "#1e88e5ff";
                                                                return (
                                                                    <div key={b.id}
                                                                        onClick={() => {
                                                                            setColorSelectedIds(prev =>
                                                                                prev.includes(b.id) ? prev.filter(x => x !== b.id) : [...prev, b.id]
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                                            padding: '3px 8px', borderRadius: '14px', fontSize: '.75rem',
                                                                            border: isChecked ? '2px solid #1e88e5' : '1px solid #ccc',
                                                                            backgroundColor: isChecked ? '#e3f2fd' : '#f8f9fa',
                                                                        }}>
                                                                        <svg width="16" height="16" viewBox="0 0 16 16">
                                                                            <circle cx="8" cy="8" r="7" fill={bColor} stroke={bColor} strokeWidth="1" />
                                                                            <text x="8" y="11" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">{b.Balloon}</text>
                                                                        </svg>
                                                                        <span>#{b.Balloon}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button className="btn btn-secondary btn-sm" onClick={() => handleClearColor()}>Cancel</Button>
                                    <Button variant="primary" className="btn btn-primary btn-sm"
                                        disabled={!applyColorToAll && colorSelectedIds.length === 0}
                                        onClick={() => handleUpdateColor()}>Apply</Button>
                                </Modal.Footer>
                            </Modal>

                            <div className="d-flex align-items-center flex-nowrap gap-2">
                            <ChangeShapeBalloon handleChangeShapes={() => handleChangeShapes()} />
                            <ChangeBalloonColor handleChangeColors={() => handleChangeColors()} />
                            <DeleteBalloon selectedIds={selectedIds} setSelectedIds={(arr) => { setSelectedIds(arr); }} />
                            <ControlCopy startDraggingGroup={startDraggingGroup} />

                            {/* FontSizeControl with label */}
                            <div className="text-center" style={{ flexShrink: 0, marginLeft: "8px" }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                <div className="text-muted" style={{ fontSize: "0.65rem", lineHeight: 1, marginBottom: "2px" }}>Balloon Size</div>
                                <FontSizeControl />
                            </div>

                            {/* ControlCopyFontSizeControl with label */}
                            <div className="text-center" style={{ flexShrink: 0, marginLeft: "8px" }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                <div className="text-muted" style={{ fontSize: "0.65rem", lineHeight: 1, marginBottom: "2px" }}>Controlled Copy Size</div>
                                <ControlCopyFontSizeControl />
                            </div>
                        </div>
                            {/* <FontSizeControl />  */}
                        </NavItem>

                    </Nav>
                    <RightToolBox draggableStage={draggableStage} setdraggableStage={(param) => { setdraggableStage(param) }} />
                </div>
               
                <div className={`grid-container`}
                    ref={containerRef}
                  //  width={(props.win.width + props.win.width * scale)}
                 //   height={(props.win.height + props.win.height * scale) }
                    style={{ border: "1px solid black" }}
                    onMouseMove={handleMoveResize}
                    onMouseUp={handleEndResize}
                    onTouchMove={handleMoveResize}
                    onTouchEnd={handleEndResize}
                    
                >
                    <section id={"konvaMain"}
                        key={"konvaMain"}
                        ref={myElementRef}
                        className="canvas scroll-smooth items-center overflow-x-auto overflow-y-auto left-panel"
                       style={{
                        WebkitOverflowScrolling: "touch",
                           width: leftWidth,
                           flexShrink: 0,
                        }}
                        >
                    <React.Fragment>
                            <div key={'outerdiv'} id={'outerdiv'}

                                onKeyDown={handleKeyDown}>
                            <PopupModal  {...props} key={"popupmodel"} />
                            {finalshape.map((annotation, i) => {
                                let index = (i + 1).toString() + "" + annotation.id.toString();
                                
                                if (annotation.Page_No === pageNo) {
                                    if (menushape.includes(parseInt(annotation.Balloon))) {
                                        menushape = removeA(menushape, parseInt(annotation.Balloon))
                                        let html = "";

                                        if (annotation.subBalloon.length > 0) {
                                            html = subItemList(annotation.subBalloon);
                                        }
                                        return (
                                            <React.Fragment key={index + "_frag"}>
                                                <div key={index + "_pop_wrapper"} id={index + "_pop_wrapper"} data-value={parseInt(annotation.Balloon)} className={"popup"} >
                                                    <div ref={mypopup} key={index + "_pop"} id={index + "_pop"}>
                                                        <ListGroup as="ul" key={index + "_child_pop"} id={index + "_child_pop"} style={{ width: "max-content", height: "auto" }} className={"overflow-x-auto overflow-y-auto"}>
                                                            <ListGroup.Item as="li" key={index + "_balloon"} id={index + "_balloon"} className="balloon-button"><Label id={index + "label_balloon"} key={index + "label_balloon"} >Balloon #: </Label> <b id={index + "blabel_balloon"}  key={index + "blabel_balloon"}>{parseInt(annotation.Balloon)}</b> </ListGroup.Item>
                                                            <ListGroup.Item as="li" key={index + "_qty"} id={index + "_qty"} className="qty-button"><Label id={index + "label_qty"} key={index + "label_qty"}>Qty: </Label> <b id={index + "blabel_qty"} key={index + "blabel_qty"}>{annotation.Quantity}</b>  </ListGroup.Item>
                                                            <ListGroup.Item as="li" key={index + "_spec"} id={index + "_spec"} className="spec-button"><Label id={index + "label_spec"} key={index + "label_spec"} >Spec:  </Label ><div key={index + "label_specdetails"} style={{ maxWidth: "200px", display: "inline-flex", whiteSpace: "pre-line", marginLeft:"5px"}}> {annotation.Spec} </div></ListGroup.Item>
                                                            {html}
                                                            {((props.Convert_to_mm && annotation.convert) && (<>
                                                                <ListGroup.Item as="li" key={index + "_inchToMM"} id={index + "_inchToMM"} ><Label key={index + "_inchToMMText"} id={index + "_inchToMMText"} >mm: {annotation.converted}</Label> </ListGroup.Item>
                                                            </>))}
                                                        </ListGroup>
                                                    </div>
                                                </div>
                                                <div id={index + "_context"}  key={index + "_context"} data-value={parseInt(annotation.Balloon)} className={"contextmenu"} >
                                                    <ListGroup as="ul" id={index + "_childcontext"}  key={index + "_childcontext"}>
                                                        <ListGroup.Item as="li" id={index + "_select"} key={index + "_select"} data-value={(annotation.Balloon).toString()} onClick={selectedB} onTouchStart={selectedB} className="select-button">Select</ListGroup.Item>
                                                        {(r) && (<>
                                                            <ListGroup.Item as="li" id={index + "_delete"} key={index + "_delete"} data-value={parseInt(annotation.Balloon)} onClick={selectedD} onTouchStart={selectedD} className="delete-button">Delete</ListGroup.Item>
                                                            <ListGroup.Item as="li" id={index + "_move"} key={index + "_move"} data-value={parseInt(annotation.Balloon)} onClick={selectedMove} onTouchStart={selectedMove} className="pulse-button">Move Balloon</ListGroup.Item>
                                                            <ListGroup.Item as="li" id={index + "_shape"} key={index + "_shape"} data-value={annotation.id.toString()} onClick={handleChangeShape} onTouchStart={handleChangeShape} className="shape-button">Change Shape</ListGroup.Item>
                                                            <ListGroup.Item as="li" id={index + "_color"} key={index + "_color"} data-value={annotation.id.toString()} onClick={handleChangeColor} onTouchStart={handleChangeColor} className="color-button">Change Color</ListGroup.Item>
                                                        </>)}
                                                    </ListGroup>
                                                </div>
                                            </React.Fragment>
                                        );
                                    } else {
                                        return null;
                                    }
                                } else {
                                    return null;
                                } 
                            }
                            )}
                            <Stage
                                ref={stageRef}
                                width={props.win.width}
                                height={props.win.height}
                                    draggable={(props.selectedRegion !== "" || selectedMeasureId !== null || selectedIds.length > 0 || props.selectedBalloon !== null || !draggableStage) ? false : true }
                                onWheel={handleWheelZoom}
                                // style={{ border: '5px solid gray' }}
                                x={0}
                                y={0}
                                id="konva"
                                key={"stage"}
                                onMouseEnter={handleMouseEnter}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onTouchStart={handleMouseDown} // Ensure touch compatibility
                                onTouchMove={handleMouseMove} // Ensure touch compatibility
                                onTouchEnd={handleMouseUp} // Ensure touch compatibility
                                //onTap={handleMouseClick} // Konva-specific touch click event
                                onClick={handleMouseClick}    
                            >
                                    <Layer key={"layer"} ref={layerRef} >
                                    
                                    <PatternImage src="https://i.stack.imgur.com/7nF5K.png"
                                        x={0}
                                        width={props.win.width}
                                        height={props.win.height}
                                        y={0}
                                        key={"pattern"}
                                        scr={myElementRef}  />
                                   
                                    <Group
                                        width={props.bgImgW}
                                        x={props.bgImgW/2}
                                        y={props.bgImgH/2}
                                        height={props.bgImgH}
                                        rotation={props.bgImgRotation}
                                        ref={groupRef}
                                        offset={{ x: props.bgImgW / 2, y: props.bgImgH / 2 }}
                                        key={"group"}
                                        >
                               
                                        {(props.drawingDetails.length > 0 && props.ItemView != null) && (
                                            <>
                                            <URLImage
                                                key={ "annotation_image"}
                                                src={dim_image}
                                                ItemView={props.ItemView}
                                                x={props.bgImgX}
                                                width={props.win.width}
                                                height={props.win.height}
                                                y={props.bgImgY}
                                                bgImgRotation={props.bgImgRotation}
                                                onMouseDown={() => {
                                                const props = useStore.getState();
                                                let annotations = props.drawingRegions;
                                                let drawingDetails = annotations.map((item) => {
                                                    return { ...item, selected :false};
                                                });
                                                useStore.setState({
                                                    drawingRegions: drawingDetails
                                                })
                                                // console.log(drawingDetails)
                                                // deselect when clicked on empty area
                                                    selectAnnotation(null);
                                                    setSelectedIds([]);
                                                useStore.setState({ selectAnnotation: null })
                                                }}
                                            />
                                        </>
                                        )}

                                        {/* Watermark layer — behind annotations, on top of drawing */}
                                        <WatermarkOverlay
                                            areaW={props.win.width || 0}
                                            areaH={props.win.height || 0}
                                            offsetX={props.bgImgX || 0}
                                            offsetY={props.bgImgY || 0}
                                            imgW={props.bgImgW || 0}
                                            imgH={props.bgImgH || 0}
                                        />

                                        {PageData.length > 0 && (
                                        <>
                                            <Controlledcopy
                                                        key={"cc"}
                                                        isDragging={isDragging}
                                                        textGroupPlaced={textGroupPlaced}
                                                        textPosition={textPosition}
                                                        props={props}
                                                        fontSize={parseInt(averageValue)}
                                                        StartBalloon={StartBalloon}
                                                        EndBalloon={EndBalloon}
                                                        PageData={PageData}
                                                        PN={pageNo}
                                                        stageRef={stageRef}
                                                        draggableCC={draggableCC}
                                                        setdraggableCC={(attr) => {
                                                          //  console.log("setdraggableCC", attr)
                                                            setdraggableCC(attr)
                                                        }}
                                                        onTransformChange={(attr) => {
                                                            console.log("onTransformChange", attr)
                                                            let cc = props.controllCopy.filter(x => parseInt(x.pageNo) === parseInt(pageNo));
                                                            if (config.console)
                                                                console.log(cc)
                                                            if (cc.length === 0) {
                                                                props.controllCopy.push(attr)
                                                            } else {
                                                                props.controllCopy.map((x) => {
                                                                    if (parseInt(x.pageNo) === parseInt(pageNo)) {
                                                                        x.textGroupPlaced = true;
                                                                        x.origin = attr.origin;
                                                                    }
                                                                    return x;
                                                                })
                                                            }
                                                            if (config.console)
                                                                console.log(props.controllCopy)
                                                            
                                                            setdraggableCC(!draggableCC)
                                                           // useStore.setState({ isLoading: false })
                                                        }}
                                                   
                                                        onChange={attr => {
                                                           // console.log("onChangedragplace",attr)
                                                            setTextGroupPlaced(false);
                                                        }}
                                            />
                                        </>
                                        )}
                                       
                                        {annotationsToDraw.map((annotation, i) => {
            
                                            if (parseInt(annotation.Page_No) === parseInt(pageNo) ) {
                                                if (createshape.includes(parseInt(annotation.Balloon))) {
                                                    createshape = removeA(createshape, parseInt(annotation.Balloon))
                                                    //console.log(props.zoomoriginalRegions)
                                                    let movecircle = props.zoomoriginalRegions.filter(item => item.intBalloon === parseInt(annotation.Balloon));
                                                    if (movecircle.length === 0) {
                                                        movecircle = [{ dx: 0, dy: 0 }];

                                                    }
                                                    return (
                                                            <React.Fragment key={i +"ann_frag"}>
                                                            <Annotation
                                                                key={i +"ann"}
                                                                    keyplace={parseInt(annotation.Balloon)}
                                                                    movecircle={movecircle}
                                                                    n={i}
                                                                    // rotation={props.bgImgRotation}
                                                                    fitscreen={props.fitscreen}
                                                                    props={props}
                                                                    positionscrollTop={positionscrollTop}
                                                                    positionLeft={positionLeft}
                                                                    positionWidth={positionWidth}
                                                                    shapeProps={annotation}
                                                       
                                                                    isSelected={annotation.id === selectedId}
                                                                    onMouseDown={() => {
                                                                        //console.log('ssss')
                                                                }}
                                                                fontSize={parseInt(averageValue) }
                                                                identifyMode={identifyMode}
                                                                setSelectedIds={(id) => {
                                                                    if (config.console)
                                                                        console.log(id, selectedIds)
                                                                    useStore.setState({ selectedRegion: "" });
                                                                    setSelectedIds((prev) =>
                                                                        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                                                                    );
                                                        
                                                                    }
                                                                }
                                                                selectedIdsm={selectedIds}

                                                                onSelect={() => {
                                                                        selectAnnotation(annotation.id);
                                                                        setNewAnnotation([]);
                                                                        // Toggle this balloon in grid selection
                                                                        const currentGrid = useStore.getState().selectedGridBalloons || [];
                                                                        const balloonNum = parseInt(annotation.Balloon);
                                                                        const newGrid = currentGrid.includes(balloonNum)
                                                                            ? currentGrid.filter(b => b !== balloonNum)
                                                                            : [...currentGrid, balloonNum];
                                                                        useStore.setState({
                                                                            selectAnnotation: annotation.id,
                                                                            selectedRowIndex: annotation.Balloon,
                                                                            selectedGridBalloons: newGrid
                                                                        });
                                                                    }}
                                                                    onTripleClick={newatt => {
                                                                        // Only open popup if no balloons are selected for deletion
                                                                        const hasSelection = (useStore.getState().selectedGridBalloons || []).length > 0;
                                                                        if (hasSelection) return; // Block popup during multi-select
                                                                        selectAnnotation(null);
                                                                        setNewAnnotation([]);
                                                                        useStore.setState({ selectedBalloon: newatt.Balloon, scrollPosition: parseInt(positionLeft) });
                                                                    }}
                                                                    onDblClick={newatt => {
                                                                        let s = parseInt(newatt.Balloon);
                                                                        let annotations = props.drawingRegions;
                                                                        let drawingDetails = annotations.map((item) => {
                                                                            if (!item.hasOwnProperty("selected")) {
                                                                                item.selected = false;
                                                                            }
                                                                            return item;
                                                                        });
                                                                        drawingDetails = drawingDetails.map((item) => {
                                                                            if (s === parseInt(item.Balloon)) {
                                                                                item.selected = true;
                                                                            } else {
                                                                                item.selected = false;
                                                                            }
                                                                            return item;
                                                                        });
                                                                        const n = drawingDetails.filter(a => a.selected === true)[0].id;
                                                                        selectAnnotation(n);
                                                                }}

                                                                    onChange={newAttrs => {
                                                                        const newOriginalAttrs = ballonOriginalPosition(newAttrs);
                                                                        // Update original position in store
                                                                        originalRegions.forEach((item) => {
                                                                            if (item.id === newAttrs.id && item.hasOwnProperty("newarr")) {
                                                                                item.newarr.Circle_X_Axis = parseInt(newOriginalAttrs.x);
                                                                                item.newarr.Circle_Y_Axis = parseInt(newOriginalAttrs.y);
                                                                            }
                                                                        });

                                                                        if (newAttrs._skipReload) {
                                                                            // Fast path: balloon drag — no loading, no canvas rebuild
                                                                            useStore.setState({
                                                                                originalRegions: [...originalRegions],
                                                                                draft: [...originalRegions],
                                                                                is_BalloonDrawingSaved: false
                                                                            });
                                                                            selectAnnotation(null);
                                                                            setNewAnnotation([]);
                                                                        } else {
                                                                            // Full path: other transforms
                                                                            selectAnnotation(null);
                                                                            setNewAnnotation([]);
                                                                            useStore.setState({ selectedBalloon: null });
                                                                            const { ItemView } = useStore.getState();
                                                                            setTimeout(() => { useStore.setState({ ItemView: null }); }, 200);
                                                                            setTimeout(() => {
                                                                                useStore.setState({
                                                                                    isLoading: false,
                                                                                    ItemView: ItemView
                                                                                });
                                                                            }, 200);
                                                                            setTimeout(() => {
                                                                                let scrollElement = document.querySelector('#konvaMain');
                                                                                if (scrollElement !== null) {
                                                                                    scrollElement.scrollLeft = props.scrollPosition;
                                                                                }
                                                                            }, 50);
                                                                        }
                                                                    }
                                                                    }
                                                                />
                                                            </React.Fragment>
                                                        );
                                                }
                                                else {
                                                    return (<Circle
                                                        key={i+"_unknown_inner"}
                                                        visible={false}
                                                    ></Circle>);
                                                }
                                            }
                                            else {
                                                return (<Circle
                                                    key={i + "_unknown_outer"}
                                                    visible={false}
                                                    ></Circle>);
                                                } 
                                        })}

                                        {annotationsToDraw.map((annotation, i) => {
                                            
                                            if (annotation.Page_No === pageNo) {
                                               
                                                if (measurementshape.includes(parseInt(annotation.Balloon))) {
                                                    measurementshape = removeA(measurementshape, parseInt(annotation.Balloon))
                                                    let movecircle = props.zoomoriginalRegions.filter(item => item.intBalloon === parseInt(annotation.Balloon));
                                                    if (movecircle.length === 0) {
                                                        movecircle = [{ dx: 0, dy: 0 }];
                                                    }
                                                    if (props.Convert_to_mm && annotation.convert) {
                                                        return (
                                                            <Measurement
                                                                key={i + "_reading"}
                                                                keyplace={parseInt(annotation.Balloon)}
                                                                movecircle={movecircle}
                                                    
                                                                fitscreen={props.fitscreen}
                                                                shapeProps={annotation}
                                                                isSelected={annotation.id === selectedMeasureId}
                                                                dfontSize={parseInt(averageValue)}
                                                                onSelect={(newAttrs) => {
                                                                    if (config.console)
                                                                        console.log("Canvas M onSelect ", newAttrs)
                                                                }}
                                                
                                                                onDblClick={newAttrs => {
                                                                    if (config.console)
                                                                        console.log("Canvas M onDblClick ", newAttrs)
                                                                    useStore.setState({ selectedRegion: "" });
                                                                    if (r) { selectMeasureAnnotation(newAttrs.id); }
                                                                    selectAnnotation(null);
                                                                    setNewAnnotation([]);
                                                                }}
                                                                onChange={newAttrs => {
                                                                    let o = originalRegions.filter((i) => {
                                                                        if (i.id === selectedMeasureId) { return i; }
                                                                        else { return false; }
                                                                    }).filter((i) => i !== false);
                                                                    selectMeasureAnnotation(null);
                                                                    let newone = { id: o[0].id, x: o[0].newarr.Measure_X_Axis, y: o[0].newarr.Measure_Y_Axis,   xx: newAttrs.mx, xy: newAttrs.my, newarr:{Circle_X_Axis: o[0].newarr.Measure_X_Axis, Circle_Y_Axis: o[0].newarr.Measure_Y_Axis}}
                                                                    const newOriginalAttrs = ballonOriginalPosition(newone);
                                                                    const scaleX = props.bgImgW / props.imageWidth;
                                                                    const scaleY = props.bgImgH / props.imageHeight;
                                                                    let newX = newAttrs.mx - props.bgImgX;
                                                                    let newY = newAttrs.my - props.bgImgY/2;
                                                                    let scaledX = (newX / scaleX);
                                                                    let scaledY = (newY / scaleY) ;
                                                                    //console.log(newOriginalAttrs, o[0], scaledX, scaledY )
                                                                        originalRegions.map((item) => {
                                                                        if (item.id === selectedMeasureId) {
                                                                            if (config.console)
                                                                                console.log(item)

                                                                            if (item.hasOwnProperty("newarr")) {
                                                                                item.newarr.Measure_X_Axis = parseInt(scaledX) - parseInt(item.newarr.Crop_Width);
                                                                                item.newarr.Measure_Y_Axis = parseInt(scaledY) - parseInt(item.newarr.Crop_Height)/2;
                                                                            }
                                                                            return item;
                                                                        }
                                                                        return item;
                                                                    });
                                                        
                                                                    if (config.console)
                                                                        console.log(newAttrs, selectedMeasureId, o[0], newone, newOriginalAttrs)

                                                                    selectMeasureAnnotation(null);
                                                                    setTimeout(() => {
                                                                        useStore.setState({
                                                                            isLoading: false,
                                                                            ItemView: props.ItemView
                                                                        });
                                                                    }, 50);
                                                                }}
                                                            />
                                                        );
                                                    } else {
                                                        return (<Circle
                                                            key={i + "_reading_unknown"}
                                                            visible={false}
                                                            data-value={annotation.Balloon}
                                                        ></Circle>);
                                                    }
                                                }
                                                else {
                                                    return (<Circle
                                                        key={i + "_reading_unknown_inner"}
                                                        visible={false}
                                                        data-value={annotation.Balloon}
                                                    ></Circle>);
                                                }
                                            }
                                            else {
                                                return (<Circle
                                                    key={i + "_reading_unknown_outter"}
                                                    visible={false}
                                                    data-value={annotation.Balloon}
                                                ></Circle>);
                                            }
                                        })}

                                        {/* Identify arrows are now rendered inside each Annotation component */}

                                    </Group>
                                </Layer>
                            </Stage>
                        </div>
                    </React.Fragment>
                    </section>

                    {/* Right Panel Toggle Button */}
                    <div className="right-panel-toggle" onClick={toggleRightPanel}
                        title={rightPanelOpen ? "Close table panel" : "Open table panel"}
                    >
                        <i className={`fa fa-chevron-${rightPanelOpen ? 'right' : 'left'}`}></i>
                    </div>

                    {/* Resizer + Right Panel */}
                    {rightPanelOpen && (
                        <>
                            <div className="resizer"
                                onMouseDown={handleStartResize}
                                onTouchStart={handleStartResize}
                            />
                            <div className="right-panel" style={{ overflow: 'auto' }}>
                                <AGTable {...props} />
                            </div>
                        </>
                    )}
                </div>

                {/* Table only shows in right panel when open */}
            </main >
    );
}