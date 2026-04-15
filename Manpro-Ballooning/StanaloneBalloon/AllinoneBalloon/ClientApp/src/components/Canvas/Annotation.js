// #region Component Imports
import React, { useEffect } from "react";
import { Rect, Circle, Text, Group, Transformer, Ring, Star, Wedge, RegularPolygon, Label, Tag, Arrow } from "react-konva";
import useStore from "../Store/store";
import initialState from "../Store/init";
import { config } from "../Common/Common";
// #endregion

//const Annotation = ({ n, movecircle, shapeProps, isSelected, IsChangeShapes, selectedShapes, onSelectedShapes, onSelect, onDblClick, onTripleClick, onChange, keyplace, rotation, positionWidth, positionLeft, fitscreen, positionscrollTop, selectedIdsm, setSelectedIds }) => {
const Annotation = ({ n, movecircle, shapeProps, isSelected, onSelect, onDblClick, onTripleClick, onChange, keyplace, rotation, positionWidth, positionLeft, fitscreen, positionscrollTop, selectedIdsm, setSelectedIds, fontSize, identifyMode }) => {
    const shapeRef = React.useRef();
    const transformRef = React.useRef();
    const cirRef = React.useRef();
    const groupRef = React.useRef();
    const textRef = React.useRef(null);
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
    // Reset drag offset when balloon position changes (after store update)
    React.useEffect(() => { setDragOffset({ x: 0, y: 0 }); }, [shapeProps.Circle_X_Axis, shapeProps.Circle_Y_Axis]);
   // console.log(selectedIdsm)

    const handleCircleClick = (id, e) => {
        if (e.evt.ctrlKey ||  e.evt.metaKey || e.evt.touches?.length > 1) {
            // Toggle selection when Ctrl + Click
            setSelectedIds(id);
        }
    };

    // Red ring for balloons selected for deletion
    const selectedGridBalloons = useStore((s) => s.selectedGridBalloons) || [];
    const isMarkedForDelete = selectedGridBalloons.includes(parseInt(shapeProps.Balloon));
    useEffect(() => {
        if (isSelected) {
            // we need to attach transformer manually
           // transformRef.current.setNode(shapeRef.current);
            transformRef.current.nodes([groupRef.current]);
            transformRef.current.getLayer().batchDraw();

        }
    }, [isSelected]);
    
 
    //console.log(anstate)

    const onMouseEnter = event => {
        event.target.getStage().container().style.cursor = "move";
    };

    const onMouseLeave = event => {
        event.target.getStage().container().style.cursor = "auto";
    };
    
    // set the circle text to be center
    let circleWidth = 0;
    let textWidth = 0;
 
    const fontScale = useStore((s) => s.fontScale);
    const { defaultPicker, bgImgScale, imageWidth, imageHeight, win, ItemView, drawingDetails, scaleStep, InitialScale, balloonMode } = useStore.getState();
    const isDark = balloonMode === "dark";

    let fontText = 1;
    let desiredBalloon = 1;
    let desiredRadius = 1.3;
    let fontSizeScale = 0;
    if (fontScale !== 0) {
        fontSizeScale = fontScale / 10;
    }

    let scale = 1;
    let scaleX = win.width / imageWidth;
    let scaleY = win.height / imageHeight;

    scale = Math.min(scaleX, scaleY);

    if (fitscreen) {
        desiredBalloon = 1.5;
        desiredRadius = 2.3;
    } else {
        fontText = bgImgScale + fontSizeScale * bgImgScale; // changable
    }

    let resize = "false";
    if (drawingDetails.length > 0 && ItemView != null) {
        resize = drawingDetails.length > 0 ? Object.values(drawingDetails)[parseInt(ItemView)].resize : "false";
    }
    if (resize === "true") {
        scale = scaleStep + InitialScale;
    } else {
        scale = 0.75
    }
    if (fitscreen) {
        fontText = scale;
    }  
 
    if (isNaN(keyplace)) keyplace = 0;
    let textFontSize = fontSize * fontText;
    switch (keyplace.toString().length) {
        case 1:
            circleWidth = 10 * fontText;
            textWidth = 10 * fontText;
            break;
        case 2:
            circleWidth = 12 * fontText;
            textWidth = 12 * fontText;
            break;
        case 3:
            circleWidth = 14 * fontText;
            textWidth = 14 * fontText;
            break;
        case 4:
            circleWidth = 16 * fontText;
            textWidth = 16 * fontText;
            break;
        default:
            circleWidth = 10 * fontText;
            textWidth = 10 * fontText;
            break;
    }
    let radius = 7.5;
 
    switch (keyplace.toString().length) {
        case 1:
            radius = 7.5;
            break;
        case 2:
            radius = 8;
            break;
        case 3:
            radius = 10;
            break;
        case 4:
            radius = 11;
            break;
        default:
            radius = 7.5;
            break;
    }
     
   // console.log(scale, bgImgScale, fontText,fontSize)
    // console.log(movecircle, movecircle[0].intBalloon, movecircle[0].dx, movecircle[0].dy)
 
   // let circle_text_x = shapeProps.Circle_X_Axis - 7 * bgImgScale + movecircle[0].dx;
    let circle_text_x = shapeProps.Circle_X_Axis - circleWidth * bgImgScale + movecircle[0].dx ;
   // let circle_text_y = shapeProps.Circle_Y_Axis - 10 * bgImgScale + movecircle[0].dy;
    let circle_text_y = shapeProps.Circle_Y_Axis - circleWidth * bgImgScale + movecircle[0].dy + shapeProps.Crop_Height / 2;
    if (fitscreen) {
        if (circle_text_x < 0)
            circle_text_x = shapeProps.Circle_X_Axis;
        if (circle_text_y < 10)
            circle_text_y = 10;
       //console.log(keyplace, circle_text_x, circle_text_y, circle_text_x - (textWidth / desiredBalloon) / 2 )
    }
    const handleContextMenu = (e) => {
       // e.evt.preventDefault();
       // console.log('Context menu triggered');
        e.evt.preventDefault(true);
        let mousePosition = e.target.getStage().getPointerPosition();
        let containerRect = e.target.getStage().container().getBoundingClientRect();
        //let scrollElement = document.querySelector('#konva');
        // console.log(scrollElement.scrollLeft)
        const props = useStore.getState();
        var doc = document.documentElement;
        var top = ( doc.scrollTop) - (doc.clientTop || 0);
        var menuNode = document.getElementsByClassName('contextmenu');
        let selectedRegion = e.target.attrs.text;
        for (let i = 0; i < menuNode.length; i++) {
            if (menuNode[i].getAttribute("data-value") === selectedRegion) {
                menuNode[i].style.display = 'initial';
                menuNode[i].style.position = 'absolute';
                // let pr = positionLeft + positionWidth;
                let bargap = parseInt(positionWidth - containerRect.width);
                //let scrollElement = document.querySelector('#konvaMain');
                let multiplex = ((props.win.width === initialState.win.width && props.win.height === initialState.win.height) && (props.imageWidth < 32767 || props.imageHeight < 32767)) ? 1 : 2;
                let bardiv = (((bargap / 2) > 0) ? (bargap / 2) : 0) * multiplex;
                let pads = (bardiv > 0) ? (props.pad * 2) : 0;
                if (positionscrollTop < 130) {
                    menuNode[i].style.top =   mousePosition.y + top + 4 + 'px';
                } else {
                    menuNode[i].style.top =   mousePosition.y + top + 4 + 'px';
                }
                let adjust = 0;
                let intLeft = parseInt(positionLeft);
                if (props.bgImgX === 0 || props.bgImgY === 0) {

                } else {
                    if (intLeft === 0) {
                        adjust = intLeft + (containerRect.width - positionWidth) + bardiv - pads;
                    } else {
                        if (intLeft < bargap) {
                            adjust = intLeft + (containerRect.width - positionWidth) + bardiv - intLeft - pads;
                        } else if (intLeft === bargap) {
                            adjust = (containerRect.width - positionWidth) + bardiv - pads;
                        }
                    }
                }

                //console.log(props )
                //console.log(positionLeft, positionWidth, ((props.win.width - props.bgImgW) / 2), positionLeft + containerRect.width - positionWidth)

                menuNode[i].style.left = mousePosition.x + ((props.win.width - props.bgImgW) / 2) + adjust - positionLeft -75 + 'px';
            } else {
                menuNode[i].style.display = 'none';
            }

        }

    };

    const touchTimeout = React.useRef(null);
    const lastTouchTime = React.useRef(0);

    const handleSingleTouch = (e) => {
        //console.log("Single Touch Detected!", shapeProps.id);
       // onSelectedShapes({ ...shapeProps })
        
    };

    const handleDoubleTouch = () => {
      //  console.log("Double Touch Detected!");
        onTripleClick({ ...shapeProps })
    };
 
    const touchTimer = React.useRef(null); // Timer for long press detection
    const handleTouchStart = (e) => {
        const currentTime = Date.now();
        const timeSinceLastTouch = currentTime - lastTouchTime.current;

        if (timeSinceLastTouch < 300 && timeSinceLastTouch > 0) {
            clearTimeout(touchTimeout.current);
            handleDoubleTouch();
        } else {
            touchTimeout.current = setTimeout(() => {
                handleSingleTouch(e);
            }, 300);
        }

        lastTouchTime.current = currentTime;
        touchTimer.current = setTimeout(() => {
           // setContextMenu({ x: touch.clientX, y: touch.clientY });
           // console.log('Context menu triggered');
            handleContextMenu(e)
        }, 500); // Trigger long press after 500ms
    };
    const handleTouchEnd = () => {
        clearTimeout(touchTimer.current); // Clear timer on touch end
    };
   // console.log(circleWidth, bgImgScale, fontSize, fontText, circle_text_x, circle_text_y, useStore.getState())
    return (
        <React.Fragment>      
 
            {(shapeProps.selectedRegion !== "Selected Region" && shapeProps.selectedRegion !== "Unselected Region" && shapeProps.selectedRegion !== "Spl") &&  (
                <>
                    <Group
                        key={n + "_ann_group_" + shapeProps.BalloonShape}
                        //x={shapeProps.width / 2} y={shapeProps.height / 2}
                        // offset={{ x: shapeProps.width / 2, y: shapeProps.height / 2 }}
                        onTap={(e) => { e.cancelBubble = true; onSelect(); }}
                        onMouseDown={(e) => {
                            // Stop canvas from panning when clicking/dragging a balloon
                            e.cancelBubble = true;
                        }}
                        onClick={(e) => {
                            e.cancelBubble = true;
                            e.evt.preventDefault(true);
                            e.evt.stopPropagation();
                            if (e.evt.detail === 1) {
                                onSelect();
                                if (e.evt.ctrlKey || e.evt.metaKey) {
                                    setSelectedIds(shapeProps.id);
                                }
                            }
                            if (e.evt.detail === 2) {
                                    onTripleClick({ ...shapeProps })
                            }
                        }}

                        rotation={rotation}
                        onMouseEnter={(e) => {
                            if (isSelected) { onMouseEnter(e); }
                            else { e.target.getStage().container().style.cursor = "pointer"; }
                        }}
                        onDblClick={(e) =>
                            {
                                e.evt.preventDefault(true);
                                e.evt.stopPropagation();  
                           
                           
                            }
                        }
                        
                        onMouseLeave={(e) => {
                            var popupNode = document.getElementsByClassName('popup');
                            for (let i = 0; i < popupNode.length; i++) {
                                popupNode[i].style.display = 'none';
                            }
                            onMouseLeave(e);
                        }
                        }
                        onMouseOver={(e) => {
                            if ( e.evt.ctrlKey) {
                                onMouseLeave(e);

                            }else if (isSelected) {
                                onMouseEnter(e);

                            } else {
                                onMouseLeave(e);
                                // handleCircleClick(e)
                                var popupNode = document.getElementsByClassName('popup');
                                let selectedRegion = e.target.attrs.text;
                                let mousePosition = e.target.getStage().getPointerPosition();
                                let containerRect = e.target.getStage().container().getBoundingClientRect();
                                //let scrollElement = document.querySelector('#konva');

                                // const pt = positionscrollTop;
                                const props = useStore.getState();
                                var doc = document.documentElement;
                                var top = ( doc.scrollTop) - (doc.clientTop || 0);
                                for (let i = 0; i < popupNode.length; i++) {
                                    if (popupNode[i].getAttribute("data-value") === selectedRegion) {
                                        popupNode[i].style.display = 'initial';
                                        popupNode[i].style.position = 'absolute';

                                        let bargap = parseInt(positionWidth - containerRect.width);
                                        let multiplex = ((props.win.width === initialState.win.width && props.win.height === initialState.win.height) && (props.imageWidth < 32767 || props.imageHeight < 32767)) ? 1 : 2;
                                        let bardiv = (((bargap / 2) > 0) ? (bargap / 2) : 0) * multiplex;
                                        let pads = (bardiv > 0) ? (props.pad * 2) : 0;
                                        if (positionscrollTop < 130) {
                                            popupNode[i].style.top = mousePosition.y + top + 4 + 'px';
                                        } else {
                                            popupNode[i].style.top = mousePosition.y + top + 4 + 'px';
                                        }
                                        // console.log(positionscrollTop, containerRect, mousePosition)
                                        let adjust = 0;
                                        let intLeft = parseInt(positionLeft);
                                        if (props.bgImgX === 0 || props.bgImgY === 0) {

                                        } else {
                                            if (intLeft === 0) {
                                                adjust = intLeft + (containerRect.width - positionWidth) + bardiv - pads;
                                            } else {
                                                if (intLeft < bargap) {
                                                    adjust = intLeft + (containerRect.width - positionWidth) + bardiv - intLeft - pads;
                                                } else if (intLeft === bargap) {
                                                    adjust = (containerRect.width - positionWidth) + bardiv - pads;
                                                }
                                            }
                                        }
                                        if (config.console)
                                            console.log(adjust)
                                        popupNode[i].style.left = mousePosition.x - (props.bgImgX - props.pad) + ((props.win.width - props.bgImgW) / 2) + 0 - positionLeft - 75 + 'px';
                                    } else {
                                        popupNode[i].style.display = 'none';
                                    }
                                }
                            }
                        }
                        }
                        onTouchStart={handleTouchStart} // Long press (touch)
                        onTouchEnd={handleTouchEnd} // Clear long press
                        onContextMenu={handleContextMenu}
                        draggable={isSelected ? true:false}
                        ref={groupRef}
                        onDragStart={e => {
                            // Stop the image/stage from moving while dragging balloon
                            e.cancelBubble = true;
                            var popupNode = document.getElementsByClassName('popup');
                            for (let i = 0; i < popupNode.length; i++) {
                                popupNode[i].style.display = 'none';
                            }
                        }}
                        onDragMove={e => {
                            e.cancelBubble = true;
                            setDragOffset({ x: e.target.x(), y: e.target.y() });
                        }}
                        onDragEnd={event => {
                            event.cancelBubble = true;
                            // Keep dragOffset — it will be reset when component re-renders with new shapeProps
                            onChange({
                                ...shapeProps,
                                xx: event.target.x(),
                                xy: event.target.y(),
                                _skipReload: true
                            });
                        }}
                        onTransformEnd={event => {
                        // transformer is changing scale of the node and NOT its width or height but in the store we have only width and height to match the data better we will reset scale on transform end
                            const node = groupRef.current;
                           // const scaleX = node.scaleX();
                           // const scaleY = node.scaleY();
                            // we will reset it back
                            node.scaleX(1);
                            node.scaleY(1);
                            onChange({
                                ...shapeProps,
                                xx: node.x(),
                                xy: node.y()
                            });
                        }}
                    >

                        {/* Solid red ring — visible when balloon is selected for deletion */}
                        {isMarkedForDelete && (
                            <Circle
                                key={n + "_delete_ring"}
                                x={circle_text_x}
                                y={circle_text_y}
                                width={(circleWidth / desiredBalloon) + 20}
                                height={(circleWidth / desiredBalloon) + 20}
                                fill="transparent"
                                stroke="#dc3545"
                                strokeWidth={3}
                                opacity={0.85}
                                listening={false}
                                shadowColor="#dc3545"
                                shadowBlur={10}
                                shadowOpacity={0.6}
                            />
                        )}

                        {/* Selection glow ring — visible when balloon is selected (not for delete) */}
                        {isSelected && !isMarkedForDelete && (
                            <Circle
                                key={n + "_glow"}
                                x={circle_text_x}
                                y={circle_text_y}
                                width={(circleWidth / desiredBalloon) + 16}
                                height={(circleWidth / desiredBalloon) + 16}
                                fill="transparent"
                                stroke="#0d6efd"
                                strokeWidth={2.5}
                                opacity={0.7}
                                dash={[4, 3]}
                                listening={false}
                                shadowColor="#0d6efd"
                                shadowBlur={12}
                                shadowOpacity={0.5}
                            />
                        )}

                        {(shapeProps.BalloonShape === 'Circle') && (
                            <Circle
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={(circleWidth / desiredBalloon)+4  }
                                height={(circleWidth / desiredBalloon) }
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Tooltip-Down') && (
                            <Group
                                ref={cirRef}
                                x={circle_text_x + (textWidth / desiredBalloon) }
                                y={circle_text_y + 10}
                                key={n + "_ann_tooltipgroup" + shapeProps.BalloonShape}
                        >
                           
                            <Label
                                key={n + "_ann_tooltiplabel" + shapeProps.BalloonShape}
                            >
                                <Tag
                                    stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                        fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                        strokeWidth={fitscreen ? Math.max(1, 1 * bgImgScale) : Math.min(1, 1 )}
                                        pointerDirection={"down"}
                                        pointerWidth={((textWidth / desiredBalloon) / 2) }
                                        pointerHeight={((textWidth / desiredBalloon) / 2) }
                                    lineJoin={"round"}
                                    shadowColor={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                    shadowBlur={0}
                                    shadowOffsetX={(textWidth / desiredBalloon) / 2}
                                    shadowOffsetY={(textWidth / desiredBalloon) / 2}
                                    shadowOpacity={0}
                                />
                                    
                                    <Text
                                        key={n + "_ann_text_" + shapeProps.BalloonShape}
                                        width={(textWidth / desiredBalloon)*2}
                                        height={radius*1.5 * fontText}
                                        ref={textRef}
                                        x={circle_text_x - (textWidth / desiredBalloon) / 2}
                                        y={circle_text_y - 10}
                                        text={keyplace}
                                        stroke={isDark ? "#ffffff" : "black"}
                                        fill={isDark ? "#ffffff" : "black"}
                                        fontFamily="Calibri"
                                        fontSize={Math.max(8, textFontSize / desiredBalloon)}
                                        background={"black"}
                                        strokeWidth={.51}
                                        draggable={false}
                                        align="center"
                                        verticalAlign="middle"
                                    />
                                </Label></Group>)}
                        {(shapeProps.BalloonShape === 'Tooltip-UP') && (
                            <Group
                              //  ref={cirRef}
                                x={circle_text_x + circleWidth    }
                                y={circle_text_y  + circleWidth }
                                key={n + "_ann_tooltipgroup" + shapeProps.BalloonShape}
                            >

                                <Label
                                    key={n + "_ann_tooltiplabel" + shapeProps.BalloonShape}

                                >
                                    <Tag
                                        stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                        fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                        strokeWidth={fitscreen ? Math.max(1, 1 * bgImgScale) : Math.min(1, 1 * fontText)}
                                        pointerDirection={"up"}
                                        pointerWidth={((textWidth / desiredBalloon) / 2) * fontText}
                                        pointerHeight={((textWidth / desiredBalloon) / 2) * fontText}
                                        lineJoin={"round"}
                                        shadowColor={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                        shadowBlur={10}
                                        shadowOffsetX={(textWidth / desiredBalloon) / 2}
                                        shadowOffsetY={(textWidth / desiredBalloon) / 2}
                                        shadowOpacity={0}
                                    />

                                    <Text
                                        key={n + "_ann_text_" + shapeProps.BalloonShape}
                                        width={(textWidth / desiredBalloon)*2}
                                        height={radius * 1.5 * fontText}
                                     //   ref={textRef}
                                        x={circle_text_x - (textWidth / desiredBalloon) / 2}
                                        y={circle_text_y - circleWidth}
                                        text={keyplace}
                                        stroke={isDark ? "#ffffff" : "black"}
                                        fill={isDark ? "#ffffff" : "black"}
                                        fontFamily="Calibri"
                                        fontSize={Math.max(8, textFontSize / desiredBalloon)}
                                        background={"black"}
                                        strokeWidth={.51}
                                        draggable={false}
                                        align="center"
                                        verticalAlign="middle"
                                    />
                                </Label></Group>)}
                        {(shapeProps.BalloonShape === 'Tooltip-Left') && (
                            <Group
                                ref={cirRef}
                                x={circle_text_x + circleWidth + shapeProps.Crop_Width }
                                y={circle_text_y + circleWidth}
                                key={n + "_ann_tooltipgroup" + shapeProps.BalloonShape}
                            >

                                <Label
                                    key={n + "_ann_tooltiplabel" + shapeProps.BalloonShape}

                                >
                                    <Tag
                                        stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                        fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                        strokeWidth={fitscreen ? Math.max(1, 1 * bgImgScale) : Math.min(1, 1 * fontText)}
                                        pointerDirection={"left"}
                                        pointerWidth={((textWidth / desiredBalloon) / 2) * fontText}
                                        pointerHeight={((textWidth / desiredBalloon) / 2) * fontText}
                                        lineJoin={"round"}
                                        shadowColor={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                        shadowBlur={10}
                                        shadowOffsetX={(textWidth / desiredBalloon) / 2}
                                        shadowOffsetY={(textWidth / desiredBalloon) / 2}
                                        shadowOpacity={0}
                                    />

                                    <Text
                                        key={n + "_ann_text_" + shapeProps.BalloonShape}
                                        width={(textWidth / desiredBalloon)*2}
                                        height={radius * 1.5 * fontText}
                                        ref={textRef}
                                        x={circle_text_x - circleWidth + shapeProps.Crop_Width}
                                        y={circle_text_y - circleWidth}
                                        text={keyplace}
                                        stroke={isDark ? "#ffffff" : "black"}
                                        fill={isDark ? "#ffffff" : "black"}
                                        fontFamily="Calibri"
                                        fontSize={Math.max(8, textFontSize / desiredBalloon)}
                                        background={"black"}
                                        strokeWidth={.51}
                                        draggable={false}
                                        align="center"
                                        verticalAlign="middle"
                                    />
                                </Label></Group>)}
                        {(shapeProps.BalloonShape === 'Tooltip-Right') && (
                            <Group
                                ref={cirRef}
                                x={circle_text_x + circleWidth}
                                y={circle_text_y + circleWidth}
                                key={n + "_ann_tooltipgroup" + shapeProps.BalloonShape}
                            >

                                <Label
                                    key={n + "_ann_tooltiplabel" + shapeProps.BalloonShape}

                                >
                                    <Tag
                                        stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                        fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                        strokeWidth={fitscreen ? Math.max(1, 1 * bgImgScale) : Math.min(1, 1 * fontText)}
                                        pointerDirection={"right"}
                                        pointerWidth={((textWidth / desiredBalloon) / 2) * fontText}
                                        pointerHeight={((textWidth / desiredBalloon) / 2) * fontText}
                                        lineJoin={"round"}
                                        shadowColor={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)}
                                        shadowBlur={10}
                                        shadowOffsetX={(textWidth / desiredBalloon) / 2}
                                        shadowOffsetY={(textWidth / desiredBalloon) / 2}
                                        shadowOpacity={0}
                                    />

                                    <Text
                                        key={n + "_ann_text_" + shapeProps.BalloonShape}
                                        width={(textWidth / desiredBalloon)*2}
                                        height={radius * 1.5 * fontText}
                                        ref={textRef}
                                        x={circle_text_x - circleWidth }
                                        y={circle_text_y - circleWidth }
                                        text={keyplace}
                                        stroke={isDark ? "#ffffff" : "black"}
                                        fill={isDark ? "#ffffff" : "black"}
                                        fontFamily="Calibri"
                                        fontSize={Math.max(8, textFontSize / desiredBalloon)}
                                        background={"black"}
                                        strokeWidth={.51}
                                        draggable={false}
                                        align="center"
                                        verticalAlign="middle"
                                    />
                                </Label></Group>)}
                        {(shapeProps.BalloonShape === 'Ring') && (
                            <Ring
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={(circleWidth / desiredBalloon) }
                                height={circleWidth / desiredBalloon}
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                innerRadius={(circleWidth / desiredRadius /2)+2}
                                outerRadius={(circleWidth / desiredRadius )+2}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Star') && (
                            <Star
                                key={n + "_ann_" + shapeProps.BalloonShape }
                                ref={cirRef}
                                width={circleWidth / desiredBalloon}
                                height={circleWidth / desiredBalloon}
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                innerRadius={(circleWidth /desiredRadius/2)+2}
                                outerRadius={(circleWidth / desiredRadius)+2}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                numPoints={6}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Wedge') && (
                            <Wedge
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={circleWidth / desiredBalloon}
                                height={circleWidth / desiredBalloon/2}
                                id={keyplace.toString()}
                                x={circle_text_x  }
                                y={circle_text_y + (circleWidth / desiredRadius)}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                radius={(circleWidth * desiredRadius)}
                                angle={60}
                                rotation={-120}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Triangle') && (
                            <RegularPolygon
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={circleWidth / desiredBalloon }
                                height={circleWidth / desiredBalloon  }
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                sides={3}
                                radius={(circleWidth) }
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Diamond') && (
                            <RegularPolygon
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={circleWidth / desiredBalloon}
                                height={circleWidth / desiredBalloon}
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                sides={4}
                               
                                radius={circleWidth / desiredRadius +2}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Square') && (
                            <RegularPolygon
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={circleWidth / desiredBalloon}
                                height={circleWidth / desiredBalloon}
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                sides={4}
                                rotation={-135}
                                radius={circleWidth / desiredRadius +2}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                stroke={(shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Pentagon') && (
                            <RegularPolygon
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={circleWidth / desiredBalloon}
                                height={circleWidth / desiredBalloon}
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                sides={5}
                                 
                                radius={circleWidth / desiredRadius}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Hexagon') && (
                            <RegularPolygon
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={circleWidth / desiredBalloon}
                                height={circleWidth / desiredBalloon}
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                sides={6}
                                
                                radius={circleWidth / desiredRadius}
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5 * fontText)}
                                stroke={ (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                                className={"balloonC"}

                            />)}
                        {(shapeProps.BalloonShape === 'Octagon' ) && (<>
                            <RegularPolygon
                                key={n + "_ann_" + shapeProps.BalloonShape}
                                ref={cirRef}
                                width={(circleWidth / desiredBalloon) + 4 }
                                height={circleWidth / desiredBalloon}
                                id={keyplace.toString()}
                                x={circle_text_x}
                                y={circle_text_y}
                                fill={selectedIdsm.includes(shapeProps.id) ? "yellow" : (isDark ? (shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker) : "transparent")}
                                sides={8}
                     
                                radius={radius }
                                strokeWidth={fitscreen ? Math.max(1.5, 1.5 * bgImgScale) : Math.max(1.5, 1.5)}
                                stroke={(shapeProps.newarr.BalloonColor !== "" ? shapeProps.newarr.BalloonColor : defaultPicker)} //"red" #0071be #1DBFC1 
                               // className={"balloonC"}

                            /> 
                        </>
                        )}

                        
                        {(!shapeProps.BalloonShape.includes('Tooltip')  ) && (
                            <Text
                                key={n + "_ann_text_" + shapeProps.BalloonShape}
                                width={(textWidth / desiredBalloon)}
                                height={20 * fontText}
                                ref={textRef }
                                x={circle_text_x - (textWidth / desiredBalloon) / 2}
                                y={circle_text_y - 10 * fontText}
                                text={keyplace}
                                stroke={isDark ? "#ffffff" : "black"}
                                fill={isDark ? "#ffffff" : "black"}
                                fontFamily="Calibri"
                                fontStyle="bold"
                                fontSize={textFontSize / desiredBalloon }
                                background={isDark ? "transparent" : "black"}
                                strokeWidth={.6 }
                                draggable={false}
                                align="center"
                                verticalAlign="middle"
                            />)}
                        </Group>
                    {isSelected && <Transformer key={n + "_ann_trans_" + shapeProps.BalloonShape} rotateEnabled={false} borderDash={[3, 3]} borderStroke={"blue"} padding={0 } resizeEnabled={false } ref={transformRef} />}

                </>
            )}

            {/* onMouseDown={onSelect} */}
            {(!shapeProps.isballooned /*|| shapeProps.selected */ ) && (    
                <>
                    <Rect
                        key={n + "_ann_create_rect_" + shapeProps.BalloonShape}
                        rotation={rotation }
                        fill="transparent"
                        stroke={"#0071be"} //"red"
                        onMouseDown={onSelect}
                        ref={shapeRef}
                        {...shapeProps}
                        strokeWidth={1}
                        dash={[3, 3]}
                        draggable={false }
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                       
                    />
                    
                </>
             )}  
            {/* Identify arrow — OUTSIDE the draggable Group so end point stays fixed */}
            {identifyMode && identifyMode !== 'off' && (identifyMode === 'all' || (identifyMode === 'selected' && isSelected)) && shapeProps.selectedRegion !== "Selected Region" && shapeProps.selectedRegion !== "Unselected Region" && shapeProps.selectedRegion !== "Spl" && (() => {
                // Balloon center (current position including drag)
                const bx = circle_text_x + dragOffset.x + circleWidth;
                const by = circle_text_y + dragOffset.y + circleWidth;

                // Dimension text center (original OCR crop position — fixed, never moves)
                const cropX = shapeProps.Crop_X_Axis || shapeProps.x || 0;
                const cropY = shapeProps.Crop_Y_Axis || shapeProps.y || 0;
                const cropW = shapeProps.Crop_Width || shapeProps.width || 0;
                const cropH = shapeProps.Crop_Height || shapeProps.height || 0;
                const tx = cropX + cropW / 2;
                const ty = cropY + cropH / 2;
                if (tx < 1 || ty < 1) return null;

                const dist = Math.sqrt((bx - tx) ** 2 + (by - ty) ** 2);
                // Show arrow even for short distances (balloon near text) — only skip if exactly overlapping
                if (dist < 2) return null;

                return (
                    <Arrow
                        key={n + "_identify_arrow"}
                        points={[bx, by, tx, ty]}
                        stroke="#d32f2f"
                        strokeWidth={1.5}
                        fill="#d32f2f"
                        pointerLength={6}
                        pointerWidth={5}
                        opacity={0.9}
                        listening={false}
                    />
                );
            })()}
        </React.Fragment>
    );
};

export default Annotation;
