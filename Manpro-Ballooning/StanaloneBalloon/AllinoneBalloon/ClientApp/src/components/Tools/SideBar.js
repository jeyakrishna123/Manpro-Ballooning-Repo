import React, { useState, useEffect } from "react";
import { NavItem, Button, Row, Col, Label, Input, InputGroup, InputGroupText, FormGroup } from "reactstrap";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import useStore from "../Store/store"; 
import { Buttons } from "../Canvas/Buttons";
import { SketchPickerComponent } from "./ColorPicker";
import { InputComponent } from "./InputType";

const SideBar = ( { stageRef }) => {

    let state = useStore.getState();
    let isOpen = state.sidebarIsOpen;
   // let drawingDetails = state.drawingDetails;
    let outerwidth = "320px";
    let outerwidth_ = "340px";
    let innerwidth = "250px";
 
    const [isHovering, setIsHovering] = React.useState(false);
 
    const handleMouseOver = () => { setIsHovering(true); };
    const handleMouseOut = () => { setIsHovering(false); };
   // const arrow_left = require(`../../assets/arrow_left_2x.png`);

    function getCurrentDimension() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            heightSet: window.scrollY
        }
    }
    const [screenSize, setScreenSize] = useState(getCurrentDimension());
    useEffect(() => {
        const updateDimension = () => {
 
            setScreenSize(getCurrentDimension())
        }
        
        window.addEventListener('resize', updateDimension);
        window.addEventListener('scroll', updateDimension);

        return (() => {
            window.removeEventListener('resize', updateDimension);
            window.removeEventListener('scroll', updateDimension);
        })
    }, [screenSize])
    
    const screenHeight = (screenSize.height / 2) + screenSize.heightSet;
 
    const defaultPicker = (e) => {
        useStore.setState({  defaultPicker: e  })
    }
    const errorPicker = (e) => {
        useStore.setState({  errorPicker: e  })
    }
    const successPicker = (e) => {
        useStore.setState({ successPicker: e })
    }
    
    const onChangeMinMaxOneDigit = (e) => {
        useStore.setState({ MinMaxOneDigit: e })
    }
    const onChangeMinMaxTwoDigit = (e) => {
        useStore.setState({ MinMaxTwoDigit: e })
    }
    const onChangeMinMaxThreeDigit = (e) => {
        useStore.setState({ MinMaxThreeDigit: e })
    }
    const onChangeMinMaxFourDigit = (e) => {
        useStore.setState({ MinMaxFourDigit: e })
    }
    const toggle = (e) => {
        e.preventDefault();
        let state = useStore.getState();
        const r = (props.user[0].role === "Admin" || props.user[0].role === "Supervisor") ? true : false;
        if (!r) {
            useStore.setState({ sidebarIsOpen: false })
            return false;
        }
      //  return false;
        if (!state.sidebarIsOpen)
            useStore.setState({ sidebarIsOpen: true })
        else
            useStore.setState({ sidebarIsOpen: false })

        if (state.drawingDetails.length !== 0) {
           // useStore.setState({ sidebarIsOpen: !state.sidebarIsOpen })
           // useStore.setState({ sidebarIsOpen: true })
        } else {
           // useStore.setState({ sidebarIsOpen: true })
        }
       
    };


    function handleconvert(e) {
        const props = useStore.getState();
       //console.log(e.target.value, !props.Convert_to_mm)
        useStore.setState({
            Convert_to_mm: !props.Convert_to_mm
        });
       // useStore.setState({ Convert_to_mm: e.target.value })
    }

    
    function handleAngleChange(e) {
        useStore.setState({ MinMaxAngles: e })
    }
    const props = useStore.getState();
    const r = (props.user[0].role === "Admin" || props.user[0].role === "Supervisor") ? true : false;
 

    const sidebarRef = React.useRef(null);

    // Sidebar only closes via the toggle button (gear icon) — not by clicking outside
    
    return (
        <>
            <div className="XltNde tTVLSc" style={{ width: isOpen ? outerwidth : "90px" }} >
                <div className="w6VYqd" style={{
                    background: "rgba(255, 255, 255, 0.161)",
                    zIndex:"4"
                } }>
                    <div className="bJzME tTVLSc">
                        <ul className="navbar-nav flex-grow ODXihb Hk4XGb"  >
                            <NavItem className="wR3cXd d-none" style={{ marginTop: "52px" }}>
                                <Button className={classNames("toggleSidebar d-none", { "is-open": isOpen })} size="sm" color="info" onClick={toggle}
                                    //onTap={toggle}
                                    aria-label="Main menu" data-ogmb="1" role="button" tabIndex="0">
                                    <FontAwesomeIcon icon={faAlignLeft} />
                                </Button>
                            </NavItem>
                            <NavItem className="wR3cXd item m-0 " >
                                <Buttons drawingDetails={props.drawingDetails} stageRef={stageRef} ItemView={props.ItemView} />
                            </NavItem>
                        </ul>       
                    </div>

                    <div className="bJzME tTVLSc">
                        <div ref={sidebarRef} className={classNames("k7jAl lJ3Kh", { "miFGmb": isOpen })} style={{ width: isOpen ? innerwidth : "0px" }}>
                            <div className="e07Vkf kA9KIf" style={{ height: ((!props.fitscreen) ? screenSize.height : props.win.height - 100) + "px" }}>
                                <div className="aIFcqe" style={{ width: isOpen ? innerwidth : "90px" }}>
                                    <div className="m6QErb WNBkOb">
                                        <div className="ZKCDEc">
                                            <div className="RZ66Rb FgCUCc p-2">
                                                <div className="p-2 no-select">

                                                <h1 className="mb-2"><b>Settings</b></h1>
                                                    <Row className="pl-2 pr-2 no-gutters">
                                                    <Col className="col-6-md">
                                                        <Label className="apW"> Balloon Color : </Label>
                                                    </Col>
                                                    <Col className="col-6-md">
                                                        <SketchPickerComponent  update={defaultPicker} id="default" color={{ r: '30', g: '136', b: '229', a: '1' }} />
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col className="col-6-md">
                                                        <Label className="apW"> Failed Color : </Label>
                                                    </Col>
                                                    <Col className="col-6-md">
                                                        <SketchPickerComponent update={errorPicker} id="error" color={{ r: '255', g: '0', b: '0', a: '1' }} />
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col className="col-6-md">
                                                        <Label className="apW"> Passed Color: </Label>
                                                    </Col>
                                                    <Col className="col-6-md">
                                                        <SketchPickerComponent update={successPicker} id="update" color={{ r: '41', g: '133', b: '53', a: '1' }} />
                                                    </Col>
                                                </Row>
                                                 
                                                <Row>
                                                    <Col className="col-6-md">
                                                        <Label className="apW"> Balloon Shape : </Label>
                                                    </Col>
                                                    <Col className="col-6-md">
                                                            <Input placeholder="Select"
                                                                id="shape" name="shape"
                                                                type="select"
                                                                disabled={r ? "" : "disabled"}
                                                                value={props.balloonShape}
                                                                style={{ "fontSize": ".8rem" }}
                                                                onChange={(e) => { useStore.setState({ balloonShape: e.target.value }) }}  >
                                                                {props.balloonShapes.map((item, i) => (
                                                                <option key={i}
                                                                    value={item}
                                                                >
                                                                    {item}
                                                                </option>
                                                            ))};
                                                        </Input>
                                                    </Col>
                                                </Row>
                                                <Row className="mt-2">
                                                    <Col className="col-6-md">
                                                        <Label className="apW"> Balloon Mode : </Label>
                                                    </Col>
                                                    <Col className="col-6-md">
                                                        <Input placeholder="Select"
                                                            id="balloonMode" name="balloonMode"
                                                            type="select"
                                                            disabled={r ? "" : "disabled"}
                                                            value={props.balloonMode}
                                                            style={{ "fontSize": ".8rem" }}
                                                            onChange={(e) => { useStore.setState({ balloonMode: e.target.value }) }}>
                                                            <option value="light">Light</option>
                                                            <option value="dark">Dark</option>
                                                        </Input>
                                                    </Col>
                                                </Row>
                                                    <h1 className="mb-3 mt-3 text-center" style={{ fontWeight: "bold" }}>Tolerance</h1>
                                                <div className="text-center tolerence_setting">
                                                <InputGroup className="mb-2" style={{ width: "180px" }}>
                                                    <InputGroupText>
                                                        <Label className="apW" style={{width:"80px"} }> .x = </Label>
                                                        </InputGroupText>
                                                    <InputComponent placeholder=".x" id=".x" name="x" type="text" className="apW" update={onChangeMinMaxOneDigit}  value={props.MinMaxOneDigit} />
                                                </InputGroup>

                                                <InputGroup className="mb-2" style={{ width: "180px" }}>
                                                    <InputGroupText>
                                                        <Label className="apW" style={{ width: "80px" }}> .xx = </Label>
                                                    </InputGroupText>
                                                    <InputComponent placeholder=".xx" id=".xx" name="xx" type="text" className="apW" update={onChangeMinMaxTwoDigit} value={props.MinMaxTwoDigit} />
                                                </InputGroup>
                                             
                                                <InputGroup className="mb-2" style={{ width: "180px" }}>
                                                    <InputGroupText>
                                                        <Label className="apW" style={{ width: "80px" }}> .xxx = </Label>
                                                    </InputGroupText>
                                                    <InputComponent placeholder=".xxx" id=".xxx" name="xxx" type="text" className="apW" update={onChangeMinMaxThreeDigit} value={props.MinMaxThreeDigit} />
                                                </InputGroup>

                                                <InputGroup className="mb-2" style={{ width: "180px" }}>
                                                    <InputGroupText>
                                                        <Label className="apW" style={{ width: "80px" }}> .xxxx = </Label>
                                                    </InputGroupText>
                                                    <InputComponent placeholder=".xxxx" id=".xxxx" name="xxxx" type="text" className="apW" update={onChangeMinMaxFourDigit} value={props.MinMaxFourDigit} />
                                                </InputGroup>
                                           
                                                <InputGroup className="mb-2" style={{ width: "180px" }}>
                                                    <InputGroupText>
                                                        <Label className="apW" style={{ width: "80px" }}> Angles = </Label>
                                                    </InputGroupText>
                                                    <InputComponent placeholder="Angles"  id="angles" name="angles" type="text" className="apW" update={handleAngleChange} value={useStore.getState().MinMaxAngles} />
                                                </InputGroup>
                                                </div>

                                                    <div className="text-center">
                                                        <h1 className="mb-3 mt-3 " style={{ fontWeight: "bold" }}>Other Settings</h1>
                                                        <hr className="dropdown-divider" />
                                                        <FormGroup className="mb-2 d-flex"  check>
                                                            <Input id="convert" name="convert" type="checkbox" onChange={handleconvert} checked={props.Convert_to_mm}  />
                                                            {' '}
                                                            <Label className="p-1 " htmlFor="convert" check style={{ fontSize: ".75rem", fontWeight:"bold"} }>
                                                                Convert Inches To MM
                                                            </Label>
                                                        </FormGroup>
                                                        <FormGroup className="mb-2 d-flex" check>
                                                            <Input id="accurateGDT" name="accurateGDT" type="checkbox"
                                                                onChange={() => {
                                                                    const current = useStore.getState().accurateGDT || false;
                                                                    useStore.setState({ accurateGDT: !current });
                                                                }}
                                                                checked={props.accurateGDT || false} />
                                                            {' '}
                                                            <Label className="p-1" htmlFor="accurateGDT" check style={{ fontSize: ".75rem", fontWeight:"bold" }}>
                                                                Accurate GD&T Extraction
                                                            </Label>
                                                        </FormGroup>
                                                 </div>

                                                 {/* ─── Watermark Panel ─── */}
                                                 <div style={{ marginTop: "16px", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fafbfc", padding: "12px 10px" }}>
                                                    {/* Header with toggle */}
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <span style={{ fontSize: ".85rem", fontWeight: "700", color: "#333", letterSpacing: ".3px" }}>Watermark</span>
                                                        <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                                                            <span style={{ fontSize: ".6rem", color: (useStore.getState().watermark || {}).enabled ? "#0d6efd" : "#999" }}>
                                                                {(useStore.getState().watermark || {}).enabled ? "ON" : "OFF"}
                                                            </span>
                                                            <div onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, enabled: !wm.enabled } }); }}
                                                                style={{ width: "36px", height: "20px", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s",
                                                                    background: (useStore.getState().watermark || {}).enabled ? "#0d6efd" : "#ccc",
                                                                    position: "relative" }}>
                                                                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px",
                                                                    left: (useStore.getState().watermark || {}).enabled ? "18px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {(useStore.getState().watermark || {}).enabled && (<>

                                                    {/* ── Text Input ── */}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label style={{ fontSize: ".65rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "4px" }}>Text</label>
                                                        <Input type="text" placeholder="Enter watermark text..."
                                                            style={{ fontSize: ".9rem", fontWeight: "600", textAlign: "center", borderRadius: "6px", border: "1px solid #ddd" }}
                                                            value={(useStore.getState().watermark || {}).text || ""}
                                                            onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, text: e.target.value } }); }} />
                                                    </div>

                                                    {/* ── Quick Presets ── */}
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center", marginBottom: "12px" }}>
                                                        {["DRAFT", "CONFIDENTIAL", "CONTROLLED", "SAMPLE", "APPROVED", "REJECTED", "FOR REVIEW", "COPY"].map(p => {
                                                            const active = (useStore.getState().watermark || {}).text === p;
                                                            return (<span key={p} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, text: p } }); }}
                                                                style={{ fontSize: ".58rem", padding: "2px 7px", borderRadius: "10px", cursor: "pointer", userSelect: "none", transition: "all .15s",
                                                                    background: active ? "#0d6efd" : "#f0f0f0", color: active ? "#fff" : "#555", fontWeight: active ? "600" : "400",
                                                                    border: active ? "1px solid #0d6efd" : "1px solid #ddd" }}>{p}</span>);
                                                        })}
                                                    </div>

                                                    {/* ── Preview ── */}
                                                    <div style={{ background: "#fff", border: "1px dashed #ccc", borderRadius: "6px", padding: "10px", marginBottom: "12px", textAlign: "center", minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                                        <span style={{
                                                            fontSize: Math.min((useStore.getState().watermark || {}).fontSize || 48, 32) + "px",
                                                            fontFamily: (useStore.getState().watermark || {}).fontFamily || "Arial",
                                                            fontWeight: (useStore.getState().watermark || {}).fontWeight || "bold",
                                                            color: (useStore.getState().watermark || {}).color || "#888",
                                                            opacity: (useStore.getState().watermark || {}).opacity || 0.15,
                                                            transform: `rotate(${(useStore.getState().watermark || {}).rotation || -30}deg)`,
                                                            whiteSpace: "nowrap"
                                                        }}>{(useStore.getState().watermark || {}).text || "DRAFT"}</span>
                                                    </div>

                                                    {/* ── Size ── */}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "2px" }}>
                                                            <label style={{ fontSize: ".65rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: ".5px" }}>Size</label>
                                                            <span style={{ fontSize: ".7rem", fontWeight: "700", color: "#333", background: "#f0f0f0", padding: "1px 8px", borderRadius: "8px" }}>
                                                                {(useStore.getState().watermark || {}).fontSize || 48}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex align-items-center" style={{ gap: "4px" }}>
                                                            <div onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontSize: Math.max(10, (wm.fontSize || 48) - 5) } }); }}
                                                                style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: ".9rem", fontWeight: "bold", color: "#555", userSelect: "none", border: "1px solid #ddd" }}>-</div>
                                                            <Input type="range" min="10" max="200" step="2" style={{ flex: 1 }}
                                                                value={(useStore.getState().watermark || {}).fontSize || 48}
                                                                onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontSize: parseInt(e.target.value) } }); }} />
                                                            <div onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontSize: Math.min(200, (wm.fontSize || 48) + 5) } }); }}
                                                                style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: ".9rem", fontWeight: "bold", color: "#555", userSelect: "none", border: "1px solid #ddd" }}>+</div>
                                                        </div>
                                                    </div>

                                                    {/* ── Visibility ── */}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "2px" }}>
                                                            <label style={{ fontSize: ".65rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: ".5px" }}>Visibility</label>
                                                            <span style={{ fontSize: ".7rem", fontWeight: "700", color: "#333", background: "#f0f0f0", padding: "1px 8px", borderRadius: "8px" }}>
                                                                {Math.round(((useStore.getState().watermark || {}).opacity || 0.15) * 100)}%
                                                            </span>
                                                        </div>
                                                        <Input type="range" min="2" max="60" step="1"
                                                            value={Math.round(((useStore.getState().watermark || {}).opacity || 0.15) * 100)}
                                                            onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, opacity: parseInt(e.target.value) / 100 } }); }} />
                                                    </div>

                                                    {/* ── Angle ── */}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label style={{ fontSize: ".65rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "4px" }}>Angle</label>
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "3px" }}>
                                                            {[{ l: "0\u00B0", v: 0 }, { l: "-15\u00B0", v: -15 }, { l: "-30\u00B0", v: -30 }, { l: "-45\u00B0", v: -45 }, { l: "30\u00B0", v: 30 }, { l: "45\u00B0", v: 45 }, { l: "90\u00B0", v: 90 }, { l: "-90\u00B0", v: -90 }].map(a => {
                                                                const active = (useStore.getState().watermark || {}).rotation === a.v;
                                                                return (<span key={a.v} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, rotation: a.v } }); }}
                                                                    style={{ fontSize: ".6rem", padding: "3px 0", borderRadius: "4px", cursor: "pointer", userSelect: "none", textAlign: "center",
                                                                        background: active ? "#333" : "#f5f5f5", color: active ? "#fff" : "#555", fontWeight: active ? "700" : "400",
                                                                        border: active ? "1px solid #333" : "1px solid #ddd" }}>{a.l}</span>);
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* ── Layout ── */}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label style={{ fontSize: ".65rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "4px" }}>Layout</label>
                                                        <div className="d-flex justify-content-center" style={{ gap: "3px" }}>
                                                            {[{ l: "Diagonal", k: "diagonal" }, { l: "Repeat", k: "tiled" }, { l: "Single", k: "single" }].map(s => {
                                                                const active = (useStore.getState().watermark || {}).layout === s.k;
                                                                return (<span key={s.k} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, layout: s.k, customX: null, customY: null } }); }}
                                                                    style={{ fontSize: ".62rem", padding: "3px 10px", borderRadius: "4px", cursor: "pointer", userSelect: "none", transition: "all .15s",
                                                                        background: active ? "#0d6efd" : "#f5f5f5", color: active ? "#fff" : "#555", fontWeight: active ? "700" : "400",
                                                                        border: active ? "1px solid #0d6efd" : "1px solid #ddd" }}>{s.l}</span>);
                                                            })}
                                                        </div>
                                                        {(useStore.getState().watermark || {}).layout === "single" && (
                                                            <div style={{ fontSize: ".55rem", color: "#0d6efd", textAlign: "center", marginTop: "4px", fontStyle: "italic" }}>
                                                                Drag watermark on drawing to reposition
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ── Color ── */}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label style={{ fontSize: ".65rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "4px" }}>Color</label>
                                                        <div className="d-flex align-items-center" style={{ gap: "5px" }}>
                                                            <Input type="color" style={{ width: "30px", height: "24px", padding: "0", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
                                                                value={(useStore.getState().watermark || {}).color || "#888888"}
                                                                onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, color: e.target.value } }); }} />
                                                            {[{ c: "#bbbbbb", n: "Light" }, { c: "#666666", n: "Dark" }, { c: "#cc0000", n: "Red" }, { c: "#0055aa", n: "Blue" }, { c: "#006600", n: "Green" }, { c: "#000000", n: "Black" }].map(o => (
                                                                <div key={o.c} title={o.n} onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, color: o.c } }); }}
                                                                    style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: o.c, cursor: "pointer",
                                                                        border: (useStore.getState().watermark || {}).color === o.c ? "2px solid #0d6efd" : "1px solid #ddd",
                                                                        boxShadow: (useStore.getState().watermark || {}).color === o.c ? "0 0 0 2px rgba(13,110,253,.25)" : "none" }} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* ── Font ── */}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label style={{ fontSize: ".65rem", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "4px" }}>Font</label>
                                                        <div className="d-flex align-items-center" style={{ gap: "4px" }}>
                                                            <Input bsSize="sm" type="select" style={{ flex: 1, fontSize: ".7rem", borderRadius: "4px" }}
                                                                value={(useStore.getState().watermark || {}).fontFamily || "Arial"}
                                                                onChange={(e) => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontFamily: e.target.value } }); }}>
                                                                <option value="Arial">Arial</option>
                                                                <option value="Calibri">Calibri</option>
                                                                <option value="Times New Roman">Times New Roman</option>
                                                                <option value="Courier New">Courier New</option>
                                                                <option value="Georgia">Georgia</option>
                                                                <option value="Verdana">Verdana</option>
                                                                <option value="Impact">Impact</option>
                                                            </Input>
                                                            {/* Bold / Normal toggle */}
                                                            <span onClick={() => { const wm = useStore.getState().watermark; useStore.setState({ watermark: { ...wm, fontWeight: wm.fontWeight === "bold" ? "normal" : "bold" } }); }}
                                                                style={{ fontSize: ".7rem", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", userSelect: "none", fontWeight: "bold",
                                                                    background: (useStore.getState().watermark || {}).fontWeight === "bold" ? "#333" : "#f5f5f5",
                                                                    color: (useStore.getState().watermark || {}).fontWeight === "bold" ? "#fff" : "#555",
                                                                    border: "1px solid #ddd" }}>B</span>
                                                        </div>
                                                    </div>

                                                    {/* ── Reset ── */}
                                                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                                                        <span onClick={() => {
                                                                useStore.setState({ watermark: { ...useStore.getState().watermark, text: "DRAFT", fontSize: 48, color: "#888888", opacity: 0.15, rotation: -30, layout: "diagonal", fontFamily: "Arial", fontWeight: "bold", customX: null, customY: null } });
                                                            }}
                                                            style={{ fontSize: ".6rem", color: "#999", cursor: "pointer", textDecoration: "underline", userSelect: "none" }}>
                                                            Reset to defaults
                                                        </span>
                                                    </div>

                                                    </>)}
                                                 </div>

                                            </div>
                                        </div>
                                            <div className="jwfPme">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={classNames("gYkzb", {"d-none": !r})}
                    style={{ left: isOpen ? outerwidth_ : "90px", top: screenHeight, "zIndex": isOpen ? 5 : 0 }}
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}  >
                    <Button style={{ "zIndex": 1, right: isOpen ? outerwidth_ : "90px", background:"repeating-radial-gradient(#666866, transparent 100px)" }} className={classNames("yra0jd Hk4XGb", { "is-open": isOpen })} size="sm" color="info" onClick={toggle} aria-expanded={toggle} aria-label="Main menu" data-ogmb="1" role="button" tabIndex="0">
                        {/* <img alt="" src={arrow_left} className="EIbCs" />*/}
                        <i className="fa fa-lg fa-gear" style={{ color:"#fff"} }></i>
                    </Button>
                    <span className="PySCB EI48Lc" /*aria-hidden={!isOpen}*/ style={{ display :isHovering ? "block" : "none" } } >
                        {isHovering && (
                            <div>
                                {!isOpen ? "Expand side panel" : "Collapse side panel"}
                            </div>
                        )}
                    </span>
                </div>
            </div>
        </>
    );
}
export default SideBar;
