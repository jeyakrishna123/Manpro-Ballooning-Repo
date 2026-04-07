// #region Component Imports
import React, { useEffect, useMemo, useCallback } from "react";
import { Rect, Circle, Text, Group, Transformer, Ring, Star, Wedge, RegularPolygon, Label, Tag } from "react-konva";
import useStore from "../Store/store";
import initialState from "../Store/init";
import { config } from "../Common/Common";
// #endregion

// #region Constants and Configuration
const BALLOON_SHAPES = {
    CIRCLE: 'Circle',
    RING: 'Ring',
    STAR: 'Star',
    WEDGE: 'Wedge',
    TRIANGLE: 'Triangle',
    DIAMOND: 'Diamond',
    SQUARE: 'Square',
    PENTAGON: 'Pentagon',
    HEXAGON: 'Hexagon',
    OCTAGON: 'Octagon',
    TOOLTIP_UP: 'Tooltip-UP',
    TOOLTIP_DOWN: 'Tooltip-Down',
    TOOLTIP_LEFT: 'Tooltip-Left',
    TOOLTIP_RIGHT: 'Tooltip-Right'
};

const SIZE_CONFIG = {
    1: { circleWidth: 10, textWidth: 10, radius: 7.5 },
    2: { circleWidth: 12, textWidth: 12, radius: 8 },
    3: { circleWidth: 14, textWidth: 14, radius: 10 },
    4: { circleWidth: 16, textWidth: 16, radius: 11 },
    default: { circleWidth: 10, textWidth: 10, radius: 7.5 }
};

const TOOLTIP_DIRECTIONS = {
    up: { xOffset: 0, yOffset: 0, pointerDirection: 'up' },
    down: { xOffset: 0, yOffset: 10, pointerDirection: 'down' },
    left: { xOffset: 0, yOffset: 0, pointerDirection: 'left' },
    right: { xOffset: 0, yOffset: 0, pointerDirection: 'right' }
};
// #endregion

// #region Utility Functions
const getSizeConfig = (keyplaceLength) => {
    return SIZE_CONFIG[keyplaceLength] || SIZE_CONFIG.default;
};

const getBalloonColor = (shapeProps, defaultPicker) => {
    return shapeProps.newarr.BalloonColor || defaultPicker;
};

const getSelectionFill = (shapeProps, selectedIds) => {
    return selectedIds.includes(shapeProps.id) ? "yellow" : "transparent";
};

const getStrokeWidth = (fitscreen, bgImgScale, fontText) => {
    return fitscreen ? Math.min(1, 1 * bgImgScale) : Math.min(1, 1 * fontText);
};

const calculatePositioning = (shapeProps, movecircle, bgImgScale, circleWidth, fitscreen) => {
    let circle_text_x = shapeProps.Circle_X_Axis - circleWidth * bgImgScale + movecircle[0].dx;
    let circle_text_y = shapeProps.Circle_Y_Axis - circleWidth * bgImgScale + movecircle[0].dy + shapeProps.Crop_Height / 2;
    
    if (fitscreen) {
        if (circle_text_x < 0) circle_text_x = shapeProps.Circle_X_Axis;
        if (circle_text_y < 10) circle_text_y = 10;
    }
    
    return { circle_text_x, circle_text_y };
};

const hideAllPopups = (className) => {
    const popupNodes = document.getElementsByClassName(className);
    for (let i = 0; i < popupNodes.length; i++) {
        popupNodes[i].style.display = 'none';
    }
};

const calculatePopupPosition = (mousePosition, containerRect, positionWidth, positionLeft, positionscrollTop, props, className) => {
    const doc = document.documentElement;
    const top = (doc.scrollTop) - (doc.clientTop || 0);
    const popupNodes = document.getElementsByClassName(className);
    
    const bargap = parseInt(positionWidth - containerRect.width);
    const multiplex = ((props.win.width === initialState.win.width && props.win.height === initialState.win.height) && (props.imageWidth < 32767 || props.imageHeight < 32767)) ? 1 : 2;
    const bardiv = (((bargap / 2) > 0) ? (bargap / 2) : 0) * multiplex;
    const pads = (bardiv > 0) ? (props.pad * 2) : 0;
    
    let adjust = 0;
    const intLeft = parseInt(positionLeft);
    if (props.bgImgX !== 0 || props.bgImgY !== 0) {
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
    
    return { top: mousePosition.y + top + 4, left: mousePosition.x + ((props.win.width - props.bgImgW) / 2) + adjust - positionLeft - 75, adjust };
};
// #endregion

// #region Shape Components
const BalloonShape = ({ shapeProps, n, keyplace, circleWidth, textWidth, radius, desiredBalloon, desiredRadius, 
                       circle_text_x, circle_text_y, strokeColor, fillColor, strokeWidth, cirRef, isTooltip = false }) => {
    const commonProps = {
        key: `${n}_ann_${shapeProps.BalloonShape}`,
        ref: cirRef,
        width: circleWidth / desiredBalloon,
        height: circleWidth / desiredBalloon,
        id: keyplace.toString(),
        x: circle_text_x,
        y: circle_text_y,
        fill: fillColor,
        strokeWidth,
        stroke: strokeColor,
        className: "balloonC"
    };

    switch (shapeProps.BalloonShape) {
        case BALLOON_SHAPES.CIRCLE:
            return <Circle {...commonProps} width={(circleWidth / desiredBalloon) + 4} />;
            
        case BALLOON_SHAPES.RING:
            return <Ring {...commonProps} 
                innerRadius={(circleWidth / desiredRadius / 2) + 2}
                outerRadius={(circleWidth / desiredRadius) + 2} />;
                
        case BALLOON_SHAPES.STAR:
            return <Star {...commonProps} 
                innerRadius={(circleWidth / desiredRadius / 2) + 2}
                outerRadius={(circleWidth / desiredRadius) + 2}
                numPoints={6} />;
                
        case BALLOON_SHAPES.WEDGE:
            return <Wedge {...commonProps} 
                width={circleWidth / desiredBalloon}
                height={circleWidth / desiredBalloon / 2}
                y={circle_text_y + (circleWidth / desiredRadius)}
                radius={circleWidth * desiredRadius}
                angle={60}
                rotation={-120} />;
                
        case BALLOON_SHAPES.TRIANGLE:
            return <RegularPolygon {...commonProps} sides={3} radius={circleWidth} />;
            
        case BALLOON_SHAPES.DIAMOND:
            return <RegularPolygon {...commonProps} sides={4} radius={circleWidth / desiredRadius + 2} />;
            
        case BALLOON_SHAPES.SQUARE:
            return <RegularPolygon {...commonProps} sides={4} rotation={-135} radius={circleWidth / desiredRadius + 2} />;
            
        case BALLOON_SHAPES.PENTAGON:
            return <RegularPolygon {...commonProps} sides={5} radius={circleWidth / desiredRadius} />;
            
        case BALLOON_SHAPES.HEXAGON:
            return <RegularPolygon {...commonProps} sides={6} radius={circleWidth / desiredRadius} />;
            
        case BALLOON_SHAPES.OCTAGON:
            return <RegularPolygon {...commonProps} 
                width={(circleWidth / desiredBalloon) + 4}
                sides={8}
                radius={radius} />;
                
        default:
            return null;
    }
};

const TooltipShape = ({ shapeProps, n, keyplace, circleWidth, textWidth, radius, desiredBalloon, 
                       circle_text_x, circle_text_y, strokeColor, fillColor, strokeWidth, cirRef, textRef, textFontSize, fontText }) => {
    const direction = shapeProps.BalloonShape.replace('Tooltip-', '').toLowerCase();
    const config = TOOLTIP_DIRECTIONS[direction];
    
    if (!config) return null;
    
    const xOffset = config.xOffset;
    const yOffset = config.yOffset;
    const pointerDirection = config.pointerDirection;
    
    let groupX = circle_text_x + (textWidth / desiredBalloon);
    let groupY = circle_text_y + 10;
    let textX = circle_text_x - (textWidth / desiredBalloon) / 2;
    let textY = circle_text_y - 10;
    
    // Adjust positioning based on direction
    switch (direction) {
        case 'up':
            groupX = circle_text_x + circleWidth;
            groupY = circle_text_y + circleWidth;
            textY = circle_text_y - circleWidth;
            break;
        case 'left':
            groupX = circle_text_x + circleWidth + shapeProps.Crop_Width;
            groupY = circle_text_y + circleWidth;
            textX = circle_text_x - circleWidth + shapeProps.Crop_Width;
            textY = circle_text_y - circleWidth;
            break;
        case 'right':
            groupX = circle_text_x + circleWidth;
            groupY = circle_text_y + circleWidth;
            textX = circle_text_x - circleWidth;
            textY = circle_text_y - circleWidth;
            break;
    }
    
    return (
        <Group ref={cirRef} x={groupX} y={groupY} key={`${n}_ann_tooltipgroup${shapeProps.BalloonShape}`}>
            <Label key={`${n}_ann_tooltiplabel${shapeProps.BalloonShape}`}>
                <Tag
                    stroke={strokeColor}
                    fill={fillColor}
                    strokeWidth={strokeWidth}
                    pointerDirection={pointerDirection}
                    pointerWidth={((textWidth / desiredBalloon) / 2) * fontText}
                    pointerHeight={((textWidth / desiredBalloon) / 2) * fontText}
                    lineJoin="round"
                    shadowColor={strokeColor}
                    shadowBlur={direction === 'down' ? 0 : 10}
                    shadowOffsetX={(textWidth / desiredBalloon) / 2}
                    shadowOffsetY={(textWidth / desiredBalloon) / 2}
                    shadowOpacity={0}
                />
                <Text
                    key={`${n}_ann_text_${shapeProps.BalloonShape}`}
                    width={(textWidth / desiredBalloon) * 2}
                    height={radius * 1.5 * fontText}
                    ref={textRef}
                    x={textX}
                    y={textY}
                    text={keyplace}
                    stroke="black"
                    fill="black"
                    fontFamily="Calibri"
                    fontSize={textFontSize / desiredBalloon}
                    background="black"
                    strokeWidth={0.51}
                    draggable={false}
                    align="center"
                    verticalAlign="middle"
                />
            </Label>
        </Group>
    );
};

const BalloonText = ({ n, shapeProps, keyplace, textWidth, desiredBalloon, circle_text_x, circle_text_y, textFontSize, fontText, textRef }) => {
    if (shapeProps.BalloonShape.includes('Tooltip')) return null;
    
    return (
        <Text
            key={`${n}_ann_text_${shapeProps.BalloonShape}`}
            width={textWidth / desiredBalloon}
            height={20 * fontText}
            ref={textRef}
            x={circle_text_x - (textWidth / desiredBalloon) / 2}
            y={circle_text_y - 10 * fontText}
            text={keyplace}
            stroke="black"
            fill="black"
            fontFamily="Calibri"
            fontSize={textFontSize / desiredBalloon}
            background="black"
            strokeWidth={0.51}
            draggable={false}
            align="center"
            verticalAlign="middle"
        />
    );
};
// #endregion

const Annotation = ({ n, movecircle, shapeProps, isSelected, onSelect, onDblClick, onTripleClick, onChange, 
                     keyplace, rotation, positionWidth, positionLeft, fitscreen, positionscrollTop, 
                     selectedIdsm, setSelectedIds, fontSize }) => {
    // #region Refs and State
    const shapeRef = React.useRef();
    const transformRef = React.useRef();
    const cirRef = React.useRef();
    const groupRef = React.useRef();
    const textRef = React.useRef(null);
    const touchTimeout = React.useRef(null);
    const lastTouchTime = React.useRef(0);
    const touchTimer = React.useRef(null);
    // #endregion

    // #region Store State
    const { defaultPicker, fontScale, bgImgScale, imageWidth, imageHeight, win, ItemView, drawingDetails, scaleStep, InitialScale } = useStore.getState();
    // #endregion

    // #region Memoized Calculations
    const sizeConfig = useMemo(() => getSizeConfig(keyplace.toString().length), [keyplace]);
    const { circleWidth, textWidth, radius } = sizeConfig;

    const fontSizeScale = useMemo(() => {
        if (fontScale > 0 || fontScale < 0) return fontScale / 100;
        return 0;
    }, [fontScale]);

    const scale = useMemo(() => {
        let scaleX = win.width / imageWidth;
        let scaleY = win.height / imageHeight;
        let calculatedScale = Math.min(scaleX, scaleY);
        
        if (fitscreen) return calculatedScale;
        
        let resize = "false";
        if (drawingDetails.length > 0 && ItemView != null) {
            resize = drawingDetails.length > 0 ? Object.values(drawingDetails)[parseInt(ItemView)].resize : "false";
        }
        
        return resize === "true" ? scaleStep + InitialScale : 0.75;
    }, [win, imageWidth, imageHeight, fitscreen, drawingDetails, ItemView, scaleStep, InitialScale]);

    const fontText = useMemo(() => {
        if (fitscreen) return scale;
        return bgImgScale + fontSizeScale * bgImgScale;
    }, [fitscreen, scale, bgImgScale, fontSizeScale]);

    const desiredBalloon = useMemo(() => fitscreen ? 1.5 : 1, [fitscreen]);
    const desiredRadius = useMemo(() => fitscreen ? 2.3 : 1.3, [fitscreen]);
    const textFontSize = useMemo(() => fontSize * fontText, [fontSize, fontText]);

    const positioning = useMemo(() => 
        calculatePositioning(shapeProps, movecircle, bgImgScale, circleWidth, fitscreen),
        [shapeProps, movecircle, bgImgScale, circleWidth, fitscreen]
    );

    const balloonColor = useMemo(() => getBalloonColor(shapeProps, defaultPicker), [shapeProps, defaultPicker]);
    const selectionFill = useMemo(() => getSelectionFill(shapeProps, selectedIdsm), [shapeProps, selectedIdsm]);
    const strokeWidth = useMemo(() => getStrokeWidth(fitscreen, bgImgScale, fontText), [fitscreen, bgImgScale, fontText]);
    // #endregion

    // #region Event Handlers
    const handleCircleClick = useCallback((id, e) => {
        if (e.evt.ctrlKey || e.evt.metaKey || e.evt.touches?.length > 1) {
            setSelectedIds(id);
        }
    }, [setSelectedIds]);

    const onMouseEnter = useCallback((event) => {
        event.target.getStage().container().style.cursor = "move";
    }, []);

    const onMouseLeave = useCallback((event) => {
        event.target.getStage().container().style.cursor = "auto";
        hideAllPopups('popup');
    }, []);

    const handleContextMenu = useCallback((e) => {
        e.evt.preventDefault(true);
        const mousePosition = e.target.getStage().getPointerPosition();
        const containerRect = e.target.getStage().container().getBoundingClientRect();
        const props = useStore.getState();
        const selectedRegion = e.target.attrs.text;
        
        const popupNodes = document.getElementsByClassName('contextmenu');
        for (let i = 0; i < popupNodes.length; i++) {
            if (popupNodes[i].getAttribute("data-value") === selectedRegion) {
                const { top, left } = calculatePopupPosition(mousePosition, containerRect, positionWidth, positionLeft, positionscrollTop, props, 'contextmenu');
                popupNodes[i].style.display = 'initial';
                popupNodes[i].style.position = 'absolute';
                popupNodes[i].style.top = `${top}px`;
                popupNodes[i].style.left = `${left}px`;
            } else {
                popupNodes[i].style.display = 'none';
            }
        }
    }, [positionWidth, positionLeft, positionscrollTop]);

    const handleSingleTouch = useCallback((e) => {
        // Single touch logic
    }, []);

    const handleDoubleTouch = useCallback(() => {
        onTripleClick({ ...shapeProps });
    }, [onTripleClick, shapeProps]);

    const handleTouchStart = useCallback((e) => {
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
            handleContextMenu(e);
        }, 500);
    }, [handleSingleTouch, handleDoubleTouch, handleContextMenu]);

    const handleTouchEnd = useCallback(() => {
        clearTimeout(touchTimer.current);
    }, []);

    const handleMouseOver = useCallback((e) => {
        if (e.evt.ctrlKey) {
            onMouseLeave(e);
        } else if (isSelected) {
            onMouseEnter(e);
        } else {
            onMouseLeave(e);
            const mousePosition = e.target.getStage().getPointerPosition();
            const containerRect = e.target.getStage().container().getBoundingClientRect();
            const props = useStore.getState();
            const selectedRegion = e.target.attrs.text;
            
            const popupNodes = document.getElementsByClassName('popup');
            for (let i = 0; i < popupNodes.length; i++) {
                if (popupNodes[i].getAttribute("data-value") === selectedRegion) {
                    const { top, left } = calculatePopupPosition(mousePosition, containerRect, positionWidth, positionLeft, positionscrollTop, props, 'popup');
                    popupNodes[i].style.display = 'initial';
                    popupNodes[i].style.position = 'absolute';
                    popupNodes[i].style.top = `${top}px`;
                    popupNodes[i].style.left = `${left}px`;
                } else {
                    popupNodes[i].style.display = 'none';
                }
            }
        }
    }, [isSelected, onMouseEnter, onMouseLeave, positionWidth, positionLeft, positionscrollTop]);

    const handleDragEnd = useCallback((event) => {
        onChange({
            ...shapeProps,
            xx: event.target.x(),
            xy: event.target.y()
        });
        useStore.setState({
            isLoading: true,
            loadingText: "Updating new Position..."
        });
    }, [onChange, shapeProps]);

    const handleTransformEnd = useCallback((event) => {
        const node = groupRef.current;
        node.scaleX(1);
        node.scaleY(1);
        onChange({
            ...shapeProps,
            xx: node.x(),
            xy: node.y()
        });
    }, [onChange, shapeProps]);
    // #endregion

    // #region Effects
    useEffect(() => {
        if (isSelected) {
            transformRef.current.nodes([groupRef.current]);
            transformRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);
    // #endregion

    // #region Render Logic
    const shouldShowBalloon = shapeProps.selectedRegion !== "Selected Region" && 
                             shapeProps.selectedRegion !== "Unselected Region" && 
                             shapeProps.selectedRegion !== "Spl";

    const shouldShowRectangle = !shapeProps.isballooned;

    if (!shouldShowBalloon && !shouldShowRectangle) {
        return null;
    }

    return (
        <React.Fragment>
            {shouldShowBalloon && (
                <>
                    <Group
                        key={`${n}_ann_group_${shapeProps.BalloonShape}`}
                        onTap={(e) => handleCircleClick(shapeProps.id, e)}
                        onClick={(e) => {
                            e.evt.preventDefault(true);
                            e.evt.stopPropagation();
                            if (e.evt.detail === 1) {
                                handleCircleClick(shapeProps.id, e);
                            }
                            if (e.evt.detail === 2) {
                                onTripleClick({ ...shapeProps });
                            }
                        }}
                        rotation={rotation}
                        onMouseEnter={(e) => {
                            if (isSelected) { onMouseEnter(e); }
                            else { onMouseLeave(e); }
                        }}
                        onDblClick={(e) => {
                            e.evt.preventDefault(true);
                            e.evt.stopPropagation();
                        }}
                        onMouseLeave={onMouseLeave}
                        onMouseOver={handleMouseOver}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onContextMenu={handleContextMenu}
                        draggable={isSelected}
                        ref={groupRef}
                        onDragStart={() => hideAllPopups('popup')}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                    >
                        <BalloonShape
                            shapeProps={shapeProps}
                            n={n}
                            keyplace={keyplace}
                            circleWidth={circleWidth}
                            textWidth={textWidth}
                            radius={radius}
                            desiredBalloon={desiredBalloon}
                            desiredRadius={desiredRadius}
                            circle_text_x={positioning.circle_text_x}
                            circle_text_y={positioning.circle_text_y}
                            strokeColor={balloonColor}
                            fillColor={selectionFill}
                            strokeWidth={strokeWidth}
                            cirRef={cirRef}
                        />
                        
                        {shapeProps.BalloonShape.includes('Tooltip') && (
                            <TooltipShape
                                shapeProps={shapeProps}
                                n={n}
                                keyplace={keyplace}
                                circleWidth={circleWidth}
                                textWidth={textWidth}
                                radius={radius}
                                desiredBalloon={desiredBalloon}
                                circle_text_x={positioning.circle_text_x}
                                circle_text_y={positioning.circle_text_y}
                                strokeColor={balloonColor}
                                fillColor={selectionFill}
                                strokeWidth={strokeWidth}
                                cirRef={cirRef}
                                textRef={textRef}
                                textFontSize={textFontSize}
                                fontText={fontText}
                            />
                        )}
                        
                        <BalloonText
                            n={n}
                            shapeProps={shapeProps}
                            keyplace={keyplace}
                            textWidth={textWidth}
                            desiredBalloon={desiredBalloon}
                            circle_text_x={positioning.circle_text_x}
                            circle_text_y={positioning.circle_text_y}
                            textFontSize={textFontSize}
                            fontText={fontText}
                            textRef={textRef}
                        />
                    </Group>
                    
                    {isSelected && (
                        <Transformer 
                            key={`${n}_ann_trans_${shapeProps.BalloonShape}`} 
                            rotateEnabled={false} 
                            borderDash={[3, 3]} 
                            borderStroke="blue" 
                            padding={0} 
                            resizeEnabled={false} 
                            ref={transformRef} 
                        />
                    )}
                </>
            )}

            {shouldShowRectangle && (
                <Rect
                    key={`${n}_ann_create_rect_${shapeProps.BalloonShape}`}
                    rotation={rotation}
                    fill="transparent"
                    stroke="#0071be"
                    onMouseDown={onSelect}
                    ref={shapeRef}
                    {...shapeProps}
                    strokeWidth={1}
                    dash={[3, 3]}
                    draggable={false}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                />
            )}
        </React.Fragment>
    );
    // #endregion
};

export default Annotation;

