import React  from "react";
import { Text, Group, Rect, Transformer } from "react-konva";
import useStore from "../Store/store";

const Controlledcopy = ({ isDragging, textGroupPlaced, textPosition, props, StartBalloon, EndBalloon, PageData, PN, onChange, fontSize, onTransformChange, stageRef, draggableCC, setdraggableCC }) => {

    const transformRef = React.useRef();
    const groupRef = React.useRef();
    const shapeRef = React.useRef();
    let pretextGroupPlaced = false;
    const ccFontScale = useStore((s) => s.ccFontScale);
    let pretextPosition = {};
    let scale = 0;
    let isselectedtomove = draggableCC;
    const stage = stageRef.current;
    let x = 0;
    let y = 0;
    let cc = props?.controllCopy.filter(x => parseInt(x.pageNo) === parseInt(PN));
    if (stage && !textGroupPlaced && cc?.length > 0) {
        pretextGroupPlaced = cc[0].textGroupPlaced;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (pointer) {
            x = pointer.x / oldScale - stage.x() / oldScale;
            y = pointer.y / oldScale - stage.y() / oldScale;
        }
    }

 
    if (cc?.length > 0 && props?.drawingDetails?.length > 0 && props?.ItemView != null && PageData?.length > 0) {
        // Get the first item
        const firstItem = PageData[0];
        StartBalloon = parseInt(firstItem.Balloon);
        // Get the last item
        const lastItem = PageData[PageData.length - 1];
        EndBalloon = parseInt(lastItem.Balloon);
        const scaleX = props.bgImgW / props.imageWidth;
        const scaleY = props.bgImgH / props.imageHeight;
        let bgImgScale = Math.min(scaleX, scaleY);

        // CC scale: base from image scale + user ccFontScale adjustment
        // Each ccFontScale step = 10% size change relative to base
        let userScale = 1 + parseFloat(ccFontScale) * 0.1;
        userScale = Math.max(0.3, userScale); // minimum 30%
        if (props.fitscreen) {
            scale = bgImgScale * userScale;
        } else {
            // In non-fitscreen (1:1), use bgImgScale as base but ensure visible
            scale = Math.max(bgImgScale, 1) * userScale;
        }
        scale = Math.max(0.5, Math.min(scale, 10));

        if (!isDragging) {
            textPosition = { x: x, y: y }
        }
       
        if (!textGroupPlaced) {
            // pretextGroupPlaced = cc[0].textGroupPlaced;
            x = parseInt(cc[0].origin.x) * scaleX + props.bgImgX + props.rectPadding * 2;
            y = parseInt(cc[0].origin.y) * scaleY + props.bgImgY + props.rectPadding * 2 ;
            //console.log(x,y)
            pretextPosition = { x: x, y: y }
        }
      //  console.log("setTextGroupPlaced inner", textGroupPlaced, scale, pretextPosition)
    }
    const getWidth = (text, fontSize) => {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = `normal ${fontSize}px Calibri`;
        var metrics = ctx.measureText(text);
        return metrics.width;
    }
    const getHeight = (text, fontSize) => {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = `normal ${fontSize}px Calibri`;
        var metrics = ctx.measureText(text);
        var textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        return textHeight;
    }
    const onMouseEnter = event => {
        event.target.getStage().container().style.cursor = "move";
    };

    const onMouseLeave = event => {
        event.target.getStage().container().style.cursor = "auto";
    };

    let cc_height = getHeight(`CONTROLLED COPY`, fontSize) + fontSize;
    let txt_bs_width = getWidth(`B.NO START - `, fontSize);
    let no_bs_width = getWidth(`${StartBalloon}\t`, fontSize) + fontSize;
    let txt_be_width = getWidth(`B.NO END -\t`, fontSize);
    let no_be_width = getWidth(`${EndBalloon}`, fontSize);
    let tot_start_width = (txt_bs_width + no_bs_width);
    let eb_width = (tot_start_width + txt_be_width);

     let  rect_width =  (eb_width + no_be_width) + props.rectPadding/2 * scale * 2;
     let  rect_height = cc_height * 2 + props.rectPadding/2 * scale;
    
    let textTemplates = [
        { text: "CONTROLLED COPY", x: 0, y: 0, fontSize: (fontSize + 2) * scale , fill: "#0071be", stroke: "#0071be", lineHeight: 1 },
        { text: `B.NO START - `, x: 0, y: cc_height * scale, fontSize: (fontSize) * scale , fill: "#000", stroke: "#000", lineHeight: 1 },
        { text: `${StartBalloon}\t`, x: txt_bs_width * scale, y: cc_height * scale, fontSize: (fontSize) * scale  , fill: "#0071be", stroke: "#0071be", lineHeight: 1 },
        { text: `B.NO END -\t`, x: tot_start_width * scale, y: cc_height * scale, fontSize: (fontSize ) * scale , fill: "#000", stroke: "#000", lineHeight: 1 },
        { text: `${EndBalloon}`, x: eb_width * scale, y: cc_height * scale, fontSize: (fontSize) * scale , fill: "#0071be", stroke: "#0071be", lineHeight: 1 },
    ];
    if (!isDragging && textGroupPlaced) {
        onChange({ textGroupPlaced: textGroupPlaced })
    }
    // console.log(isDragging, textGroupPlaced, textPosition, pretextGroupPlaced, pretextPosition, scale, draggableCC)
    return (
        <React.Fragment>      
 
            {isDragging && (
                <Group
                    x={textPosition.x}
                    y={textPosition.y}
                    ref={groupRef}
                    key={PN + "_ccGroupdrag"}
                >
                    <Rect
                        key={PN + "_ccrectdrag"}
                        x={-props.rectPadding * scale}  // Position the Rect at (0, 0) relative to the group
                        y={-props.rectPadding * scale}
                        width={rect_width * scale + props.rectPadding * scale}
                        height={rect_height * scale + props.rectPadding * scale}
                        fill="transparent"
                        stroke={props.defaultPicker }
                        strokeWidth={0.5}
                        cornerRadius={0} // Rounded corners
                    />

                    {textTemplates.map((textObj, index) => (

                        <Text
                            key={PN +"_"+ index+ "_cctextdrag"}
                            text={textObj.text}
                            x={textObj.x}
                            y={textObj.y}
                            fontSize={textObj.fontSize}
                            fill={textObj.fill}
                            stroke={textObj.stroke}
                            strokeWidth={0.5}
                            lineHeight={textObj.lineHeight}
                            fontFamily="Calibri"
                            draggable={false}
                            wrap={"word"}
                            ellipsis={false}
                            align="left"
                            verticalAlign="middle"
                        />
                    ))}
                </Group>
            )}

            {textGroupPlaced && (
                <Group x={textPosition.x} y={textPosition.y}
                    key={PN + "_ccGroupdragplace"}
                >
                    <Rect
                        key={PN + "_ccrectdragplace"}
                        x={-props.rectPadding * scale } // Position the Rect at (0, 0) relative to the group
                        y={-props.rectPadding * scale }
                        width={rect_width * scale + props.rectPadding * scale}
                        height={rect_height * scale + props.rectPadding * scale}
                        fill="transparent"
                        stroke={props.defaultPicker }
                        strokeWidth={0.5}
                        cornerRadius={0} // Rounded corners
                    />
                    {textTemplates.map((textObj, index) => (
                        <Text
                            key={PN + "_" + index + "_cctextdragplace"}
                            text={textObj.text}
                            x={textObj.x}
                            y={textObj.y}
                            fontSize={textObj.fontSize}
                            fill={textObj.fill}
                            stroke={textObj.stroke}
                            strokeWidth={0.5}
                            lineHeight={textObj.lineHeight}
                            fontFamily="Calibri"
                            draggable={false}
                            wrap={"word"}
                            ellipsis={false}
                            align="left"
                            verticalAlign="middle"
                        />
                    ))}                   
                </Group>
            )}

            {!isDragging && pretextGroupPlaced && (<>
                <Group x={pretextPosition.x} y={pretextPosition.y} key={PN + "_ccGroupdragplaced"}
                    ref={groupRef}
                    draggable={ isselectedtomove ? true : false}
                    onDragEnd={event => {
                        const scaleX = props.bgImgW / props.imageWidth;
                        const scaleY = props.bgImgH / props.imageHeight;
                        let x = parseInt( (event.target.x() - props.bgImgX  - props.rectPadding * 2) / scaleX);
                        let y = parseInt( (event.target.y() - props.bgImgY - props.rectPadding * 2) / scaleY) ;
                        //console.log(scaleX, scaleY, x, y, textGroupPlaced)
                        onTransformChange({
                            ...cc[0], origin: {
                                x: parseInt(x),
                                y: parseInt(y),
                                width: parseInt(rect_width * scale + props.rectPadding * scale),
                                height: parseInt(rect_height * scale + props.rectPadding * scale)
                            }
                        });
                        useStore.setState({
                            isLoading: false,
                            loadingText: "Updating new Position..."
                        })
                    }}
                    onTransformEnd={event => {
                        const node = groupRef.current;
                        node.scaleX(1);
                        node.scaleY(1);
                        console.log(node.x(), node.y())
                    }}
                    onClick={(e) => {
                        e.evt.preventDefault(true);
                        e.evt.stopPropagation(); 
                        if (e.evt.detail === 2) {
                            setdraggableCC(!draggableCC);
                        }
                    }}
                    onMouseEnter={isselectedtomove ? onMouseEnter : onMouseLeave}
                    onMouseLeave={onMouseLeave}
                >
 
                    <Rect
                        key={PN + "_ccrectdragplaced"}
                        x={-props.rectPadding * scale} // Position the Rect at (0, 0) relative to the group
                        y={-props.rectPadding * scale}
                        width={rect_width * scale + props.rectPadding * scale}
                        height={rect_height * scale + props.rectPadding * scale }
                        fill="transparent"
                        stroke={isselectedtomove ? "transparent" : props.defaultPicker }
                        strokeWidth={0.5}
                        cornerRadius={0} // Rounded corners
                    />
                    {textTemplates.map((textObj, index) => (
                        <Text
                            key={PN + "_" + index + "_cctextdragplaced"}
                            text={textObj.text}
                            x={textObj.x}
                            y={textObj.y}
                            fontSize={textObj.fontSize}
                            fill={textObj.fill}
                            stroke={textObj.stroke}
                            strokeWidth={0.5}
                            lineHeight={textObj.lineHeight}
                            fontFamily="Calibri"
                            draggable={false}
                            wrap={"word"}
                            ellipsis={false}
                            align="left"
                            verticalAlign="middle"
                        />
                    ))}
                    {isselectedtomove && (
                        <>
                            <Rect
                                key={PN + "_ann_create_rect_cc"}
                                fill="transparent"
                                stroke={"red"} //"red"
                                // onMouseDown={onSelect}
                                x={- props.rectPadding * scale}
                                y={- props.rectPadding * scale}
                                width={rect_width * scale + props.rectPadding * scale }
                                height={rect_height * scale + props.rectPadding * scale }
                                ref={shapeRef}
                                strokeWidth={1}
                                padding={12}
                                dash={[3, 3]}
                                draggable={false}
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}

                            />

                        </>
                    )} 
                </Group>
                {isselectedtomove && <Transformer key={PN + "_ann_trans_cc"} rotateEnabled={false} borderDash={[3, 3]} borderStroke={"blue"} padding={1} resizeEnabled={false} ref={transformRef} />}
                
            </>)}

           
        </React.Fragment>
    );
};

export default Controlledcopy;
