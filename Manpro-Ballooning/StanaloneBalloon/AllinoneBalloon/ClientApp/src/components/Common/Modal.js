// #region Component Imports
import React, { Component } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  ModalFooter,
  Table,
  Form,
  FormGroup,
  Label,
  Input,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import useStore from "../Store/store";
import Image from "./Image";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import Swal from "sweetalert2";
import { v1 as uuid } from "uuid";
//import Draggable from "react-draggable";
import classNames from "classnames";
//import { shortBalloon, newBalloonPosition, deleteBalloonProcessApi, saveBalloonsApi, recKey, orgKey, specificationUpdateApi } from '../Common/Common';
import {
  config,
  newBalloonPosition,
  specificationUpdateApi,
  specAutoPopulateApi,
  CatchError,
} from "../Common/Common";
import Accordion from "react-bootstrap/Accordion";
import { ReactComponent as Save } from "../../assets/save.svg";
//import { ReactComponent as Delete } from "../../assets/delete.svg";
import { ReactComponent as CloseFill } from "../../assets/close-fill.svg";
// #endregion

// #region dynamic Components for popup modal
class DynamicRadioInputs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value || "",
      isDirty: false,
    };
  }
  handleRadioChange = (value) => {
    this.setState({ value, isDirty: true }, () => {
      this.props.onChange(this.props.element, value);
    });
  };
  getClassName = (this_decision, value, check) => {
    if (this_decision === "" && value === "") return "ims-cell--math";
    if (this_decision === true && value === "Yes" && check === "Yes")
      return "ims-cell--math bg-success text-white";
    if (this_decision === false && value === "No" && check === "No")
      return "ims-cell--math bg-danger text-white";
    return "ims-cell--math";
  };
  render() {
    let id = this.props.id.toString();
    return (
      <div
        className="popupinput"
        key={`${id}_wrapper`}
        id={`${id}_wrapper`}
        style={{
          paddingLeft: "10px",
          borderLeft: !this.props.disabled ? "1px solid" : "0px",
        }}
      >
        <div key={`${id}_item_wrapper`} id={`${id}_item_wrapper`}>
          <Label key={`${id}_element_label_yes`} id={`${id}_element_label_yes`}>
            <Input
              key={`${id}_element_yes`}
              id={`${id}_element_yes`}
              type="radio"
              className={this.getClassName(
                this.props.this_decision,
                this.props.value,
                "Yes"
              )}
              name={`item-${this.props.id}`}
              value="Yes"
              checked={this.props.value === "Yes"}
              onChange={() => this.handleRadioChange("Yes")}
            ></Input>
            &nbsp;&nbsp;Yes
          </Label>
          <Label
            style={{ marginLeft: "10px" }}
            key={`${id}_element_label_no`}
            id={`${id}_element_label_no`}
          >
            <Input
              key={`${id}_element_no`}
              id={`${id}_element_no`}
              type="radio"
              className={this.getClassName(
                this.props.this_decision,
                this.props.value,
                "No"
              )}
              name={`item-${this.props.id}`}
              value="No"
              checked={this.props.value === "No"}
              onChange={() => this.handleRadioChange("No")}
            ></Input>
            &nbsp;&nbsp;No
          </Label>
        </div>
      </div>
    );
  }
}
class CopyPasteInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value || "",
      isDirty: false,
    };

    this.popupRef = React.createRef(); // Reference for the popup container
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  handleFocus = () => {
    this.props.onFocus(this.props.id);
  };

  handleChange = (e) => {
    const { value } = e.target;
    this.setState({ value, isDirty: true }, () => {
      this.props.onChange(this.props.element, value);
    });
  };

  handleCopy = () => {
    // console.log(this.state)
    this.props.handleCopy(this.state.value);
    this.setState({ isDirty: false });
  };

  handlePaste = () => {
    // console.log(this.props)
    const text = this.props.clipboardContent;
    this.setState({ value: text, isDirty: true }, () => {
      this.props.onChange(this.props.element, text);
    });
  };
  handleClear = () => {
    const text = "";
    this.setState({ value: text, isDirty: true }, () => {
      this.props.onChangeClear(this.props.element, text);
    });
  };

  handleClickOutside(event) {
    if (
      this.popupRef.current &&
      !this.popupRef.current.contains(event.target)
    ) {
      if (!event.target.classList.contains("popupinput")) {
        this.props.onFocus(null);
      }
    } else {
      this.props.onFocus(this.props.id);
      // console.log(event.target.classList, this.props.id)
    }
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  render() {
    let id = this.props.id.toString();
    return (
      <div
        className="popupinput"
        key={`${id}_wrapper`}
        id={`${id}_wrapper`}
        ref={this.popupRef}
        style={{
          position: "relative",
          display: "inline-block",
          margin: "10px",
        }}
      >
        <Input
          key={`${id}_element`}
          id={`${id}_element`}
          type="number"
          min="0"
          step={this.props.step}
          className={this.props.className + " popupinput"}
          value={this.state.value}
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onChange={this.handleChange}
          disabled={this.props.disabled}
        ></Input>
        {this.props.showPopup && this.props.focusedInput === this.props.id && (
          <div
            key={`${id}_element_pop`}
            id={`${id}_element_pop`}
            className={"popupinput"}
            style={{
              position: "absolute",
              top: -30,
              left: -50,
              // backgroundColor: 'transparent',
              padding: "5px",
              //   borderRadius: '0px',
              display: "flex",
              gap: "20px",
              backgroundColor: "white",
              //   boxShadow: "0 0 5px grey",
              boxShadow: "3px 5px 40px 8px grey",
              borderRadius: "3px",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Button
              key={`${id}_element_pop_clr`}
              id={`${id}_element_pop_clr`}
              className="light-btn popupinput Savebtn buttons primary p-0"
              onClick={this.handleClear}
            >
              Clear
            </Button>
            <Button
              key={`${id}_element_pop_cp`}
              id={`${id}_element_pop_cp`}
              className="light-btn popupinput Savebtn buttons primary p-0"
              onClick={this.handleCopy}
            >
              Copy
            </Button>
            <Button
              key={`${id}_element_pop_paste`}
              id={`${id}_element_pop_paste`}
              className="light-btn popupinput Savebtn buttons primary p-0"
              onClick={this.handlePaste}
            >
              Paste
            </Button>
          </div>
        )}
      </div>
    );
  }
}
// #endregion
class PopupModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      actualinputs: [],
      clipboardContent: "",
      isDirty: false,
      focusedInput: null,
      popupShown: false,
      modalData: null,
      modal: false,
      nestedModal: false,
      actualPopup: false,
      closeAll: false,
      activeGroup: null,
      backdrop: "static",
      selectedType: 6,
      selectedSubType: "others",
      selectedUnit: 0,
      selectedSerial_No: "",
      selectedQuantity: 0,
      selectedTolerance: "",
      pTolerance: 0,
      mTolerance: 0,
      maxValue: 0,
      dynamicMinStepValue: 0.1,
      minValue: 0,
      start: 0,
      end: 0,
      Specification: "",
      Actual: "",
      convert: "",
      converted: "",
      SwitchQuantityModal: [],
      ActualDecision: [],
      selectedQuantityCmb: [],
      defaultActual: "",
      Characteristics: "",
      popSpecification: "",
      isHoveringDel: false,
      isHoveringSave: false,
      isballooned: false,
      issubBalloon: false,
      Isadmin: false,
      tolerance_symbol: "",
      tolerance_check: false,
      cb_tolerance_1: "",
      cb_tolerance_2: "",
      cb_datum_a: "",
      cb_datum_1: "",
      cb_datum_b: "",
      cb_datum_2: "",
      cb_datum_c: "",
      cb_datum_3: "",

      isMainDragging: false,
      MainstartX: 0,
      MainstartY: 0,
      MaintranslateX: 0,
      MaintranslateY: 0,

      isSubDragging: false,
      SubstartX: 0,
      SubstartY: 0,
      SubtranslateX: 0,
      SubtranslateY: 0,

      isPopupDragging: false,
      PopupstartX: 0,
      PopupstartY: 0,
      PopuptranslateX: 0,
      PopuptranslateY: 0,
      expandedIndex: 0, // Default to the first item being expanded
      cmbcharacteristics: [],
      showAddCharacteristic: false,
      newCharacteristicText: "",
      showAddUnit: false,
      newUnitText: "",
    };
    this.handleMouseOverDel = this.handleMouseOverDel.bind(this);
    this.handleMouseOutDel = this.handleMouseOutDel.bind(this);

    this.handleMouseOverSave = this.handleMouseOverSave.bind(this);
    this.handleMouseOutSave = this.handleMouseOutSave.bind(this);
    this.onButtonClickHandler = this.onButtonClickHandler.bind(this);
    this.toggleNested = this.toggleNested.bind(this);
    this.toggleActualPopup = this.toggleActualPopup.bind(this);
  }
  insertCharacteristic = async (characteristicText) => {
    const res = await fetch("/api/balloon/add-characteristic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Characteristics: characteristicText }),
    });

    if (res.status === 409) {
      Swal.fire({
        title: "Duplicate",
        //text: 'Characteristic already exists.',
        html: `
                    <div style="display: flex; justify-content: center; align-items: center; text-align: center;">
                         <svg xmlns="http://www.w3.org/2000/svg" 
                            width="20" height="20" viewBox="0 0 24 24" 
                            fill="none" stroke="#f1c40f" stroke-width="2" 
                            stroke-linecap="round" stroke-linejoin="round" 
                            style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <circle cx="12" cy="16" r="1"></circle>
                        </svg>
                        <span>Characteristic already exists.</span>
                        </div>
                        `,
        //icon: 'warning'
      });
      return null;
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to add characteristic: ${errText}`);
    }
    return await res.json();
  };

  insertUnit = async (unitText) => {
    const res = await fetch("/api/balloon/add-unit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Units: unitText }),
    });
    if (res.status === 409) {
      Swal.fire({ title: "Duplicate", html: '<span>Unit already exists.</span>' });
      return null;
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to add unit: ${errText}`);
    }
    return await res.json();
  };

  componentDidUpdate(oldProps) {
    //console.log(this.onFirstDataRendered, "update")
    if (
      oldProps.selectedBalloon !== this.props.selectedBalloon &&
      this.props.selectedBalloon === null
    ) {
      this.onHidePopup();
    }
    if (
      oldProps.selectedBalloon !== this.props.selectedBalloon &&
      this.props.selectedBalloon !== null
    ) {
      this.setState({ modalData: null });
      this.setState({
        modalData: this.props.selectedBalloon,
        modal: true,
        popupShown: true,
      });
      const state = useStore.getState();
      let originalRegions = state.originalRegions;
      let lmtype = state.lmtype;
      let lmsubtype = state.lmsubtype;
      // let units = state.units;

      let newrects = originalRegions
        .map((item) => {
          if (parseInt(item.Balloon) === parseInt(this.props.selectedBalloon)) {
            return item;
          }
          return false;
        })
        .filter((item) => item !== false);
      //console.log(newrects, "didupdate")
      this.setState({ isballooned: newrects[0].isballooned });
      if (newrects.length > 1) {
        newrects = originalRegions
          .map((item) => {
            //console.log(item.Balloon, this.props.selectedBalloon)
            if (
              this.props.selectedBalloon !== null &&
              item.Balloon.toString() === this.props.selectedBalloon.toString()
            ) {
              return item;
            }
            return false;
          })
          .filter((item) => item !== false);
        //console.log(newrects, "didupdate")
        this.setState({ isballooned: newrects[0].isballooned });
        this.setState({
          issubBalloon: !newrects[0].hasOwnProperty("subBalloon")
            ? true
            : false,
        });
      }
      //console.log(newrects, originalRegions, this.props.selectedBalloon)
      //console.log(lmsubtype, newrects[0])
      if (newrects[0].Type === "") {
        let st = lmtype.filter((item, i) => {
          return 6 === item.type_ID;
        });
        let newType = st[0].type_ID;
        this.setState({ selectedType: newType });
      } else {
        let st = lmtype.filter((item, i) => {
          return newrects[0].Type === item.type_Name;
        });
        let newType = st[0].type_ID;
        this.setState({ selectedType: newType });
      }
      if (newrects[0].SubType !== "" && newrects[0].SubType !== "Default") {
        let sst = lmsubtype.filter((item, i) => {
          return newrects[0].SubType === item.subType_Name;
        });
        this.setState({ selectedSubType: sst[0].subType_ID });
      } else {
        //  let sst = lmsubtype.filter((item, i) => { return "others" === item.subType_ID; });
        // console.log("else", sst)
        this.setState({ selectedSubType: "others" });
      }
      if (newrects[0].Unit !== "") {
        this.setState({ selectedUnit: newrects[0].Unit });
      } else {
        this.setState({ selectedUnit: "" });
      }
      if (newrects[0].Serial_No !== "") {
        this.setState({ selectedSerial_No: newrects[0].Serial_No });
      } else {
        this.setState({ selectedSerial_No: "" });
      }
      // this.setState({ selectedUnit: units[0] });

      if (newrects[0].Quantity !== "") {
        this.setState({ selectedQuantity: newrects[0].Quantity });
      } else {
        this.setState({ selectedQuantity: 1 });
      }

      if (newrects[0].Spec !== "") {
        this.setState({
          Specification: newrects[0].Spec,
          popSpecification: newrects[0].Spec,
        });
      } else {
        this.setState({ Specification: "", popSpecification: "" });
      }

      if (newrects[0].ToleranceType !== "") {
        let cmbTolerance = state.cmbTolerance;
        //console.log(newrects)
        let tolerance_select = "";
        cmbTolerance.filter((item, i) => {
          if (item.name === newrects[0].ToleranceType)
            tolerance_select = item.id;
          return item;
        });
        //console.log(tolerance_select)
        this.setState({ selectedTolerance: tolerance_select });
      } else {
        this.setState({ selectedTolerance: 0 });
      }

      if (newrects[0].PlusTolerance !== "") {
        this.setState({ pTolerance: newrects[0].PlusTolerance.toString() });
      } else {
        this.setState({ pTolerance: "+0" });
      }

      if (newrects[0].MinusTolerance !== "") {
        this.setState({ mTolerance: newrects[0].MinusTolerance.toString() });
      } else {
        this.setState({ mTolerance: "-0" });
      }

      if (newrects[0].Maximum !== "") {
        this.setState({ maxValue: newrects[0].Maximum });
      } else {
        this.setState({ maxValue: "0" });
      }

      if (newrects[0].Minimum !== "") {
        this.setState({ minValue: newrects[0].Minimum });
      } else {
        this.setState({ minValue: "0" });
      }
      if (newrects[0].Actual !== "") {
        this.setState({ Actual: newrects[0].Actual });
      } else {
        this.setState({ Actual: "" });
      }
      if (newrects[0].Characteristics !== "") {
        this.setState({ Characteristics: newrects[0].Characteristics });
      } else {
        this.setState({ Characteristics: "" });
      }

      if (newrects[0].Quantity > 1) {
        this.setState({ SwitchQuantityModal: [] });
      } else {
        this.setState({ SwitchQuantityModal: [] });
      }

      this.setState({ convert: newrects[0].convert });
      this.setState({ converted: newrects[0].converted });
      //  this.setState({ ActualDecision: newrects[0].ActualDecision });
      let selectedQuantityCmb = [];
      const resetOverData = [...this.props.draft];
      let items = resetOverData
        .map((item) => {
          if (parseInt(item.Balloon) === parseInt(this.props.selectedBalloon)) {
            return item;
          }
          return false;
        })
        .filter((item) => item !== false);
      let ActualDecision = [];
      items.map((parent, p) => {
        let strBalloon = parent.Balloon.toString().replaceAll(".", "_");
        ActualDecision.push(parent.newarr.ActualDecision);
        parent.newarr.ActualDecision.map((item, qty) => {
          // let key = Object.keys(item);
          // let val = Object.values(item).map(r => r.Actual);

          let o = {
            ref: `${strBalloon}_${qty + 1}_wrapper`,
            id: `${strBalloon}_${qty + 1}_wrapper`,
            value:
              items.length > 1
                ? `${strBalloon} Material Qty ${qty + 1}`
                : `Material Qty ${qty + 1}`,
            group: "wrapper",
            strBalloon: strBalloon,
            collapse: items.length > 1 ? true : false,
            collapseStart: items.length > 1 && qty === 0 ? true : false,
            collapseEnd:
              items.length > 1 && qty === parent.ActualDecision.length - 1
                ? true
                : false,
          };
          selectedQuantityCmb.push(o);
          [item].map((r) => {
            let key = Object.keys(item);
            let val = Object.values(item);
            key.map((user, i) => {
              let o = {
                label: user,
                ref: strBalloon + "_" + (qty + 1) + "_" + user,
                id: strBalloon + "_" + (qty + 1) + "_" + user,
                value: val[i].Actual,
                Balloon: parent.Balloon.toString(),
                Qty: qty,
                sub: p,
                Decision: val[i].Decision,
                group: "element",
              };
              selectedQuantityCmb.push(o);
              return user;
            });
            return r;
          });

          if (
            this.props.selectedBalloon !== null &&
            parent.Balloon.toString() === this.props.selectedBalloon.toString()
          ) {
            // this.setState({ defaultActual: o.ref });
            // this.setState({ Actual: o.value });
          }
          //console.log(item, parent.Balloon, selectedQuantityCmb)
          return item;
        });
        return parent;
      });
      this.setState({ selectedQuantityCmb: selectedQuantityCmb });
      this.setState({ ActualDecision: ActualDecision });
      if (config.console) console.log(ActualDecision);
      if (this.props.user[0].role === "Admin" || this.props.user[0].role === "Supervisor") {
        this.setState({ Isadmin: true });
      } else {
        this.setState({ Isadmin: false });
      }
    }
  }

  onHidePopup = (e) => {
    const state = useStore.getState();
    this.setState({
      MaintranslateX: 0,
      MaintranslateY: 0,
      MainstartX: 0,
      MainstartY: 0,
    });
    //console.log(state.scrollPosition)
    let s = this.props.selectedBalloon;
    //console.log(s)
    //const resetOverData = JSON.parse(JSON.stringify(state.originalRegions));
    const resetOverData = [...state.originalRegions];
    let newrects = resetOverData
      .map((item) => {
        // console.log(item.Balloon, this.props.selectedBalloon)
        if (
          !item.isballooned &&
          s !== null &&
          item.Balloon.toString() === s.toString()
        ) {
          return item;
        }
        return false;
      })
      .filter((item) => item !== false);
    if (newrects.length > 0) {
      //console.log(newrects)
      let deletedOrg = resetOverData
        .map((item) => {
          if (parseInt(item.Balloon) !== parseInt(s)) {
            return item;
          }
          return false;
        })
        .filter((item) => item !== false);

      //return true;
      var newStore = deletedOrg.slice();
      var overData = Object.values(resetOverData)[0];
      if (parseInt(s) - 1 > 0) {
        let overTemp = resetOverData.filter((item) => {
          return parseInt(item.Balloon) === parseInt(s) - 1;
        });
        overData = Object.values(overTemp)[overTemp.length - 1];
      }

      let qtyi = 0;
      // get all quantity parent
      let Qtyparent = resetOverData.reduce((res, item) => {
        if (
          item.hasOwnProperty("subBalloon") &&
          item.subBalloon.length >= 0 &&
          item.Quantity > 1
        ) {
          res[qtyi] = item;
          qtyi++;
        }
        return res;
      }, []);

      var fromIndex = deletedOrg.indexOf(overData);
      var count = state.originalRegions.filter(function (item) {
        return parseInt(item.Balloon) === parseInt(s);
      });
      // console.log(count)
      let changedsingle = [];
      if (count.length > 1) {
        var clone = state.originalRegions.filter(function (item) {
          return parseInt(item.Balloon) === parseInt(s);
        });

        var cloneFirst = clone[0];
        if (cloneFirst.subBalloon.length > 0) cloneFirst.subBalloon.pop();

        const id = uuid();
        if (cloneFirst.Quantity === 1 && cloneFirst.subBalloon.length === 0) {
          let pb = parseInt(cloneFirst.Balloon).toString();
          let newarr = { ...cloneFirst.newarr, Balloon: pb };
          changedsingle.push({
            ...cloneFirst,
            newarr: newarr,
            id: id,
            DrawLineID: 0,
            Balloon: pb,
          });
        }
        if (cloneFirst.Quantity === 1 && cloneFirst.subBalloon.length > 0) {
          let pb = parseInt(cloneFirst.Balloon).toString() + ".1";
          let newarr = { ...cloneFirst.newarr, Balloon: pb };
          changedsingle.push({
            ...cloneFirst,
            newarr: newarr,
            id: id,
            DrawLineID: 0,
            Balloon: pb,
          });

          let newSubItem = cloneFirst.subBalloon.filter((a) => {
            return a.isDeleted === false && a.isballooned === true;
          });
          newSubItem.map(function (e, ei) {
            let sno = ei + 2;
            const sid = uuid();
            let b =
              parseInt(cloneFirst.Balloon).toString() + "." + sno.toString();
            let newarr = { ...e.newarr, Balloon: b };
            changedsingle.push({
              ...e,
              newarr: newarr,
              id: sid,
              DrawLineID: 0,
              Balloon: b,
            });
            return e;
          });
        }
        if (cloneFirst.Quantity > 1 && cloneFirst.subBalloon.length === 0) {
          for (let qi = 1; qi <= cloneFirst.Quantity; qi++) {
            const qid = uuid();
            let pb =
              parseInt(cloneFirst.Balloon).toString() + "." + qi.toString();
            let newarr = { ...cloneFirst.newarr, Balloon: pb };
            changedsingle.push({
              ...cloneFirst,
              newarr: newarr,
              id: qid,
              DrawLineID: 0,
              Balloon: pb,
            });
          }
        }
        if (cloneFirst.Quantity > 1 && cloneFirst.subBalloon.length > 0) {
          for (let qi = 1; qi <= cloneFirst.Quantity; qi++) {
            const qid = uuid();
            let pb =
              parseInt(cloneFirst.Balloon).toString() + "." + qi.toString();
            let newMainItem = Qtyparent.map((item) => {
              if (
                parseInt(cloneFirst.Balloon) === parseInt(item.Balloon) &&
                pb === item.Balloon
              ) {
                return item;
              }

              return false;
            }).filter((x) => x !== false);
            if (config.console) console.log("newMainItem", newMainItem);
            if (newMainItem.length > 0) {
              let nmi = newMainItem[0];
              nmi.subBalloon.pop();
              let newarr = { ...nmi.newarr, Balloon: pb };
              changedsingle.push({
                ...nmi,
                newarr: newarr,
                id: qid,
                DrawLineID: 0,
                Balloon: pb,
              });
              let newSubItem = nmi.subBalloon.filter((a) => {
                return a.isDeleted === false && a.isballooned === true;
              });
              newSubItem.reduce(function (p, e, ei) {
                let sqno = ei + 1;
                const sqid = uuid();
                let b = pb + "." + sqno.toString();
                p.push(b);
                let newarr = { ...e.newarr, Balloon: b };
                changedsingle.push({
                  ...e,
                  newarr: newarr,
                  id: sqid,
                  DrawLineID: 0,
                  Balloon: b,
                });
                return p;
              }, []);
            }
          }
        }
        newStore.splice(fromIndex + 1, 0, ...changedsingle);
        // console.log(newStore, fromIndex, changedsingle, cloneFirst);
      }

      //return true;
      newStore = newStore.map((item, i) => {
        const id = uuid();
        item.intBalloon = parseInt(item.Balloon);
        const isInteger = item.Balloon % 1 === 0;
        if (isInteger) {
          item.hypenBalloon = item.Balloon;
        } else {
          item.hypenBalloon = item.Balloon.replaceAll(".", "-");
        }
        item.id = id;
        if (item.hasOwnProperty("newarr")) {
          let w = parseInt(item.newarr.Crop_Width * 1);
          let h = parseInt(item.newarr.Crop_Height * 1);
          let x = parseInt(item.newarr.Crop_X_Axis * 1);
          let y = parseInt(item.newarr.Crop_Y_Axis * 1);
          let cx = parseInt(item.newarr.Circle_X_Axis * 1);
          let cy = parseInt(item.newarr.Circle_Y_Axis * 1);
          item.Crop_Width = w;
          item.Crop_Height = h;
          item.Crop_X_Axis = x;
          item.Crop_Y_Axis = y;
          item.Circle_X_Axis = cx;
          item.Circle_Y_Axis = cy;
          item.height = h;
          item.width = w;
          item.x = x;
          item.y = y;
        }
        item.DrawLineID = i + 1;
        return item;
      });
      if (config.console) console.log(newStore);
      useStore.setState({
        originalRegions: newStore,
        draft: newStore,
        savedDetails: newStore.length > 0 ? true : false,
        drawingRegions: [],
        balloonRegions: [],
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
    }

    this.setState({
      modalData: null,
      popupShown: false,
      modal: !this.state.modal,
    });
    useStore.setState({ selectedBalloon: null });
    useStore.setState({ selectedRowIndex: null });
    const new1state = useStore.getState();
    //console.log(new1state.scrollPosition)

    setTimeout(function () {
      let scrollElement = document.querySelector("#konvaMain");
      if (scrollElement !== null) {
        scrollElement.scrollLeft = new1state.scrollPosition;
      }
    }, 500);
  };

  handleMouseOverDel() {
    this.setState({ isHoveringDel: true });
  }
  handleMouseOutDel() {
    this.setState({ isHoveringDel: false });
  }

  handleMouseOverSave() {
    this.setState({ isHoveringSave: true });
  }
  handleMouseOutSave() {
    this.setState({ isHoveringSave: false });
  }

  autoPopulateDetails = (e) => {
    e.preventDefault();

    if (this.props.selectedBalloon !== null) {
      setTimeout(() => {
        const { lmtype, lmsubtype, cmbTolerance, originalRegions } =
          useStore.getState();
        let st = lmtype.filter((item, i) => {
          return parseInt(item.type_ID) === parseInt(this.state.selectedType);
        });
        let type = st.length > 0 ? st[0].type_Name : "";
        let sst = lmsubtype.filter((item, i) => {
          //console.log(item, this.state.selectedSubType )
          if (this.state.selectedSubType !== "others") {
            return (
              parseInt(item.subType_ID) === parseInt(this.state.selectedSubType)
            );
          } else {
            return "others" === item.subType_ID;
          }
        });

        let _this = this.state;

        if (config.console) console.log("before this", _this);
        let quantity = _this.selectedQuantity;
        let Spec = _this.Specification;
        let subType = sst.length > 0 ? sst[0].subType_Name : "";
        let tolerance_select = cmbTolerance.filter((item, i) => {
          return parseInt(item.id) === parseInt(_this.selectedTolerance);
        });
        let toleranceType = tolerance_select.length > 0 ? tolerance_select[0].name : "";
        let unit = _this.selectedUnit;
        let actualinput = _this.Actual;
        let characteristics = _this.Characteristics;

        let plusTolerance = _this.pTolerance;
        let presult = /\+(:?\s+)?\d+(\.\d+)?/i.test(plusTolerance);
        plusTolerance = !presult
          ? "+" + plusTolerance
          : plusTolerance.replace(/\s\s+/g, "");
        this.setState({ pTolerance: plusTolerance });

        let minusTolerance = _this.mTolerance;
        let mresult = /-(:?\s+)?\d+(\.\d+)?/i.test(minusTolerance);
        minusTolerance = !mresult
          ? "-" + minusTolerance
          : minusTolerance.replace(/\s\s+/g, "");
        this.setState({ mTolerance: minusTolerance });
        let maximum =
          typeof _this.maxValue === "undefined" ? "0" : _this.maxValue;
        let minimum =
          typeof _this.minValue === "undefined" ? "0" : _this.minValue;

        if (maximum !== "") {
          this.setState({ maxValue: maximum });
        } else {
          this.setState({ maxValue: "0" });
        }

        if (minimum !== "") {
          this.setState({ minValue: minimum });
        } else {
          this.setState({ minValue: "0" });
        }

        if (typeof toleranceType === "undefined" || toleranceType === "") {
          toleranceType = cmbTolerance.length > 0 ? cmbTolerance[0].name : "";
        }
        if (Spec.trim().length === 0) {
          return false;
        }
        let req = {};
        _this = this.state;
        if (config.console) console.log("after this", _this);

        const newrects = originalRegions
          .map((item) => {
            if (
              item.Balloon.toString() === this.props.selectedBalloon.toString()
            ) {
              let x = item.newarr.Crop_X_Axis;
              let y = item.newarr.Crop_Y_Axis;
              let width = item.newarr.Crop_Width;
              let height = item.newarr.Crop_Height;
              item.newarr.Type = type;
              item.newarr.SubType = subType;
              item.newarr.Actual = actualinput;
              item.newarr.Characteristics = characteristics;
              item.newarr.Unit = unit;
              item.newarr.ToleranceType = toleranceType;
              item.newarr.Quantity = parseInt(quantity);
              item.newarr.Spec = Spec;
              item.newarr.PlusTolerance = plusTolerance;
              item.newarr.MinusTolerance = minusTolerance;
              item.newarr.Maximum = maximum;
              item.newarr.Minimum = minimum;

              if (config.console) console.log("Case 1", item);
              return {
                ...item,
                ...item.newarr,
                x,
                y,
                width,
                height,
                selectedRegion: "",
              };
            }

            return false;
          })
          .filter((x) => x !== false);
        if (config.console) console.log("Balloon set state", newrects);
        let newSpec = Spec;
        if (parseInt(quantity) > 1) {
          newSpec = quantity + "X " + Spec;
        }
        req = {
          spec: newSpec,
          originalRegions: newrects,
          plusTolerance: plusTolerance,
          toleranceType: toleranceType,
          minusTolerance: minusTolerance,
          maximum: maximum,
          minimum: minimum,
        };
        if (config.console) console.log("req    ", req);
        // return false;
        setTimeout(
          () =>
            specAutoPopulateApi(req)
              .then((r) => {
                return r.data;
              })
              .then(
                (r) => {
                  if (config.console) console.log(r, "spec Modal Box");
                  const o = r.reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                  }, {});
                  // console.log("updated value",o)
                  // actual decision update

                  // update decision on first item

                  originalRegions
                    .map((item) => {
                      if (
                        item.Balloon.toString() ===
                        this.props.selectedBalloon.toString()
                      ) {
                        item.newarr.Characteristics = characteristics;
                        let convert = o.convert === "True" ? true : false;
                        item.newarr.convert = convert;
                        item.newarr.converted = o.converted;

                        //item.newarr.ActualDecision
                        return item;
                      }

                      return false;
                    })
                    .filter((x) => x !== false);

                  this.setState({
                    convert: o.convert === "True" ? true : false,
                  });
                  this.setState({ converted: o.converted });

                  if (o.Type === "") {
                    let st = lmtype.filter((item, i) => {
                      return 6 === item.type_ID;
                    });
                    let newType = st[0].type_ID;
                    this.setState({ selectedType: newType });
                  } else {
                    let st = lmtype.filter((item, i) => {
                      return o.Type === item.type_Name;
                    });
                    let newType = st[0].type_ID;
                    this.setState({ selectedType: newType });
                  }

                  if (o.SubType !== "" && o.SubType !== "Default") {
                    let sst = lmsubtype.filter((item, i) => {
                      return o.SubType === item.subType_Name;
                    });
                    this.setState({ selectedSubType: sst[0].subType_ID });
                  } else {
                    this.setState({ selectedSubType: "others" });
                  }

                  this.setState({ selectedUnit: unit });

                  if (o.Quantity !== "") {
                    this.setState({ selectedQuantity: o.Quantity });
                  } else {
                    this.setState({ selectedQuantity: 1 });
                  }

                  if (Spec !== "") {
                    // this.setState({ Specification: Spec });
                    this.setState({ popSpecification: Spec });
                  } else {
                    // this.setState({ Specification: "" });
                    this.setState({ popSpecification: "" });
                  }

                  if (o.ToleranceType !== "") {
                    let tolerance_select = "";
                    cmbTolerance.filter((item, i) => {
                      if (item.name === o.ToleranceType)
                        tolerance_select = item.id;
                      return item;
                    });
                    this.setState({ selectedTolerance: tolerance_select });
                  } else {
                    this.setState({ selectedTolerance: 1 });
                  }

                  if (o.PlusTolerance !== "") {
                    this.setState({ pTolerance: o.PlusTolerance.toString() });
                  } else {
                    this.setState({ pTolerance: "+0" });
                  }

                  if (o.MinusTolerance !== "") {
                    this.setState({ mTolerance: o.MinusTolerance.toString() });
                  } else {
                    this.setState({ mTolerance: "-0" });
                  }

                  if (o.Max !== "") {
                    this.setState({ maxValue: o.Max });
                  } else {
                    this.setState({ maxValue: "0" });
                  }

                  if (o.Min !== "") {
                    this.setState({ minValue: o.Min });
                  } else {
                    this.setState({ minValue: "0" });
                  }

                  // console.log(originalRegions)
                  if (config.console)
                    console.log(o, this.state, "spec Modal Box");
                },
                (e) => {
                  console.log("Error", e);
                }
              )
              .catch((e) => {
                console.log("catch", e);
                useStore.setState({ isLoading: false });
                CatchError(e);
              }),

          80
        );
      }, 100);
    }

    return false;
  };

  saveBalloon = async (e) => {
    e.preventDefault();
    if (config.console) console.log("save");
    if (this.props.selectedBalloon !== null) {
      const state = useStore.getState();
      const { lmtype, lmsubtype, cmbTolerance, originalRegions, draft } = state;

      //console.log(this.state)
      let st = lmtype.filter((item, i) => {
        return parseInt(item.type_ID) === parseInt(this.state.selectedType);
      });

      let type = st.length > 0 ? st[0].type_Name : "";
      let sst = lmsubtype.filter((item, i) => {
        //console.log(item, this.state.selectedSubType )
        if (this.state.selectedSubType !== "others") {
          return (
            parseInt(item.subType_ID) === parseInt(this.state.selectedSubType)
          );
        } else {
          return "others" === item.subType_ID;
        }
      });

      let _this = this.state;
      let quantity = _this.selectedQuantity;
      let Spec = _this.Specification;
      let subType = sst.length > 0 ? sst[0].subType_Name : "";
      let tolerance_select = cmbTolerance.filter((item, i) => {
        return parseInt(item.id) === parseInt(_this.selectedTolerance);
      });
      let toleranceType = tolerance_select.length > 0 ? tolerance_select[0].name : "";
      let unit = _this.selectedUnit;
      let actualinput = _this.Actual;
      let characteristics = _this.Characteristics;
      if (characteristics === "Others") {
        try {
          const result = await this.insertCharacteristic(
            _this.characteristicText
          );

          if (!result) return;

          characteristics = result.inserted.characteristics;

          useStore.setState({
            ...state,
            Characteristics: result.characteristicsList,
          });

          //this.setState({ Characteristics: characteristics });

          this.setState({
            Characteristics: characteristics,
            characteristicText: "",
          });
        } catch (err) {
          Swal.fire({
            title: "Error",
            text: "Failed to add characteristic",
            icon: "error",
          });
          return;
        }
      }

      let plusTolerance = _this.pTolerance;
      let presult = /\+(:?\s+)?\d+(\.\d+)?/i.test(plusTolerance.trim());
      plusTolerance = !presult
        ? "+" + plusTolerance.trim()
        : plusTolerance.trim().replace(/\s\s+/g, "");
      this.setState({ pTolerance: plusTolerance });

      let minusTolerance = _this.mTolerance;
      let mresult = /-(:?\s+)?\d+(\.\d+)?/i.test(minusTolerance.trim());
      minusTolerance = !mresult
        ? "-" + minusTolerance.trim()
        : minusTolerance.trim().replace(/\s\s+/g, "");
      this.setState({ mTolerance: minusTolerance });

      let maximum = _this.maxValue;
      let minimum = _this.minValue;

      if (typeof toleranceType === "undefined" || toleranceType === "") {
        toleranceType = cmbTolerance.length > 0 ? cmbTolerance[0].name : "";
      }
      if (Spec.trim().length === 0) {
        Swal.fire({
          title: "Alert!",
          icon: "",
          html: "Specification should not be blank.",
          showConfirmButton: false,
          timer: 2500,
        });
        return false;
      }
      //const overData = JSON.parse(JSON.stringify(originalRegions));
      const overData = [...originalRegions];
      const dup = overData.map((i) => {
        return i;
      });
      if (config.console) console.log(this.state, originalRegions);

      // return false;
      // let presult = /^(\+?\s)/i.test(plusTolerance);
      // let pt = presult ? plusTolerance.replace(/(\+?\s)/mg, "") : plusTolerance;
      // let mresult = /^(\-?\s)/i.test(minusTolerance);
      // let mt = mresult ? minusTolerance.replace(/(\-?\s)/mg, "") : minusTolerance;
      const newrects = originalRegions.map((item) => {
        //console.log(item.Balloon.toString(), this.props.selectedBalloon.toString(), item.isballooned)
        if (item.Balloon.toString() === this.props.selectedBalloon.toString()) {
          let x = item.newarr.Crop_X_Axis;
          let y = item.newarr.Crop_Y_Axis;
          let width = item.newarr.Crop_Width;
          let height = item.newarr.Crop_Height;
          item.newarr.Type = type;
          item.newarr.SubType = subType;
          item.newarr.Unit = unit;
          item.newarr.Characteristics = characteristics;

          item.newarr.ToleranceType = toleranceType;
          item.newarr.Quantity = parseInt(quantity);
          item.newarr.Spec = Spec;
          item.newarr.PlusTolerance = plusTolerance;
          item.newarr.MinusTolerance = minusTolerance;
          item.newarr.Maximum = maximum;
          item.newarr.Minimum = minimum;
          return {
            ...item,
            Type: type,
            SubType: subType,
            Unit: unit,
            ToleranceType: toleranceType,
            Quantity: parseInt(quantity),
            Spec,
            PlusTolerance: plusTolerance,
            MinusTolerance: minusTolerance,
            Maximum: maximum,
            Minimum: minimum,
            x,
            y,
            width,
            height,
          };
        }
        return item;
      });
      if (config.console) console.log("Balloon set state", newrects);

      //return false;
      useStore.setState({ originalRegions: newrects });
      // useStore.setState({ isLoading: true, loadingText: "Saving Balloon... Please Wait..." });
      let nstate = useStore.getState();

      let isNew = nstate.originalRegions
        .map((item) => {
          //console.log(item.Balloon.toString(), this.props.selectedBalloon.toString(), item.isballooned)
          if (
            item.Balloon.toString() === this.props.selectedBalloon.toString() &&
            !item.isballooned
          ) {
            return item;
          }
          return false;
        })
        .filter((i) => i !== false);
      if (config.console) console.log(isNew, isNew.length, dup);
      //useStore.setState({ isLoading: false });
      //return false;
      const oldRegions = dup
        .map((item) => {
          if (config.console)
            console.log(item.Balloon, this.props.selectedBalloon);
          if (
            item.Balloon.toString() === this.props.selectedBalloon.toString()
          ) {
            return item;
          }
          return false;
        })
        .filter((i) => i !== false);

      let single = Object.assign({}, oldRegions[0].newarr);
      let dummy = false;
      let subballoon = false;
      let update = false;
      const isInteger = isNew.Balloon % 1 === 0;
      if (isNew.length === 1 && isInteger) {
        dummy = true;
        if (config.console) console.log("dummy balloon", single);
      }

      if (isNew.length === 1 && !isInteger) {
        quantity = 1;
        subballoon = true;
        if (config.console) console.log("sub balloon", single);
      }
      if (isNew.length === 0) {
        update = true;
        if (config.console) console.log("old data update", oldRegions);
      }

      const id = uuid();
      single = { ...single, id: id, selectedRegion: "" };
      let oldvalue = [];
      oldvalue.push(single);
      if (config.console) console.log("oldvalue ", oldvalue);

      let newSpec = Spec;
      if (quantity > 1 && isNew.length === 0) {
        newSpec = quantity + "X " + Spec;
      }

      let req = {
        spec: newSpec,
        originalRegions: oldvalue,
        plusTolerance: plusTolerance,
        toleranceType: toleranceType,
        minusTolerance: minusTolerance,
        maximum: maximum,
        minimum: minimum,
      };
      if (Spec.trim().length > 0 && isNew.length > 0) {
        const xcheck = Spec.toLowerCase().includes("x");
        const box = Spec.toLowerCase().indexOf("box") !== -1;
        if (!box && xcheck) {
          Swal.fire({
            title: "Alert!",
            icon: "",
            html: "The sub balloon should be single quantity.",
            showConfirmButton: false,
            timer: 2500,
          });
          useStore.setState({ isLoading: false });
          return false;
        }
      }

      if (config.console) console.log("req    ", req);
      // useStore.setState({ isLoading: false });
      useStore.setState({
        isLoading: true,
        loadingText: "Saving Balloon... Please Wait...",
      });
      // return false;
      setTimeout(
        () =>
          specificationUpdateApi(req)
            .then((r) => {
              return r.data;
            })
            .then(
              (r) => {
                if (config.console) console.log(r, "Save Modal Box");

                let nominal = "";
                let mainType = "";
                let datetime = "";
                r.map((a) => {
                  if (a.key === "Min") {
                    minimum = a.value;
                  }
                  if (a.key === "Max") {
                    maximum = a.value;
                  }
                  if (a.key === "Nominal") {
                    nominal = a.value;
                  }
                  if (a.key === "Type") {
                    mainType = a.value;
                  }
                  if (a.key === "SubType") {
                    subType = a.value;
                  }
                  if (a.key === "Unit") {
                    unit = a.value;
                  }
                  if (a.key === "ToleranceType") {
                    toleranceType = a.value;
                  }
                  if (a.key === "PlusTolerance") {
                    plusTolerance = a.value;
                  }
                  if (a.key === "MinusTolerance") {
                    minusTolerance = a.value;
                  }
                  if (a.key === "Num_Qty") {
                    quantity = parseInt(a.value);
                  }
                  if (a.key === "Date") {
                    datetime = a.value;
                  }
                  return a;
                });
                let updatedsingle = [];
                const { ItemView, drawingDetails, originalRegions } =
                  useStore.getState();
                const resetOverDataparent = JSON.parse(
                  JSON.stringify(originalRegions)
                );
                let resetOverData = [...originalRegions];
                let qtyi = 0;
                // get all quantity parent
                let Qtyparentid = resetOverDataparent.reduce((res, item) => {
                  if (
                    item.hasOwnProperty("subBalloon") &&
                    item.subBalloon.length >= 0 &&
                    item.Quantity > 1
                  ) {
                    res[qtyi] = item.Balloon;
                    qtyi++;
                  }
                  return res;
                }, []);
                let Qtyparent = resetOverData
                  .map((item) => {
                    if (Qtyparentid.includes(item.Balloon)) {
                      return item;
                    }
                    return false;
                  })
                  .filter((a) => a !== false);
                if (config.console) console.log(Qtyparent);

                // update actual input
                const act_input = r.reduce((acc, curr) => {
                  acc[curr.key] = curr.value;
                  return acc;
                }, {});
                // console.log(act_input)
                let userSelectedUnit = this.state.selectedUnit;
                originalRegions.map((item) => {
                  if (
                    item.Balloon.toString() ===
                    this.props.selectedBalloon.toString()
                  ) {
                    item.newarr.Actual = actualinput;
                    item.newarr.Decision = act_input.Decision;
                    item.newarr.BalloonColor = act_input.BalloonColor;
                    item.newarr.Characteristics = characteristics;
                    item.newarr.isSaved = true;
                    let convert = act_input.convert === "True" ? true : false;
                    item.convert = convert;
                    item.converted = act_input.converted;

                    item.Actual = actualinput;
                    item.Decision = act_input.Decision;
                    item.BalloonColor = act_input.BalloonColor;
                    item.Characteristics = characteristics;
                    item.isSaved = true;
                    item.Unit =
                      userSelectedUnit === act_input.Unit
                        ? act_input.Unit
                        : userSelectedUnit;

                    return item;
                  }
                  return item;
                });

                if (dummy) {
                  if (config.console) console.log(single.Quantity, quantity, r);

                  updatedsingle = resetOverData.map((item) => {
                    if (
                      parseInt(item.Balloon) ===
                      parseInt(this.props.selectedBalloon)
                    ) {
                      let news = {};
                      news.Minimum = minimum;
                      news.Maximum = maximum;
                      news.Nominal = nominal;
                      news.Type = mainType;
                      news.SubType = subType;
                      // news.Unit = unit;
                      news.ToleranceType = toleranceType;
                      news.PlusTolerance = plusTolerance;
                      news.MinusTolerance = minusTolerance;
                      news.ModifiedDate = datetime;
                      news.Quantity = parseInt(quantity);
                      news.isballooned = true;
                      if (item.hasOwnProperty("newarr")) {
                        item.newarr.Minimum = minimum;
                        item.newarr.Maximum = maximum;
                        item.newarr.Nominal = nominal;
                        item.newarr.Type = mainType;
                        item.newarr.SubType = subType;
                        //  item.newarr.Unit = unit;
                        item.newarr.ToleranceType = toleranceType;
                        item.newarr.PlusTolerance = plusTolerance;
                        item.newarr.MinusTolerance = minusTolerance;
                        item.newarr.ModifiedDate = datetime;
                        item.newarr.Quantity = parseInt(quantity);
                      }
                      return { ...item, ...news };
                    }
                    return item;
                  });
                  if (single.Quantity !== parseInt(quantity)) {
                    let deletableOrg = updatedsingle
                      .map((item) => {
                        if (
                          parseInt(item.Balloon) ===
                          parseInt(this.props.selectedBalloon)
                        ) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);
                    let deletedOrg = updatedsingle
                      .map((item) => {
                        if (
                          parseInt(item.Balloon) !==
                          parseInt(this.props.selectedBalloon)
                        ) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);
                    let changedsingle = [];
                    let cloneFirst = deletableOrg[0];
                    if (quantity > 1) {
                      for (let qi = 1; qi <= quantity; qi++) {
                        const qid = uuid();
                        let pb =
                          parseInt(cloneFirst.Balloon).toString() +
                          "." +
                          qi.toString();
                        let newarr = { ...cloneFirst.newarr, Balloon: pb };
                        changedsingle.push({
                          ...cloneFirst,
                          newarr: newarr,
                          id: qid,
                          DrawLineID: 0,
                          Balloon: pb,
                        });
                      }
                    } else {
                      changedsingle = [cloneFirst].map((item) => {
                        item.Balloon = parseInt(item.Balloon).toString();
                        item.newarr.Balloon = parseInt(item.Balloon).toString();
                        return item;
                      });
                    }

                    var overData = Object.values(nstate.originalRegions)[0];
                    if (parseInt(this.props.selectedBalloon) - 1 > 0) {
                      let overTemp = nstate.originalRegions.filter((item) => {
                        return (
                          parseInt(item.Balloon) ===
                          parseInt(this.props.selectedBalloon) - 1
                        );
                      });
                      overData = Object.values(overTemp)[overTemp.length - 1];
                    }
                    var newStore = deletedOrg.slice();
                    var fromIndex = deletedOrg.indexOf(overData);
                    newStore.splice(fromIndex + 1, 0, ...changedsingle);
                    updatedsingle = newStore;
                  }
                  if (config.console) console.log(updatedsingle);

                  updatedsingle = updatedsingle.map((item, i) => {
                    let w = parseInt(item.newarr.Crop_Width * 1);
                    let h = parseInt(item.newarr.Crop_Height * 1);
                    let x = parseInt(item.newarr.Crop_X_Axis * 1);
                    let y = parseInt(item.newarr.Crop_Y_Axis * 1);
                    let cx = parseInt(item.newarr.Circle_X_Axis * 1);
                    let cy = parseInt(item.newarr.Circle_Y_Axis * 1);
                    const id = uuid();
                    item.intBalloon = parseInt(item.Balloon);
                    const isInteger = item.Balloon % 1 === 0;
                    if (isInteger) {
                      item.hypenBalloon = item.Balloon;
                    } else {
                      item.hypenBalloon = item.Balloon.replaceAll(".", "-");
                    }
                    item.id = id;
                    item.Crop_Width = w;
                    item.Crop_Height = h;
                    item.Crop_X_Axis = x;
                    item.Crop_Y_Axis = y;
                    item.Circle_X_Axis = cx;
                    item.Circle_Y_Axis = cy;
                    item.height = h;
                    item.width = w;
                    item.x = x;
                    item.y = y;
                    item.DrawLineID = i + 1;
                    return item;
                  });
                }
                if (subballoon) {
                  if (config.console)
                    console.log("subballoon", resetOverData, Qtyparent);

                  let found = false;
                  let mainsub = originalRegions
                    .map((item) => {
                      if (
                        parseInt(item.Balloon) ===
                          parseInt(this.props.selectedBalloon) &&
                        !found
                      ) {
                        found = true;
                        item.subBalloon.map((news) => {
                          if (!news.isballooned) {
                            news.Minimum = minimum;
                            news.Maximum = maximum;
                            news.Nominal = nominal;
                            news.Type = mainType;
                            news.SubType = subType;
                            //   news.Unit = unit;
                            news.Spec = this.state.Specification;
                            news.ToleranceType = toleranceType;
                            news.PlusTolerance = plusTolerance;
                            news.MinusTolerance = minusTolerance;
                            news.ModifiedDate = datetime;
                            news.Quantity = 1;
                            news.isballooned = true;
                            if (news.hasOwnProperty("newarr")) {
                              news.newarr.Minimum = minimum;
                              news.newarr.Maximum = maximum;
                              news.newarr.Nominal = nominal;
                              news.newarr.Type = mainType;
                              news.newarr.SubType = subType;
                              //     news.newarr.Unit = unit;
                              news.newarr.Spec = this.state.Specification;
                              news.newarr.ToleranceType = toleranceType;
                              news.newarr.PlusTolerance = plusTolerance;
                              news.newarr.MinusTolerance = minusTolerance;
                              news.newarr.ModifiedDate = datetime;
                              news.newarr.Quantity = 1;
                            }
                            //  return news;
                          }
                          return news;
                        });
                        return item;
                      }
                      return false;
                    })
                    .filter((i) => i !== false);

                  // useStore.setState({ isLoading: false });
                  // return false;
                  if (config.console) console.log("subballoon", mainsub);

                  if (mainsub[0].Quantity > 1) {
                    let subballoonItem = [];
                    for (let qi = 1; qi <= mainsub[0].Quantity; qi++) {
                      let pb =
                        parseInt(mainsub[0].Balloon).toString() +
                        "." +
                        qi.toString();
                      Qtyparent.map((item) => {
                        if (
                          parseInt(mainsub[0].Balloon) ===
                            parseInt(item.Balloon) &&
                          pb === item.Balloon
                        ) {
                          subballoonItem.push(
                            parseInt(mainsub[0].Balloon).toString() +
                              "." +
                              +qi.toString() +
                              "." +
                              item.subBalloon.length.toString()
                          );
                          item.subBalloon.map((news) => {
                            if (!news.isballooned) {
                              let minimum = "",
                                maximum = "",
                                nominal = "",
                                mainType = "",
                                subType = "",
                                toleranceType = "",
                                plusTolerance = "",
                                minusTolerance = "",
                                quantity = "",
                                datetime = "";
                              r.map((a) => {
                                if (a.key === "Min") {
                                  minimum = a.value;
                                }
                                if (a.key === "Max") {
                                  maximum = a.value;
                                }
                                if (a.key === "Nominal") {
                                  nominal = a.value;
                                }
                                if (a.key === "Type") {
                                  mainType = a.value;
                                }
                                if (a.key === "SubType") {
                                  subType = a.value;
                                }
                                // if (a.key === "Unit") { unit = a.value; }
                                if (a.key === "ToleranceType") {
                                  toleranceType = a.value;
                                }
                                if (a.key === "PlusTolerance") {
                                  plusTolerance = a.value;
                                }
                                if (a.key === "MinusTolerance") {
                                  minusTolerance = a.value;
                                }
                                if (a.key === "Num_Qty") {
                                  quantity = a.value;
                                }
                                if (a.key === "Date") {
                                  datetime = a.value;
                                }
                                return a;
                              });
                              news.Minimum = minimum;
                              news.Maximum = maximum;
                              news.Nominal = nominal;
                              news.Type = mainType;
                              news.SubType = subType;
                              //  news.Unit = unit;
                              news.Spec = this.state.Specification;
                              news.ToleranceType = toleranceType;
                              news.PlusTolerance = plusTolerance;
                              news.MinusTolerance = minusTolerance;
                              news.ModifiedDate = datetime;
                              news.Quantity = quantity;
                              news.isballooned = true;
                              if (news.hasOwnProperty("newarr")) {
                                news.newarr.Minimum = minimum;
                                news.newarr.Maximum = maximum;
                                news.newarr.Nominal = nominal;
                                news.newarr.Type = mainType;
                                news.newarr.SubType = subType;
                                //   news.newarr.Unit = unit;
                                news.newarr.Spec = this.state.Specification;
                                news.newarr.ToleranceType = toleranceType;
                                news.newarr.PlusTolerance = plusTolerance;
                                news.newarr.MinusTolerance = minusTolerance;
                                news.newarr.ModifiedDate = datetime;
                                news.newarr.Quantity = quantity;
                              }
                              return news;
                            }
                            return news;
                          });

                          return item;
                        }
                        return item;
                      });
                    }
                    updatedsingle = resetOverData.map((item) => {
                      if (subballoonItem.includes(item.Balloon)) {
                        item.Minimum = minimum;
                        item.Maximum = maximum;
                        item.Nominal = nominal;
                        item.Type = mainType;
                        item.SubType = subType;
                        //  item.Unit = unit;
                        item.Spec = this.state.Specification;
                        item.ToleranceType = toleranceType;
                        item.PlusTolerance = plusTolerance;
                        item.MinusTolerance = minusTolerance;
                        item.ModifiedDate = datetime;
                        item.Quantity = parseInt(quantity);
                        item.isballooned = true;
                        if (item.hasOwnProperty("newarr")) {
                          item.newarr.Minimum = minimum;
                          item.newarr.Maximum = maximum;
                          item.newarr.Nominal = nominal;
                          item.newarr.Type = mainType;
                          item.newarr.SubType = subType;
                          //   item.newarr.Unit = unit;
                          item.newarr.Spec = this.state.Specification;
                          item.newarr.ToleranceType = toleranceType;
                          item.newarr.PlusTolerance = plusTolerance;
                          item.newarr.MinusTolerance = minusTolerance;
                          item.newarr.ModifiedDate = datetime;
                          item.newarr.Quantity = parseInt(quantity);
                        }
                        return item;
                      }

                      return item;
                    });
                  } else {
                    updatedsingle = resetOverData.map((item) => {
                      if (
                        item.Balloon.toString() ===
                          this.props.selectedBalloon.toString() &&
                        !item.isballooned
                      ) {
                        item.Minimum = minimum;
                        item.Maximum = maximum;
                        item.Nominal = nominal;
                        item.Type = mainType;
                        item.SubType = subType;
                        //    item.Unit = unit;
                        item.Spec = this.state.Specification;
                        item.ToleranceType = toleranceType;
                        item.PlusTolerance = plusTolerance;
                        item.MinusTolerance = minusTolerance;
                        item.ModifiedDate = datetime;
                        item.Quantity = parseInt(quantity);
                        item.isballooned = true;
                        if (item.hasOwnProperty("newarr")) {
                          item.newarr.Minimum = minimum;
                          item.newarr.Maximum = maximum;
                          item.newarr.Nominal = nominal;
                          item.newarr.Type = mainType;
                          item.newarr.SubType = subType;
                          //       item.newarr.Unit = unit;
                          item.newarr.Spec = this.state.Specification;
                          item.newarr.ToleranceType = toleranceType;
                          item.newarr.PlusTolerance = plusTolerance;
                          item.newarr.MinusTolerance = minusTolerance;
                          item.newarr.ModifiedDate = datetime;
                          item.newarr.Quantity = parseInt(quantity);
                        }
                        return item;
                      }
                      return item;
                    });
                  }
                }
                if (update) {
                  let found = false;
                  let mainsub = resetOverData
                    .map((item) => {
                      if (
                        parseInt(item.Balloon) ===
                          parseInt(this.props.selectedBalloon) &&
                        !found
                      ) {
                        found = true;
                        return item;
                      }
                      return false;
                    })
                    .filter((i) => i !== false);
                  if (config.console)
                    console.log("balloon update", resetOverData);

                  // sub balloon update
                  if (
                    !oldRegions[0].hasOwnProperty("subBalloon") &&
                    mainsub[0].Quantity === 1
                  ) {
                    if (config.console)
                      console.log("sub balloon update single");
                    const lastNumber =
                      oldRegions[0].Balloon.match(/\d+(?=\D*$)/)[0];
                    found = false;
                    // update the main subBalloon
                    originalRegions
                      .map((item) => {
                        if (
                          parseInt(item.Balloon) ===
                            parseInt(this.props.selectedBalloon) &&
                          !found
                        ) {
                          found = true;
                          item.subBalloon.map((news, index) => {
                            if (index === lastNumber - 2) {
                              news.Minimum = minimum;
                              news.Maximum = maximum;
                              news.Nominal = nominal;
                              news.Type = mainType;
                              news.SubType = subType;
                              news.Unit = unit;
                              news.Spec = this.state.Specification;

                              news.ToleranceType = toleranceType;
                              news.PlusTolerance = plusTolerance;
                              news.MinusTolerance = minusTolerance;
                              news.ModifiedDate = datetime;
                              news.Quantity = 1;
                              news.isballooned = true;
                              news.newarr.Minimum = minimum;
                              news.newarr.Maximum = maximum;
                              news.newarr.Nominal = nominal;
                              news.newarr.Type = mainType;
                              news.newarr.SubType = subType;
                              news.newarr.Unit = unit;
                              news.newarr.Spec = this.state.Specification;

                              news.newarr.ToleranceType = toleranceType;
                              news.newarr.PlusTolerance = plusTolerance;
                              news.newarr.MinusTolerance = minusTolerance;
                              news.newarr.Spec = this.state.Specification;
                              return news;
                            }
                            return news;
                          });
                          return item;
                        }
                        return false;
                      })
                      .filter((i) => i !== false);
                    // current item update
                    updatedsingle = originalRegions.map((item) => {
                      if ([oldRegions[0].Balloon].includes(item.Balloon)) {
                        let news = {};
                        news.Minimum = minimum;
                        news.Maximum = maximum;
                        news.Nominal = nominal;
                        news.Type = mainType;
                        news.SubType = subType;
                        //    news.Unit = unit;
                        news.Spec = this.state.Specification;
                        news.ToleranceType = toleranceType;
                        news.PlusTolerance = plusTolerance;
                        news.MinusTolerance = minusTolerance;
                        news.ModifiedDate = datetime;
                        news.Quantity = parseInt(quantity);
                        news.isballooned = true;
                        if (item.hasOwnProperty("newarr")) {
                          item.newarr.Minimum = minimum;
                          item.newarr.Maximum = maximum;
                          item.newarr.Nominal = nominal;
                          item.newarr.Type = mainType;
                          item.newarr.SubType = subType;
                          //       item.newarr.Unit = unit;
                          item.newarr.Spec = this.state.Specification;
                          item.newarr.ToleranceType = toleranceType;
                          item.newarr.PlusTolerance = plusTolerance;
                          item.newarr.MinusTolerance = minusTolerance;
                          item.newarr.ModifiedDate = datetime;
                          item.newarr.Quantity = parseInt(quantity);
                        }
                        return { ...item, ...news };
                      }
                      return item;
                    });
                  }
                  if (
                    !oldRegions[0].hasOwnProperty("subBalloon") &&
                    mainsub[0].Quantity > 1
                  ) {
                    // if (config.console)
                    console.log("sub balloon update multi qty");
                    const lastNumber =
                      oldRegions[0].Balloon.match(/\d+(?=\D*$)/)[0];
                    let regex = /^(\d*\.?\d*)/;
                    let prefix = oldRegions[0].Balloon.match(regex);
                    // update the main of subBalloon
                    for (let qi = 1; qi <= mainsub[0].Quantity; qi++) {
                      let pb =
                        parseInt(mainsub[0].Balloon).toString() +
                        "." +
                        qi.toString();
                      let newMainItem = Qtyparent.map((item) => {
                        console.log("updating sub before", item);
                        if (
                          pb === item.Balloon &&
                          item.Balloon === prefix[0].toString()
                        ) {
                          console.log("updating sub", item);
                          /*
                                            item.subBalloon.map((news, index) => {
                                                if (index === lastNumber - 1) {
                                                    let minimum = "", maximum = "", nominal = "", mainType = "", subType = "", unit = "", toleranceType = "", plusTolerance = "", minusTolerance = "", quantity = "", datetime = "";
                                                    r.map((a) => {
                                                        if (a.key === "Min") { minimum = a.value; }
                                                        if (a.key === "Max") { maximum = a.value; }
                                                        if (a.key === "Nominal") { nominal = a.value; }
                                                        if (a.key === "Type") { mainType = a.value; }
                                                        if (a.key === "SubType") { subType = a.value; }
                                                        if (a.key === "Unit") { unit = a.value; }
                                                        if (a.key === "ToleranceType") { toleranceType = a.value; }
                                                        if (a.key === "PlusTolerance") { plusTolerance = a.value; }
                                                        if (a.key === "MinusTolerance") { minusTolerance = a.value; }
                                                        if (a.key === "Num_Qty") { quantity = a.value; }
                                                        if (a.key === "Date") { datetime = a.value; }
                                                        return a;
                                                    });
                                                    news.Minimum = minimum;
                                                    news.Maximum = maximum;
                                                    news.Nominal = nominal;
                                                    news.Type = mainType;
                                                    news.SubType = subType;
                                                    news.Unit = unit;
                                                    news.Spec = this.state.Specification;
                                                    news.ToleranceType = toleranceType;
                                                    news.PlusTolerance = plusTolerance;
                                                    news.MinusTolerance = minusTolerance;
                                                    news.ModifiedDate = datetime;
                                                    news.Quantity = quantity;
                                                    news.isballooned = true;
                                                    if (news.hasOwnProperty("newarr")) {
                                                        news.newarr.Minimum = minimum;
                                                        news.newarr.Maximum = maximum;
                                                        news.newarr.Nominal = nominal;
                                                        news.newarr.Type = mainType;
                                                        news.newarr.SubType = subType;
                                                        news.newarr.Unit = unit;
                                                        news.newarr.Spec = this.state.Specification;
                                                        news.newarr.ToleranceType = toleranceType;
                                                        news.newarr.PlusTolerance = plusTolerance;
                                                        news.newarr.MinusTolerance = minusTolerance;
                                                        news.newarr.ModifiedDate = datetime;
                                                        news.newarr.Quantity = quantity;
                                                    }
                                                    return news;
                                                }
                                                return news;
                                            });
                                            */
                          return item;
                        }
                        return false;
                      }).filter((x) => x !== false);
                      if (config.console)
                        console.log(
                          "sub balloon update multi qty",
                          newMainItem
                        );
                    }
                    // update the main subBalloon
                    const deletableOrg = originalRegions
                      .map((item) => {
                        if (item.Balloon === prefix[0]) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);
                    let deletedOrg = originalRegions
                      .map((item) => {
                        if (item.Balloon !== prefix[0]) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);

                    const changedsingle = deletableOrg.map((mitem) => {
                      const subBalloon = JSON.parse(
                        JSON.stringify(mitem.subBalloon)
                      );
                      subBalloon.map((item, i) => {
                        if (i === lastNumber - 1) {
                          item.Minimum = minimum;
                          item.Maximum = maximum;
                          item.Nominal = nominal;
                          item.Type = mainType;
                          item.SubType = subType;
                          //     item.Unit = unit;
                          item.Spec = this.state.Specification;
                          item.ToleranceType = toleranceType;
                          item.PlusTolerance = plusTolerance;
                          item.MinusTolerance = minusTolerance;
                          item.ModifiedDate = datetime;
                          item.Quantity = parseInt(quantity);
                          item.isballooned = true;
                          if (item.hasOwnProperty("newarr")) {
                            item.newarr.Minimum = minimum;
                            item.newarr.Maximum = maximum;
                            item.newarr.Nominal = nominal;
                            item.newarr.Type = mainType;
                            item.newarr.SubType = subType;
                            //       item.newarr.Unit = unit;
                            item.newarr.Spec = this.state.Specification;
                            item.newarr.ToleranceType = toleranceType;
                            item.newarr.PlusTolerance = plusTolerance;
                            item.newarr.MinusTolerance = minusTolerance;
                            item.newarr.ModifiedDate = datetime;
                            item.newarr.Quantity = parseInt(quantity);
                          }
                        }
                        return item;
                      });
                      mitem.subBalloon = subBalloon;
                      return mitem;
                    });
                    console.log(changedsingle);
                    let overData = Object.values(originalRegions)[0];
                    if (parseInt(prefix[0]) - 1 > 0) {
                      let overTemp = originalRegions.filter((item) => {
                        return item.Balloon === prefix[0];
                      });
                      overData = Object.values(overTemp)[0];
                    }

                    let newitems = deletedOrg.slice();
                    let fromIndex = originalRegions.indexOf(deletableOrg[0]);
                    let toIndex = originalRegions.indexOf(overData);
                    newitems.splice(fromIndex, 0, ...changedsingle);
                    //let subBalloonm = [...sub];
                    console.log(
                      "sub balloon sssss",
                      deletableOrg,
                      changedsingle,
                      fromIndex,
                      toIndex,
                      newitems
                    );

                    //this.api.setFocusedCell(rowNo, 'start', 'top');
                    //const gridApi = agGridRef.current.api;
                    // Ensure the row at the specified index is visible
                    //gridApi.ensureIndexVisible(index, 'middle');

                    updatedsingle = resetOverData.map((item) => {
                      if (item.Balloon === this.props.selectedBalloon) {
                        item.Minimum = minimum;
                        item.Maximum = maximum;
                        item.Nominal = nominal;
                        item.Type = mainType;
                        item.SubType = subType;
                        //     item.Unit = unit;
                        item.Spec = this.state.Specification;
                        item.ToleranceType = toleranceType;
                        item.PlusTolerance = plusTolerance;
                        item.MinusTolerance = minusTolerance;
                        item.ModifiedDate = datetime;
                        item.Quantity = 1;
                        item.isballooned = true;
                        if (item.hasOwnProperty("newarr")) {
                          item.newarr.Minimum = minimum;
                          item.newarr.Maximum = maximum;
                          item.newarr.Nominal = nominal;
                          item.newarr.Type = mainType;
                          item.newarr.SubType = subType;
                          //         item.newarr.Unit = unit;
                          item.newarr.Spec = this.state.Specification;
                          item.newarr.ToleranceType = toleranceType;
                          item.newarr.PlusTolerance = plusTolerance;
                          item.newarr.MinusTolerance = minusTolerance;
                          item.newarr.ModifiedDate = datetime;
                          item.newarr.Quantity = 1;
                        }
                        return item;
                      }
                      return item;
                    });
                    updatedsingle = newitems;
                    if (config.console)
                      console.log("balloon update af", updatedsingle);

                    /*
                                 originalRegions.map((item) => {
                                     if (parseInt(item.Balloon) === parseInt(this.props.selectedBalloon) && !found) {
                                         found = true;
                                         item.subBalloon.map((news, index) => {
                                             if (index === lastNumber - 1) {
                                                 news.Minimum = minimum;
                                                 news.Maximum = maximum;
                                                 news.Nominal = nominal;
                                                 news.Type = mainType;
                                                 news.SubType = subType;
                                                 news.Unit = unit;
                                                 news.Spec = this.state.Specification;
                                                 news.ToleranceType = toleranceType;
                                                 news.PlusTolerance = plusTolerance;
                                                 news.MinusTolerance = minusTolerance;
                                                 news.ModifiedDate = datetime;
                                                 news.Quantity = 1;
                                                 news.isballooned = true;
                                                 return news;
                                             }
                                             return news;
                                         });
                                         return item;
                                     }
                                     return false;
                                 }).filter((i) => i !== false);
                                  
 
                                 let subballoonItem = [];
                                 for (let qi = 1; qi <= mainsub[0].Quantity; qi++) {
                                     subballoonItem.push( parseInt(mainsub[0].Balloon).toString() + "." + qi.toString() + "." + lastNumber.toString());
                                 }
 
                         
                                 [mainsub[0]].map((item) => {
                                     item.subBalloon.map((news, index) => {
                                         if (index === lastNumber - 1) {
                                             news.Minimum = minimum;
                                             news.Maximum = maximum;
                                             news.Nominal = nominal;
                                             news.Type = mainType;
                                             news.SubType = subType;
                                             news.Unit = unit;
                                             news.Spec = this.state.Specification;
                                             news.ToleranceType = toleranceType;
                                             news.PlusTolerance = plusTolerance;
                                             news.MinusTolerance = minusTolerance;
                                             news.ModifiedDate = datetime;
                                             news.Quantity = 1;
                                             news.isballooned = true;
                                             if (news.hasOwnProperty("newarr")) {
                                                 news.newarr.Minimum = minimum;
                                                 news.newarr.Maximum = maximum;
                                                 news.newarr.Nominal = nominal;
                                                 news.newarr.Type = mainType;
                                                 news.newarr.SubType = subType;
                                                 news.newarr.Unit = unit;
                                                 news.newarr.Spec = this.state.Specification;
                                                 news.newarr.ToleranceType = toleranceType;
                                                 news.newarr.PlusTolerance = plusTolerance;
                                                 news.newarr.MinusTolerance = minusTolerance;
                                                 news.newarr.ModifiedDate = datetime;
                                                 news.newarr.Quantity = 1;
                                             }
                                             return news;
                                         }
                                         return news;
                                     });
                                     return item;
                                 });
                                 
                                 updatedsingle = originalRegions.map((item) => {
                                     if (subballoonItem.includes(item.Balloon)) {
                                        
                                         let news = {}
                                         news.Minimum = minimum;
                                         news.Maximum = maximum;
                                         news.Nominal = nominal;
                                         news.Type = mainType;
                                         news.SubType = subType;
                                         news.Unit = unit;
                                         news.Spec = this.state.Specification;
                                         news.ToleranceType = toleranceType;
                                         news.PlusTolerance = plusTolerance;
                                         news.MinusTolerance = minusTolerance;
                                         news.ModifiedDate = datetime;
                                         news.Quantity = 1;
                                         news.isballooned = true;
                                         if (item.hasOwnProperty("newarr")) {
                                             item.newarr.Minimum = minimum;
                                             item.newarr.Maximum = maximum;
                                             item.newarr.Nominal = nominal;
                                             item.newarr.Type = mainType;
                                             item.newarr.SubType = subType;
                                             item.newarr.Unit = unit;
                                             item.newarr.Spec = this.state.Specification;
                                             item.newarr.ToleranceType = toleranceType;
                                             item.newarr.PlusTolerance = plusTolerance;
                                             item.newarr.MinusTolerance = minusTolerance;
                                             item.newarr.ModifiedDate = datetime;
                                             item.newarr.Quantity = 1;
                                         }
                                         return { ...item, ...news };
                                     }
                                     return item;
                                 });
                                 */
                  }

                  // main item
                  if (oldRegions[0].hasOwnProperty("subBalloon"))
                    if (config.console) console.log("main balloon update");
                  let changedsingle = [];

                  let pageNo = 0;

                  if (drawingDetails.length > 0 && ItemView != null) {
                    pageNo =
                      Object.values(drawingDetails)[parseInt(ItemView)]
                        .currentPage;
                  }
                  let PageData = originalRegions
                    .map((item) => {
                      if (parseInt(item.Page_No) === parseInt(pageNo)) {
                        return item;
                      }
                      return false;
                    })
                    .filter((item) => item !== false);

                  let deletedOrg = originalRegions.map((item) => {
                    return item;
                  });

                  let fromIndex = PageData.indexOf(mainsub[0]);

                  let oldStore = draft
                    .map((item) => {
                      if (
                        item.Balloon.toString() ===
                        this.props.selectedBalloon.toString()
                      ) {
                        return item;
                      }
                      return false;
                    })
                    .filter((x) => x !== false);

                  const act_dim = r.reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                  }, {});

                  let orgStore = originalRegions
                    .map((item) => {
                      if (
                        item.Balloon.toString() ===
                        this.props.selectedBalloon.toString()
                      ) {
                        item.newarr.Actual = actualinput;
                        item.newarr.Decision = act_dim.Decision;
                        item.newarr.BalloonColor = act_dim.BalloonColor;
                        item.newarr.Characteristics = characteristics;
                        item.newarr.isSaved = true;

                        item.Actual = actualinput;
                        item.Decision = act_dim.Decision;
                        item.BalloonColor = act_dim.BalloonColor;
                        item.Characteristics = characteristics;
                        item.isSaved = true;

                        return item;
                      }
                      return false;
                    })
                    .filter((x) => x !== false);

                  if (oldStore[0].Quantity !== orgStore[0].Quantity) {
                    deletedOrg = originalRegions
                      .map((item) => {
                        if (
                          parseInt(item.Balloon) !==
                          parseInt(this.props.selectedBalloon)
                        ) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);
                  }

                  let newStore = [];

                  if (oldStore[0].Quantity === orgStore[0].Quantity) {
                    newStore = originalRegions.map((item) => {
                      if (
                        item.Balloon.toString() ===
                        this.props.selectedBalloon.toString()
                      ) {
                        const o = r.reduce((acc, curr) => {
                          acc[curr.key] = curr.value;
                          return acc;
                        }, {});

                        item.Minimum = o.Min;
                        item.Maximum = o.Max;
                        item.Nominal = o.Nominal;
                        item.Type = o.Type;
                        item.SubType = o.SubType;
                        //       item.Unit = o.Unit;
                        item.Spec = this.state.Specification;
                        item.ToleranceType = o.ToleranceType;
                        item.PlusTolerance = o.PlusTolerance;
                        item.MinusTolerance = o.MinusTolerance;
                        item.ModifiedDate = o.Date;
                        item.Quantity = parseInt(o.Num_Qty);
                        item.isballooned = true;
                        if (item.hasOwnProperty("newarr")) {
                          item.newarr.Minimum = o.Min;
                          item.newarr.Maximum = o.Max;
                          item.newarr.Nominal = o.Nominal;
                          item.newarr.Type = o.Type;
                          item.newarr.SubType = o.SubType;
                          //        item.newarr.Unit = o.Unit;
                          item.newarr.Spec = this.state.Specification;
                          item.newarr.ToleranceType = o.ToleranceType;
                          item.newarr.PlusTolerance = o.PlusTolerance;
                          item.newarr.MinusTolerance = o.MinusTolerance;
                          item.newarr.ModifiedDate = o.Date;
                          item.newarr.Quantity = parseInt(o.Num_Qty);
                        }
                        return item;
                      }
                      return item;
                    });
                    deletedOrg = originalRegions
                      .map((item) => {
                        if (
                          parseInt(item.Balloon) !==
                          parseInt(this.props.selectedBalloon)
                        ) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);
                    let decreasedOrg = originalRegions
                      .map((item) => {
                        if (
                          parseInt(item.Balloon) ===
                          parseInt(this.props.selectedBalloon)
                        ) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);
                    const o = r.reduce((acc, curr) => {
                      acc[curr.key] = curr.value;
                      return acc;
                    }, {});
                    let c = {};
                    c.Minimum = o.Min;
                    c.Maximum = o.Max;
                    c.Nominal = o.Nominal;
                    c.Type = o.Type;
                    c.SubType = o.SubType;
                    //  c.Unit = o.Unit;
                    c.Spec = this.state.Specification;
                    c.ToleranceType = o.ToleranceType;
                    c.PlusTolerance = o.PlusTolerance;
                    c.MinusTolerance = o.MinusTolerance;
                    c.ModifiedDate = o.Date;
                    c.Quantity = parseInt(o.Num_Qty);

                    if (orgStore[0].Quantity === 1) {
                      changedsingle = decreasedOrg;
                    }
                    for (let qi = 1; qi <= orgStore[0].Quantity; qi++) {
                      let pb =
                        parseInt(mainsub[0].Balloon).toString() +
                        "." +
                        qi.toString();
                      const qid = uuid();
                      let newItem = decreasedOrg.filter((item) => {
                        return item.Balloon === pb;
                      });
                      if (newItem.length > 0) {
                        let newSubItem = newItem[0].subBalloon.filter((a) => {
                          return a.isDeleted === false;
                        });
                        if (parseInt(o.Num_Qty) > 1) {
                          pb =
                            parseInt(mainsub[0].Balloon).toString() +
                            "." +
                            qi.toString();
                        } else {
                          pb = parseInt(mainsub[0].Balloon).toString();
                          if (newSubItem.length > 0) {
                            pb = parseInt(mainsub[0].Balloon).toString() + ".1";
                          }
                        }
                        let newarr = {
                          ...newItem[0].newarr,
                          Balloon: pb,
                          ...c,
                        };
                        changedsingle.push({
                          ...newItem[0],
                          newarr: newarr,
                          id: qid,
                          DrawLineID: newItem[0].DrawLineID,
                          Balloon: pb,
                          ...c,
                        });

                        newSubItem.map((e, ei) => {
                          let sqno = ei + 1;
                          let b = pb + "." + sqno.toString();
                          if (parseInt(o.Num_Qty) === 1) {
                            sqno = ei + 2;
                            b =
                              parseInt(mainsub[0].Balloon) +
                              "." +
                              sqno.toString();
                          }

                          const qid = uuid();
                          changedsingle.push({
                            ...e,
                            newarr: { ...e.newarr, Balloon: b },
                            id: qid,
                            DrawLineID: newItem[0].DrawLineID,
                            Balloon: b,
                          });
                          return e;
                        });
                      }
                    }
                  }
                  if (oldStore[0].Quantity < orgStore[0].Quantity) {
                    // increased
                    if (config.console)
                      console.log("final pop increased", orgStore[0].Quantity);

                    const o = r.reduce((acc, curr) => {
                      acc[curr.key] = curr.value;
                      return acc;
                    }, {});
                    let c = {};
                    c.Minimum = o.Min;
                    c.Maximum = o.Max;
                    c.Nominal = o.Nominal;
                    c.Type = o.Type;
                    c.SubType = o.SubType;
                    //   c.Unit = o.Unit;
                    c.Spec = this.state.Specification;
                    c.ToleranceType = o.ToleranceType;
                    c.PlusTolerance = o.PlusTolerance;
                    c.MinusTolerance = o.MinusTolerance;
                    c.ModifiedDate = o.Date;
                    c.Quantity = parseInt(o.Num_Qty);

                    for (let qi = 1; qi <= orgStore[0].Quantity; qi++) {
                      let pb =
                        parseInt(mainsub[0].Balloon).toString() +
                        "." +
                        qi.toString();
                      const qid = uuid();
                      let newarr = { ...mainsub[0].newarr, Balloon: pb, ...c };
                      changedsingle.push({
                        ...mainsub[0],
                        newarr: newarr,
                        id: qid,
                        DrawLineID: mainsub[0].DrawLineID,
                        Balloon: pb,
                        ...c,
                      });
                      let newSubItem = mainsub[0].subBalloon.filter((a) => {
                        return a.isDeleted === false;
                      });
                      newSubItem.map((e, ei) => {
                        let sqno = ei + 1;
                        let b = pb + "." + sqno.toString();
                        const qid = uuid();
                        changedsingle.push({
                          ...e,
                          newarr: { ...e.newarr, Balloon: b },
                          id: qid,
                          DrawLineID: mainsub[0].DrawLineID,
                          Balloon: b,
                        });
                        return e;
                      });
                    }
                  }
                  if (oldStore[0].Quantity > orgStore[0].Quantity) {
                    // decreased
                    if (config.console)
                      console.log("final pop decreased", mainsub[0].Quantity);
                    let decreasedOrg = originalRegions
                      .map((item) => {
                        if (
                          parseInt(item.Balloon) ===
                          parseInt(this.props.selectedBalloon)
                        ) {
                          return item;
                        }
                        return false;
                      })
                      .filter((item) => item !== false);
                    const o = r.reduce((acc, curr) => {
                      acc[curr.key] = curr.value;
                      return acc;
                    }, {});
                    let c = {};
                    c.Minimum = o.Min;
                    c.Maximum = o.Max;
                    c.Nominal = o.Nominal;
                    c.Type = o.Type;
                    c.SubType = o.SubType;
                    //    c.Unit = o.Unit;
                    c.Spec = this.state.Specification;
                    c.ToleranceType = o.ToleranceType;
                    c.PlusTolerance = o.PlusTolerance;
                    c.MinusTolerance = o.MinusTolerance;
                    c.ModifiedDate = o.Date;
                    c.Quantity = parseInt(o.Num_Qty);

                    for (let qi = 1; qi <= orgStore[0].Quantity; qi++) {
                      let pb =
                        parseInt(mainsub[0].Balloon).toString() +
                        "." +
                        qi.toString();
                      const qid = uuid();
                      let newItem = decreasedOrg.filter((item) => {
                        return item.Balloon === pb;
                      });
                      if (newItem.length > 0) {
                        let newSubItem = newItem[0].subBalloon.filter((a) => {
                          return a.isDeleted === false;
                        });
                        if (parseInt(o.Num_Qty) > 1) {
                          pb =
                            parseInt(mainsub[0].Balloon).toString() +
                            "." +
                            qi.toString();
                        } else {
                          pb = parseInt(mainsub[0].Balloon).toString();
                          if (newSubItem.length > 0) {
                            pb = parseInt(mainsub[0].Balloon).toString() + ".1";
                          }
                        }
                        let newarr = {
                          ...newItem[0].newarr,
                          Balloon: pb,
                          ...c,
                        };
                        changedsingle.push({
                          ...newItem[0],
                          newarr: newarr,
                          id: qid,
                          DrawLineID: newItem[0].DrawLineID,
                          Balloon: pb,
                          ...c,
                        });

                        newSubItem.map((e, ei) => {
                          let sqno = ei + 1;
                          let b = pb + "." + sqno.toString();
                          if (parseInt(o.Num_Qty) === 1) {
                            sqno = ei + 2;
                            b =
                              parseInt(mainsub[0].Balloon) +
                              "." +
                              sqno.toString();
                          }

                          const qid = uuid();
                          changedsingle.push({
                            ...e,
                            newarr: { ...e.newarr, Balloon: b },
                            id: qid,
                            DrawLineID: newItem[0].DrawLineID,
                            Balloon: b,
                          });
                          return e;
                        });
                      }
                    }
                  }
                  newStore = deletedOrg.slice();
                  newStore.splice(fromIndex, 0, ...changedsingle);
                  // let selectedRowIndex = newStore[fromIndex].Balloon
                  //  useStore.setState({ selectedRowIndex: selectedRowIndex.toString() });

                  if (config.console)
                    console.log("final pop save", newStore, changedsingle);
                  //return false;

                  updatedsingle = newStore;
                }

                if (config.console)
                  console.log("final pop save", updatedsingle);

                //return false;
                useStore.setState({
                  originalRegions: updatedsingle,
                  draft: updatedsingle,
                  savedDetails: updatedsingle.length > 0 ? true : false,
                  selectedRowIndex: this.props.selectedBalloon,
                  drawingRegions: [],
                  balloonRegions: [],
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
                this.setState({ isHoveringDel: false, isHoveringSave: false });
                this.onHidePopup();
                useStore.setState({ isLoading: false });
              },
              (e) => {
                console.log("Error", e);
                useStore.setState({ isLoading: false });
              }
            )
            .catch((e) => {
              console.log("catch", e);
              useStore.setState({ isLoading: false });
              CatchError(e);
            }),

        500
      );
    }
  };

  deleteBalloon = (e) => {
    e.preventDefault();
    let deleteItem = this.props.selectedBalloon.replaceAll(".", "-");

    Swal.fire({
      title: `Are you want to delete Balloon (${deleteItem})?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      /* Read more about isConfirmed */
      if (result.isConfirmed) {
        useStore.setState({
          isLoading: true,
          loadingText: "Delete a Balloon... Please Wait...",
        });
        const state = useStore.getState();
        let deleteItem1 = this.props.selectedBalloon;
        setTimeout(() => {
          const { ItemView, drawingDetails, originalRegions } =
            useStore.getState();
          let pageNo = 0;

          if (drawingDetails.length > 0 && ItemView != null) {
            pageNo =
              Object.values(drawingDetails)[parseInt(ItemView)].currentPage;
          }

          let PageData = originalRegions
            .map((item) => {
              if (
                parseInt(item.Page_No) === parseInt(pageNo) &&
                item.Balloon !== deleteItem1
              ) {
                return item;
              }
              return false;
            })
            .filter((item) => item !== false);

          state.originalRegions
            .map((item) => {
              if (parseInt(item.Balloon) !== parseInt(deleteItem1)) {
                return item;
              }
              return false;
            })
            .filter((item) => item !== false);

          //const resetOverData = JSON.parse(JSON.stringify(state.originalRegions));
          const resetOverData = [...state.originalRegions];

          let resetOverSingle = resetOverData.reduce((res, item) => {
            if (!res[parseInt(item.Balloon)]) {
              res[parseInt(item.Balloon)] = item;
            }
            return res;
          }, []);

          let unique = Object.values(resetOverSingle);
          if (config.console) console.log(unique);
          let removable = resetOverData
            .map((item) => {
              if (parseInt(item.Balloon) === parseInt(deleteItem1)) {
                return item;
              }
              return false;
            })
            .filter((item) => item !== false);

          let deletableItem = resetOverData
            .map((item) => {
              if (item.Balloon === deleteItem1) {
                return item;
              }
              return false;
            })
            .filter((item) => item !== false);

          let qty = parseInt(removable[0].Quantity);

          let qtyi = 0;
          // get all quantity parent
          let Qtyparent = resetOverData.reduce((res, item) => {
            if (
              item.hasOwnProperty("subBalloon") &&
              item.subBalloon.length >= 0 &&
              item.Quantity > 1
            ) {
              res[qtyi] = item;
              qtyi++;
            }
            return res;
          }, []);
          if (config.console) console.log(resetOverData, Qtyparent, qty);
          // return false;
          let newitems = [];
          // if (qty > 1) {
          if (!deletableItem[0].hasOwnProperty("subBalloon")) {
            unique.reduce((prev, curr, index) => {
              const id = uuid();
              let newarr = [];
              let Balloon = index + 1;
              Balloon = Balloon.toString();

              if (curr.Quantity === 1 && curr.subBalloon.length === 0) {
                prev.push({ b: Balloon, c: prev.length + 1 });
                let i = prev.length;
                newarr.push({
                  ...curr,
                  x: curr.newarr.Crop_X_Axis,
                  y: curr.newarr.Crop_Y_Axis,
                  newarr: { ...curr.newarr, Balloon: Balloon },
                  id: id,
                  DrawLineID: i,
                  Balloon: Balloon,
                });
              }

              if (curr.Quantity === 1 && curr.subBalloon.length > 0) {
                let suffix = deletableItem[0].Balloon.match(/\d+(?=\D*$)/)[0];
                let regex = /^(\d*\.?\d*)/;
                let prefix = deletableItem[0].Balloon.match(regex);
                if (config.console)
                  console.log(suffix, prefix[0].toString(), deletableItem[0]);

                let newSubItem = curr.subBalloon;

                if (
                  curr.Balloon ===
                  parseInt(deletableItem[0].Balloon).toString() + ".1"
                ) {
                  newSubItem = curr.subBalloon
                    .filter((x) => x.isDeleted === false)
                    .map(function (e, ei) {
                      let sqno = ei + 2;
                      if (suffix.toString() === sqno.toString()) {
                        if (config.console) console.log("new", suffix, sqno);
                        e.isDeleted = true;
                        e.newarr.isDeleted = true;
                      }
                      return e;
                    });
                }

                newSubItem = newSubItem.filter((a) => {
                  return a.isDeleted === false;
                });
                let pb = parseInt(Balloon).toString();
                if (newSubItem.length > 0) {
                  pb = parseInt(Balloon).toString() + ".1";
                }

                prev.push({ b: pb, c: prev.length + 1 });
                let i = prev.length;
                newarr.push({
                  ...curr,
                  newarr: { ...curr.newarr, Balloon: pb },
                  id: id,
                  DrawLineID: i,
                  Balloon: pb,
                });

                newSubItem.map(function (e, ei) {
                  let sno = ei + 2;
                  const sid = uuid();
                  let b = parseInt(Balloon).toString() + "." + sno.toString();
                  prev.push({ b: b, c: prev.length + 1 });
                  let i = prev.length;
                  if (e.hasOwnProperty("Isballooned")) delete e.Isballooned;
                  if (e.hasOwnProperty("Id")) delete e.Id;

                  let setter = {
                    ...e,
                    newarr: { ...e.newarr, Balloon: b },
                    id: sid,
                    DrawLineID: i,
                    Balloon: b,
                  };
                  newarr.push(setter);
                  return e;
                });
              }

              if (curr.Quantity > 1 && curr.subBalloon.length === 0) {
                for (let qi = 1; qi <= curr.Quantity; qi++) {
                  if (qi > config.maxBalloonQty) {
                    break;
                  }
                  const qid = uuid();
                  let b = parseInt(Balloon).toString() + "." + qi.toString();
                  prev.push({ b: b, c: prev.length + 1 });
                  let i = prev.length;
                  newarr.push({
                    ...curr,
                    newarr: { ...curr.newarr, Balloon: b },
                    id: qid,
                    DrawLineID: i,
                    Balloon: b,
                  });
                }
              }

              if (curr.Quantity > 1 && curr.subBalloon.length > 0) {
                for (let qi = 1; qi <= curr.Quantity; qi++) {
                  if (qi > config.maxBalloonQty) {
                    break;
                  }
                  let newMainItem = [];
                  let oldMainItem = [];
                  let pb =
                    parseInt(curr.Balloon).toString() + "." + qi.toString();
                  prev.push({ b: pb, c: prev.length + 1 });
                  let i = prev.length;

                  newMainItem = Qtyparent.map((item) => {
                    let suffix =
                      deletableItem[0].Balloon.match(/\d+(?=\D*$)/)[0];
                    let regex = /^(\d*\.?\d*)/;
                    let prefix = deletableItem[0].Balloon.match(regex);
                    const id = uuid();
                    if (config.console)
                      console.log("new", suffix, pb, item.Balloon, prefix[0]);
                    if (
                      pb === item.Balloon &&
                      item.Balloon === prefix[0].toString()
                    ) {
                      let subBalloon = JSON.parse(
                        JSON.stringify(item.subBalloon)
                      );
                      // let subBalloon = [...item.subBalloon];

                      subBalloon.map(function (e, ei) {
                        let sqno = ei + 1;
                        if (suffix.toString() === sqno.toString()) {
                          if (config.console)
                            console.log("new", suffix, sqno, e.Spec);
                          e.isDeleted = true;
                          e.newarr.isDeleted = true;
                        }
                        return e;
                      });
                      item.subBalloon = subBalloon;
                      item.id = id;
                      item.DrawLineID = i;
                      return item;
                    }
                    return false;
                  }).filter((x) => x !== false);

                  oldMainItem = Qtyparent.map((item) => {
                    let regex = /^(\d*\.?\d*)/;
                    let prefix = deletableItem[0].Balloon.match(regex);
                    if (
                      pb === item.Balloon &&
                      item.Balloon !== prefix[0].toString()
                    ) {
                      // const subBalloon = JSON.parse(JSON.stringify(item.subBalloon));
                      const subBalloon = [...item.subBalloon];
                      item.subBalloon = subBalloon;
                      item.id = id;
                      item.DrawLineID = i;
                      return item;
                    }
                    return false;
                  }).filter((x) => x !== false);
                  console.log("main items", newMainItem, oldMainItem);

                  if (newMainItem.length > 0) {
                    newMainItem.map((nmi) => {
                      newarr.push(nmi);
                      let newSubItem = nmi.subBalloon.filter((a) => {
                        return a.isDeleted === false;
                      });

                      newSubItem.map(function (e, ei) {
                        let sqno = ei + 1;
                        const sqid = uuid();
                        let b = nmi.Balloon + "." + sqno.toString();
                        prev.push({ b: b, c: prev.length + 1 });
                        let i = prev.length;
                        if (e.hasOwnProperty("Isballooned"))
                          delete e.Isballooned;
                        if (e.hasOwnProperty("Id")) delete e.Id;
                        let setter = {
                          ...e,
                          newarr: { ...e.newarr, Balloon: b },
                          id: sqid,
                          DrawLineID: i,
                          Balloon: b,
                        };
                        newarr.push(setter);
                        return e;
                      });
                      return nmi;
                    });
                  } else {
                    oldMainItem.map((omi) => {
                      newarr.push(omi);
                      let OldSubItem = omi.subBalloon.filter((a) => {
                        return a.isDeleted === false;
                      });

                      OldSubItem.map(function (e, ei) {
                        let sqno = ei + 1;
                        const sqid = uuid();
                        let b = omi.Balloon + "." + sqno.toString();
                        prev.push({ b: b, c: prev.length + 1 });
                        let i = prev.length;
                        if (e.hasOwnProperty("Isballooned"))
                          delete e.Isballooned;
                        if (e.hasOwnProperty("Id")) delete e.Id;
                        let setter = {
                          ...e,
                          newarr: { ...e.newarr, Balloon: b },
                          id: sqid,
                          DrawLineID: i,
                          Balloon: b,
                        };
                        newarr.push(setter);
                        return e;
                      });
                      return omi;
                    });
                  }
                  //console.log("main items",  newMainItem, oldMainItem);
                  // newarr.push({ ...curr, newarr: { ...curr.newarr, Balloon: pb }, id: qid, DrawLineID: i, Balloon: pb });
                }
              }

              newitems = newitems.slice();
              newitems.splice(newitems.length, 0, ...newarr);

              return prev;
            }, []);
          }
          // }
          let selectedRowIndex = "";
          PageData = newitems
            .map((item) => {
              if (parseInt(item.Page_No) === parseInt(pageNo)) {
                return item;
              }
              return false;
            })
            .filter((item) => item !== false);

          if (PageData.length > 0) {
            var overData = [];
            let key = deleteItem1.toString().split(".");
            if (key.length > 2) {
              key.pop();
              let se = key.join(".");
              let overTemp = PageData.filter((item) => {
                return item.Balloon === se;
              });
              overData = Object.values(overTemp)[0];
            } else {
              let se = key[0] + ".1";
              let se1 = key[0];
              let overTemp = PageData.filter((item) => {
                return item.Balloon === se || item.Balloon === se1;
              });
              overData = Object.values(overTemp)[0];
            }
            var prenxtData = PageData.indexOf(overData);
            selectedRowIndex = PageData[prenxtData].Balloon;
            //console.log(selectedRowIndex)
            useStore.setState({
              selectedRowIndex: selectedRowIndex.toString(),
            });
          } else {
            useStore.setState({ selectedRowIndex: null });
          }

          const newstate = useStore.getState();
          let newrect = newBalloonPosition(newitems, newstate);
          useStore.setState({
            originalRegions: newitems,
            draft: newitems,
            drawingRegions: newrect,
            balloonRegions: newrect,
          });
          if (config.console) console.log("pop up delete", newitems);
          // useStore.setState({ isLoading: false });
          //console.log(removable, deletableItem, Qtyparent, newitems)
          //  return false;
          useStore.setState({ isLoading: false });
          this.setState({ isHoveringDel: false });
          this.onHidePopup();
        }, 300);

        const dstate = useStore.getState();
        setTimeout(function () {
          let scrollElement = document.querySelector("#konvaMain");
          if (scrollElement !== null) {
            scrollElement.scrollLeft = dstate.scrollPosition;
          }
        }, 100);
      }
    });
    return false;
  };

  toggleActualPopup = (e) => {
    e.preventDefault();
    this.setState({ actualPopup: !this.state.actualPopup });
    this.setState({ closeAll: false });
  };
  toggleNested = (e) => {
    e.preventDefault();

    this.setState({ popSpecification: this.state.Specification });
    this.setState({ nestedModal: !this.state.nestedModal });
    this.setState({ closeAll: false });
    window.setTimeout(() => {
      const element = document.getElementById("gdt_input");
      const end = element.value.length;
      element.setSelectionRange(end, end);
      element.focus();
    }, 200);
    // window.setTimeout(() => element.focus(), 0);
  };
  toggleAll = () => {
    this.setState({ nestedModal: !this.state.nestedModal });
    this.setState({
      closeAll: true,

      isSubDragging: false,
      SubstartX: 0,
      SubstartY: 0,
      SubtranslateX: 0,
      SubtranslateY: 0,
    });
  };
  onHideactualPopup = () => {
    this.setState({ actualPopup: !this.state.actualPopup });
    this.setState({
      focusedInput: null,

      isPopupDragging: false,
      PopupstartX: 0,
      PopupstartY: 0,
      PopuptranslateX: 0,
      PopuptranslateY: 0,
    });
  };
  addSpecification = (e) => {
    e.preventDefault();
    let value = "";
    if (this.state.tolerance_symbol !== "") {
      value = value + this.state.tolerance_symbol;
    }
    if (this.state.tolerance_check) {
      value = value + "ëàí";
    }
    if (this.state.cb_tolerance_1 !== "") {
      value = value + this.state.cb_tolerance_1;
    }
    if (this.state.cb_tolerance_2 !== "") {
      value = value + this.state.cb_tolerance_2;
    }
    if (this.state.cb_datum_a !== "") {
      value = value + this.state.cb_datum_a;
    }
    if (this.state.cb_datum_1 !== "") {
      value = value + this.state.cb_datum_1;
    }
    if (this.state.cb_datum_b !== "") {
      value = value + this.state.cb_datum_b;
    }
    if (this.state.cb_datum_2 !== "") {
      value = value + this.state.cb_datum_2;
    }
    if (this.state.cb_datum_c !== "") {
      value = value + this.state.cb_datum_c;
    }
    if (this.state.cb_datum_3 !== "") {
      value = value + this.state.cb_datum_3;
    }
    let ovalue = this.state.popSpecification;
    let newValue =
      ovalue.substring(0, this.state.start) +
      value +
      ovalue.substring(this.state.end, ovalue.length);
    this.setState({
      start: this.state.start + value.length,
      end: this.state.end + value.length,
    });
    this.setState({
      popSpecification: newValue,
      tolerance_symbol: "",
      tolerance_check: false,
      cb_tolerance_1: "",
      cb_tolerance_2: "",
      cb_datum_a: "",
      cb_datum_1: "",
      cb_datum_b: "",
      cb_datum_2: "",
      cb_datum_c: "",
      cb_datum_3: "",
    });
    //  console.log("addSpecification")
  };
  onButtonClickHandler = (e) => {
    e.preventDefault();
    let text = e.target.dataset.value;
    let value = this.state.popSpecification;
    let newValue =
      value.substring(0, this.state.start) +
      text +
      value.substring(this.state.end, value.length);
    this.setState({
      start: this.state.start + text.length,
      end: this.state.end + text.length,
    });
    this.setState({ popSpecification: newValue });
    //console.log("onButtonClickHandler")
  };
  handleSelect = (e) => {
    e.preventDefault();
    // console.log("handleSelect")
    this.setState({
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    });
  };
  saveSpecification = (e) => {
    e.preventDefault();
    this.setState({ Specification: this.state.popSpecification });
    //console.log("popSpecification")
    this.toggleAll();
  };
  // Handle the change event for the dropdown
  handleDropdownChange = (e) => {
    // console.log(e.target.value)
    this.setState({ selectedTolerance: e.target.value });
  };
  handleFocus = (id) => {
    this.setState({ focusedInput: id });
  };
  handleFocusOut = () => {
    this.setState({ focusedInput: null });
  };
  handleCopy = (value) => {
    this.setState({ clipboardContent: value });
    this.setState({ focusedInput: false });
  };

  handleInputChange = (element, value) => {
    // console.log(element,value)
    const { originalRegions, successPicker, errorPicker, defaultPicker } =
      useStore.getState();
    // const clonedArray = originalRegions.map(item => ({ ...item }));
    let Balloon = parseFloat(element.Balloon);

    if (!element.Balloon.includes(".")) {
      Balloon = parseInt(element.Balloon);
    } else {
      Balloon = element.Balloon;
    }
    let items = originalRegions
      .map((item) => {
        if (parseInt(item.Balloon) === parseInt(this.props.selectedBalloon)) {
          return item;
        }
        return false;
      })
      .filter((item) => item !== false);

    items.map((item, p) => {
      if (item.Balloon.toString() === Balloon.toString()) {
        let Min = item.Minimum;
        let Max = item.Maximum;
        let this_value = value;
        // console.log(item)
        let decision = "";
        if (
          Min !== "" &&
          Max !== "" &&
          this_value !== "" &&
          item.ToleranceType !== "Attribute"
        ) {
          decision =
            parseFloat(this_value) >= parseFloat(Min) &&
            parseFloat(this_value) <= parseFloat(Max);
        }
        item.newarr.ActualDecision[element.Qty][element.label].Actual =
          this_value;
        item.newarr.ActualDecision[element.Qty][element.label].Decision =
          decision;
        // console.log(p, element.sub)
        if (p === element.sub) {
          // console.log(item, this.state.ActualDecision)
          this.setState((prevState) => {
            const updatedActualDecision = [...prevState.ActualDecision];
            updatedActualDecision[element.sub][element.Qty][
              element.label
            ].Actual = this_value; // Update the Actual value
            updatedActualDecision[element.sub][element.Qty][
              element.label
            ].Decision = decision; // Update the Decision value
            return { ActualDecision: updatedActualDecision, isDirty: true };
          });
        }
        return item;
      }
      return item;
    });
    // console.log(items, this.state.ActualDecision)
    let pushableActual = [];
    let pushableDecision = [];
    this.state.ActualDecision.map((item, ind) => {
      //console.log(item)
      if (this.state.selectedQuantity > config.maxBalloonQty) {
        if (ind === 0 || ind === this.state.ActualDecision.length - 1) {
          item.map((el) => {
            //console.log(Object.keys(el))
            Object.keys(el).map((k) => {
              pushableActual.push(el[k].Actual);
              pushableDecision.push(el[k].Decision);
              return k;
            });
            return el;
          });
        }
      } else {
        item.map((el) => {
          //console.log(Object.keys(el))
          Object.keys(el).map((k) => {
            pushableActual.push(el[k].Actual);
            pushableDecision.push(el[k].Decision);
            return k;
          });
          return el;
        });
      }
      return item;
    });
    const allEqual = (arr) => arr.every((v) => v === true);
    // console.log(pushableDecision, this.state.selectedQuantity)
    items.map((item, p) => {
      if (pushableDecision.includes(false)) {
        // console.log('e',errorPicker)
        item.newarr.BalloonColor = errorPicker;
        return item;
      }

      if (allEqual(pushableDecision)) {
        // console.log('s',successPicker)
        item.newarr.BalloonColor = successPicker;
        return item;
      }

      if (pushableDecision.includes("")) {
        // console.log('d',defaultPicker)
        item.newarr.BalloonColor = defaultPicker;
        return item;
      }

      return item;
    });
    // console.log(items, this.state.ActualDecision)
    //  this.setState({ focusedInput: null });
    if (value !== "") this.setState({ focusedInput: false });
  };
  handleInputClear = (element, value) => {
    this.handleInputChange(element, value);
  };
  handleRadioInputChange = (element, value) => {
    // console.log(element, value)
    const { originalRegions, successPicker, errorPicker, defaultPicker } =
      useStore.getState();
    const clonedArray = originalRegions.map((item) => ({ ...item }));
    let Balloon = parseFloat(element.Balloon);
    if (!element.Balloon.includes(".")) {
      Balloon = parseInt(element.Balloon);
    } else {
      Balloon = element.Balloon;
    }
    let items = clonedArray
      .map((item) => {
        if (parseInt(item.Balloon) === parseInt(this.props.selectedBalloon)) {
          return item;
        }
        return false;
      })
      .filter((item) => item !== false);
    items.map((item, p) => {
      if (item.Balloon.toString() === Balloon.toString()) {
        let this_value = value;

        let decision = "";
        if (this_value !== "" && item.ToleranceType === "Attribute") {
          if (this_value === "Yes") {
            decision = true;
          }
          if (this_value !== "Yes") {
            decision = false;
          }
        }
        item.newarr.ActualDecision[element.Qty][element.label].Actual =
          this_value;
        item.newarr.ActualDecision[element.Qty][element.label].Decision =
          decision;
        if (p === element.sub) {
          this.setState((prevState) => {
            const updatedActualDecision = [...prevState.ActualDecision];
            updatedActualDecision[element.sub][element.Qty][
              element.label
            ].Actual = this_value; // Update the Actual value
            updatedActualDecision[element.sub][element.Qty][
              element.label
            ].Decision = decision; // Update the Decision value
            return { ActualDecision: updatedActualDecision, isDirty: true };
          });
        }
        return item;
      }
      return item;
    });

    let pushableActual = [];
    let pushableDecision = [];
    this.state.ActualDecision.map((item) => {
      item.map((el) => {
        pushableActual.push(el[element.label].Actual);
        pushableDecision.push(el[element.label].Decision);
        return el;
      });
      return item;
    });
    const allEqual = (arr) => arr.every((v) => v === true);
    items.map((item, p) => {
      if (pushableDecision.includes(false)) {
        // console.log('e',errorPicker)
        item.newarr.BalloonColor = errorPicker;
        return item;
      }

      if (allEqual(pushableDecision)) {
        // console.log('s',successPicker)
        item.newarr.BalloonColor = successPicker;
        return item;
      }

      if (pushableDecision.includes("")) {
        //console.log('d',defaultPicker)
        item.newarr.BalloonColor = defaultPicker;
        return item;
      }

      return item;
    });
  };

  groupsData = () => {
    const { selectedQuantityCmb } = this.state;
    let groups = {};
    if (this.state.actualPopup === true) {
      groups = selectedQuantityCmb.reduce((acc, item) => {
        if (item.group === "wrapper") {
          acc.push({
            id: item.id,
            ref: item.ref,
            value: item.value,
            strBalloon: item.strBalloon,
            collapse: item.collapse,
            collapseStart: item.collapseStart,
            collapseEnd: item.collapseEnd,
            elements: [],
          });
        } else {
          acc[acc.length - 1].elements.push(item);
        }
        return acc;
      }, []);
      return groups;
    }
    return groups;
  };
  groupedData = (groups) => {
    let groupedData = {};
    if (this.state.actualPopup === true) {
      groupedData = groups.reduce((acc, curr) => {
        (acc[curr.strBalloon] = acc[curr.strBalloon] || []).push(curr);
        return acc;
      }, {});
      return groupedData;
    }
    return groupedData;
  };
  handleAccordionToggle = (index) => {
    this.setState({
      expandedIndex: this.state.expandedIndex === index ? null : index,
    });
  };
  handleMainStart = (e) => {
    const isTouch = e.type === "touchstart";
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    this.setState({
      isMainDragging: true,
      MainstartX: startX,
      MainstartY: startY,
    });
    window.addEventListener(
      isTouch ? "touchmove" : "mousemove",
      this.handleMainDrag
    );
    window.addEventListener(
      isTouch ? "touchend" : "mouseup",
      this.handleMainStop
    );
  };
  handleMainDrag = (e) => {
    //console.log("Dragging",e);
    if (!this.state.isMainDragging) return;
    const isTouch = e.type === "touchmove";
    const currentX = isTouch ? e.touches[0].clientX : e.clientX;
    const currentY = isTouch ? e.touches[0].clientY : e.clientY;
    this.setState((prevState) => ({
      MaintranslateX:
        prevState.MaintranslateX + (currentX - prevState.MainstartX),
      MaintranslateY:
        prevState.MaintranslateY + (currentY - prevState.MainstartY),
      MainstartX: currentX,
      MainstartY: currentY,
    }));
  };
  handleMainStop = (e) => {
    //console.log("Drag Stop", e);
    this.setState({ isMainDragging: false });
    const isTouch = e.type === "touchend";
    window.removeEventListener(
      isTouch ? "touchmove" : "mousemove",
      this.handleMainDrag
    );
    window.removeEventListener(
      isTouch ? "touchend" : "mouseup",
      this.handleMainStop
    );
  };

  handleSubStart = (e) => {
    const isTouch = e.type === "touchstart";
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    this.setState({
      isSubDragging: true,
      SubstartX: startX,
      SubstartY: startY,
    });
    window.addEventListener(
      isTouch ? "touchmove" : "mousemove",
      this.handleSubDrag
    );
    window.addEventListener(
      isTouch ? "touchend" : "mouseup",
      this.handleSubStop
    );
  };
  handleSubDrag = (e) => {
    //console.log("Dragging",e);
    if (!this.state.isSubDragging) return;
    const isTouch = e.type === "touchmove";
    const currentX = isTouch ? e.touches[0].clientX : e.clientX;
    const currentY = isTouch ? e.touches[0].clientY : e.clientY;
    this.setState((prevState) => ({
      SubtranslateX: prevState.SubtranslateX + (currentX - prevState.SubstartX),
      SubtranslateY: prevState.SubtranslateY + (currentY - prevState.SubstartY),
      SubstartX: currentX,
      SubstartY: currentY,
    }));
  };
  handleSubStop = (e) => {
    //console.log("Drag Stop", e);
    this.setState({ isSubDragging: false });
    const isTouch = e.type === "touchend";
    window.removeEventListener(
      isTouch ? "touchmove" : "mousemove",
      this.handleSubDrag
    );
    window.removeEventListener(
      isTouch ? "touchend" : "mouseup",
      this.handleSubStop
    );
  };

  handlePopupStart = (e) => {
    const isTouch = e.type === "touchstart";
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    this.setState({
      isPopupDragging: true,
      PopupstartX: startX,
      PopupstartY: startY,
    });
    window.addEventListener(
      isTouch ? "touchmove" : "mousemove",
      this.handlePopupDrag
    );
    window.addEventListener(
      isTouch ? "touchend" : "mouseup",
      this.handlePopupStop
    );
  };
  handlePopupDrag = (e) => {
    //console.log("Dragging",e);
    if (!this.state.isPopupDragging) return;
    const isTouch = e.type === "touchmove";
    const currentX = isTouch ? e.touches[0].clientX : e.clientX;
    const currentY = isTouch ? e.touches[0].clientY : e.clientY;
    this.setState((prevState) => ({
      PopuptranslateX:
        prevState.PopuptranslateX + (currentX - prevState.PopupstartX),
      PopuptranslateY:
        prevState.PopuptranslateY + (currentY - prevState.PopupstartY),
      PopupstartX: currentX,
      PopupstartY: currentY,
    }));
  };
  handlePopupStop = (e) => {
    //console.log("Drag Stop", e);
    this.setState({ isPopupDragging: false });
    const isTouch = e.type === "touchend";
    window.removeEventListener(
      isTouch ? "touchmove" : "mousemove",
      this.handlePopupDrag
    );
    window.removeEventListener(
      isTouch ? "touchend" : "mouseup",
      this.handlePopupStop
    );
  };

  render() {
    //console.log(this.state)

    let tol_symbol = [
      "",
      "ëûí",
      "ëüí",
      "ëáí",
      "ëâí",
      "ëãí",
      "ëäí",
      "ëåí",
      "ëæí",
      "ëçí",
      "ëèí",
      "ë²í",
      "ë³í",
      "ëÿí",
      "ëºí",
    ];
    let cb_tolerance_1 = [
      "",
      "ëùîîïí",
      "ëùîîðí",
      "ëùîîòí",
      "ëùîîóí",
      "ëùîïîí",
      "ëùîïóí",
      "ëùîðîí",
    ];
    let cb_tolerance_2 = ["", "ëÝí", "ëÞí", "ëßí", "ë…í", "ëŸí", "ëží", "ëχí"];
    let cb_datum_a = [
      "",
      "ëÀí",
      "ëÁí",
      "ëÂí",
      "ëÃí",
      "ëÄí",
      "ëÆí",
      "ëÇí",
      "ëÈí",
      "ëÉí",
      "ëÊí",
      "ëËí",
      "ëÌí",
      "ëÍí",
      "ëÎí",
      "ëÏí",
      "ëÐí",
      "ëÑí",
      "ëÒí",
      "ëÓí",
      "ëÔí",
      "ëÕí",
      "ëÖí",
      "ë×í",
      "ëØí",
      "ëÙí",
    ];
    let cb_datum_1 = ["", "ëÝí", "ëÞí", "ëßí", "ë…í", "ëŸí", "ëží", "ëχí"];

    const { expandedIndex } = this.state;
    const state = useStore.getState();
    let originalRegions = state.originalRegions;
    let newrects = originalRegions
      .map((item) => {
        //console.log(item.Balloon, this.props.selectedBalloon)
        if (
          this.props.selectedBalloon !== null &&
          parseInt(item.Balloon) === parseInt(this.props.selectedBalloon)
        ) {
          return item;
        }
        return false;
      })
      .filter((item) => item !== false);
    if (newrects.length > 1) {
      newrects = originalRegions
        .map((item) => {
          // console.log(item.Balloon, this.props.selectedBalloon)
          if (
            this.props.selectedBalloon !== null &&
            item.Balloon.toString() === this.props.selectedBalloon.toString()
          ) {
            return item;
          }
          return false;
        })
        .filter((item) => item !== false);
    }
    if (config.console)
      console.log(originalRegions, newrects, this.props.selectedBalloon);
    let lmtype = state.lmtype;
    let lmsubtype = state.lmsubtype;

    let units = state.units;
    let InstrumentSerials = state.InstrumentSerials;
    let cmbTolerance = state.cmbTolerance;

    let type1 = this.state.selectedType;
    let type2 = this.state.selectedSubType;
    let type_unit = this.state.selectedUnit;
    let typeTolerance = this.state.selectedTolerance;
    let quantity = parseInt(this.state.selectedQuantity);
    let type_characteristics = this.state.Characteristics;

    // let Spec = this.state.Specification
    let plusTolerance = this.state.pTolerance;
    let minusTolerance = this.state.mTolerance;
    let maxValue = this.state.maxValue;
    let minValue = this.state.minValue;

    let cmbcharacteristics = state.Characteristics;
    const decimalPlaces = (minValue.toString().split(".")[1] || []).length;
    let dynamicStepValue = [];
    dynamicStepValue.push(".");
    for (let i = 0; i < decimalPlaces; i++) {
      dynamicStepValue.push("0");
    }
    dynamicStepValue.push("1");

    // console.log(minValue, dynamicStepValue.join(''))

    if (this.state.popupShown === true) {
      // console.log(this.state)
      let nspec = this.state.popSpecification;
      let spec = this.state.Specification;
      let tolerance_symbol = this.state.tolerance_symbol;
      let tolerance_check = this.state.tolerance_check;
      let tolerance_1 = this.state.cb_tolerance_1;
      let tolerance_2 = this.state.cb_tolerance_2;
      let datum_a = this.state.cb_datum_a;
      let datum_1 = this.state.cb_datum_1;
      let datum_b = this.state.cb_datum_b;
      let datum_2 = this.state.cb_datum_2;
      let datum_c = this.state.cb_datum_c;
      let datum_3 = this.state.cb_datum_3;
      // console.log(Spec, nspec,spec)
      let hypenBalloon;
      let h = this.props.selectedBalloon;
      const isInteger = h % 1 === 0;
      if (isInteger) {
        hypenBalloon = h;
      } else {
        hypenBalloon = h.replaceAll(".", "-");
      }
      const {
        MaintranslateX,
        MaintranslateY,
        SubtranslateX,
        SubtranslateY,
        PopuptranslateX,
        PopuptranslateY,
      } = this.state;
      const groups = this.groupsData();
      const groupedData = this.groupedData(groups);
      return (
        <>
          {/* <Draggable
                    cancel=".fieldmove"
                    handle=".handlemain"
                    defaultPosition={{ x: 0, y: 0 }}
                    scale={1}
                    bounds={{ left: - window.innerWidth / 2, top: - window.innerHeight / 2, right: window.innerWidth / 2, bottom: window.innerHeight / 2 }}
                >*/}

          <Modal
            isOpen={this.state.modal}
            toggle={this.onHidePopup}
            backdrop={this.state.backdrop}
            keyboard={false}
            className="balloon-modal"
            style={{
              maxWidth: "680px",
              width: "100%",
              touchAction: "none",
              transform: `translate(${MaintranslateX}px, ${MaintranslateY}px)`,
            }}
            centered={true}
          >
            <div
              className="balloon-modal-header handlemain"
              onMouseDown={(e) => this.handleMainStart(e)}
              onTouchStart={(e) => this.handleMainStart(e)}
            >
              <h2 className="balloon-title">Balloon No <span className="balloon-badge">{hypenBalloon}</span></h2>
              <div className="header-actions">
                {this.state.Isadmin && (
                  <button
                    className="btn"
                    onClick={this.saveBalloon}
                    title="Save"
                  >
                    <Save className="icon" style={{ width: 16, height: 16 }} />
                    <span>Save</span>
                  </button>
                )}
                <button
                  className="btn btn-close-modal"
                  onClick={this.onHidePopup}
                  title="Close"
                >
                  <span>&times;</span>
                </button>
              </div>
            </div>
            <div className="balloon-modal-body">
              {newrects.length > 0 && (
                <div className="balloon-form-grid">
                  {/* Row 1: Type & Sub-Type */}
                  <div className="form-field">
                    <label className="field-label">Type</label>
                    <select
                      id="type"
                      className="field-input"
                      disabled={!this.state.Isadmin}
                      value={type1}
                      onChange={(e) => this.setState({ selectedType: e.target.value })}
                    >
                      {lmtype.map((item, i) => (
                        <option key={i} value={item.type_ID}>{item.type_Name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="field-label">Sub-Type</label>
                    <select
                      id="sub_type"
                      className="field-input"
                      disabled={!this.state.Isadmin}
                      value={type2}
                      onChange={(e) => this.setState({ selectedSubType: e.target.value })}
                    >
                      <option value="">--Select--</option>
                      {lmsubtype.map((item, i) => (
                        <option key={i} value={item.subType_ID}>{item.subType_Name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 2: Units & Quantity */}
                  <div className="form-field">
                    <label className="field-label">Units</label>
                    <div className="field-input-wrapper">
                      <select
                        id="units"
                        className="field-input"
                        disabled={!this.state.Isadmin}
                        value={type_unit}
                        onChange={(e) => this.setState({ selectedUnit: e.target.value })}
                      >
                        <option value="">--Select--</option>
                        {units.map((item, i) => (
                          <option key={i} value={item.units}>{item.units}</option>
                        ))}
                      </select>
                      {this.state.Isadmin && (
                        <button className="btn-add-new"
                          onClick={() => this.setState({ showAddUnit: !this.state.showAddUnit, newUnitText: "" })}>
                          + Add
                        </button>
                      )}
                    </div>
                    {this.state.showAddUnit && (
                      <div className="add-inline-form">
                        <input type="text" placeholder="New unit name..."
                          value={this.state.newUnitText}
                          onChange={(e) => this.setState({ newUnitText: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("btn_save_unit")?.click(); } }} />
                        <button id="btn_save_unit" className="btn-save-inline"
                          disabled={!this.state.newUnitText.trim()}
                          onClick={async () => {
                            const val = this.state.newUnitText.trim();
                            if (!val) return;
                            try {
                              const result = await this.insertUnit(val);
                              if (result && result.unitsList) {
                                useStore.setState({ units: result.unitsList });
                                this.setState({ selectedUnit: val, showAddUnit: false, newUnitText: "" });
                                Swal.fire({ title: "Added", text: `"${val}" added successfully.`, icon: "success", timer: 1500, showConfirmButton: false });
                              }
                            } catch (err) { Swal.fire({ title: "Error", text: err.message, icon: "error" }); }
                          }}>Save</button>
                        <button className="btn-cancel-inline"
                          onClick={() => this.setState({ showAddUnit: false, newUnitText: "" })}>Cancel</button>
                      </div>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="field-label">Quantity</label>
                    <input
                      id="quantity"
                      className="field-input"
                      type="number"
                      min="1"
                      disabled={!this.state.Isadmin}
                      onChange={(e) => this.setState({ selectedQuantity: e.target.value })}
                      value={quantity}
                    />
                  </div>

                  {/* Row 3: Instrument & Tolerance Type */}
                  <div className="form-field">
                    <label className="field-label">Instrument</label>
                    <select
                      id="units_serial"
                      className="field-input"
                      disabled={!this.state.Isadmin}
                      value={type_unit}
                      onChange={(e) => this.setState({ selectedSerial_No: e.target.value })}
                    >
                      <option value="">--Select Serial No--</option>
                      {InstrumentSerials.map((item, i) => (
                        <option key={i} value={item.Name}>{item.Name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="field-label">Tolerance Type</label>
                    <select
                      id="cmbTolerance"
                      className="field-input"
                      disabled={!this.state.Isadmin}
                      value={this.state.selectedTolerance}
                      onChange={this.handleDropdownChange}
                    >
                      <option value="">--Select--</option>
                      {cmbTolerance.map((item, i) => (
                        <option key={i} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4: Characteristics */}
                  <div className="form-field">
                    <label className="field-label">Characteristics</label>
                    <div className="field-input-wrapper">
                      <select
                        id="characteristics"
                        className="field-input"
                        disabled={!this.state.Isadmin}
                        defaultValue={type_characteristics}
                        onChange={(e) => this.setState({ Characteristics: e.target.value })}
                      >
                        <option value="">--Select--</option>
                        {cmbcharacteristics.map((item, i) => (
                          <option key={i} value={item.characteristics}>{item.characteristics}</option>
                        ))}
                        <option value="Others">Others</option>
                      </select>
                      {this.state.Isadmin && (
                        <button className="btn-add-new"
                          onClick={() => this.setState({ showAddCharacteristic: !this.state.showAddCharacteristic, newCharacteristicText: "" })}>
                          + Add
                        </button>
                      )}
                    </div>
                    {this.state.showAddCharacteristic && (
                      <div className="add-inline-form">
                        <input type="text" placeholder="New characteristic..."
                          value={this.state.newCharacteristicText}
                          onChange={(e) => this.setState({ newCharacteristicText: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("btn_save_char")?.click(); } }} />
                        <button id="btn_save_char" className="btn-save-inline"
                          disabled={!this.state.newCharacteristicText.trim()}
                          onClick={async () => {
                            const val = this.state.newCharacteristicText.trim();
                            if (!val) return;
                            try {
                              const result = await this.insertCharacteristic(val);
                              if (result && result.characteristicsList) {
                                useStore.setState({ Characteristics: result.characteristicsList });
                                this.setState({ cmbcharacteristics: result.characteristicsList, Characteristics: val, showAddCharacteristic: false, newCharacteristicText: "" });
                                Swal.fire({ title: "Added", text: `"${val}" added successfully.`, icon: "success", timer: 1500, showConfirmButton: false });
                              }
                            } catch (err) { Swal.fire({ title: "Error", text: err.message, icon: "error" }); }
                          }}>Save</button>
                        <button className="btn-cancel-inline"
                          onClick={() => this.setState({ showAddCharacteristic: false, newCharacteristicText: "" })}>Cancel</button>
                      </div>
                    )}
                  </div>
                  <div className="form-field">
                    {this.state.Characteristics === "Others" && (
                      <>
                        <label className="field-label">Custom Characteristic</label>
                        <input
                          id="CharacteristicsUser"
                          className="field-input ims-cell--math"
                          type="text"
                          value={this.state.characteristicText}
                          onChange={(e) => this.setState({ characteristicText: e.target.value })}
                          readOnly={!this.state.Isadmin}
                          disabled={!this.state.Isadmin}
                        />
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="section-divider"></div>

                  {/* Row 5: Specification (full width) */}
                  <div className="form-field full-width">
                    <label className="field-label">Specification</label>
                    <div className="field-input-wrapper" style={{ alignItems: "flex-start" }}>
                      <textarea
                        id="Specification"
                        className="field-input ims-cell--math"
                        rows={2}
                        readOnly={!this.state.Isadmin}
                        disabled={!this.state.Isadmin}
                        onChange={(e) => {
                          this.setState({ Specification: e.target.value, popSpecification: e.target.value, pTolerance: "", mTolerance: "" });
                          this.autoPopulateDetails(e);
                        }}
                        value={spec}
                      ></textarea>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <button
                          className="btn-gdt"
                          disabled={!this.state.Isadmin}
                          onClick={this.toggleNested}
                          type="button"
                        >GDT</button>
                        {!this.state.Isadmin && (
                          <button
                            className="btn-actual-input"
                            onClick={this.toggleActualPopup}
                            type="button"
                          >Actual Input</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="section-divider"></div>

                  {/* Row 6: Tolerances */}
                  <div className="form-field">
                    <label className="field-label">+ Tolerance</label>
                    <input
                      id="pTolerance"
                      className="field-input"
                      type="text"
                      disabled={!this.state.Isadmin}
                      onChange={(e) => this.setState({ pTolerance: e.target.value })}
                      onBlur={(e) => this.autoPopulateDetails(e)}
                      value={plusTolerance}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">- Tolerance</label>
                    <input
                      id="mTolerance"
                      className="field-input"
                      type="text"
                      disabled={!this.state.Isadmin}
                      onBlur={(e) => this.autoPopulateDetails(e)}
                      onChange={(e) => this.setState({ mTolerance: e.target.value })}
                      value={minusTolerance}
                    />
                  </div>

                  {/* Row 7: Max/Min Values */}
                  <div className="form-field">
                    <label className="field-label">Max Value</label>
                    <input
                      id="maxValue"
                      className="field-input"
                      type="number"
                      min="0"
                      step=".01"
                      disabled={!this.state.Isadmin}
                      onChange={(e) => this.setState({ maxValue: e.target.value })}
                      value={maxValue}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Min Value</label>
                    <input
                      id="minValue"
                      className="field-input"
                      type="number"
                      min="0"
                      disabled={!this.state.Isadmin}
                      step={this.state.dynamicMinStepValue}
                      onChange={(e) => this.setState({ minValue: e.target.value })}
                      value={minValue}
                    />
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* <Draggable
                        cancel=".fieldmove"
                        handle=".handlesub"
                        defaultPosition={{ x: 0, y: 0 }}
                        scale={1}
                        bounds={{ left: - window.innerWidth / 2, top: - window.innerHeight / 2, right: window.innerWidth / 2, bottom: window.innerHeight / 2 }}
                    >
                    */}

          <Modal
            isOpen={this.state.nestedModal}
            toggle={this.toggleNested}
            onClosed={this.state.closeAll ? this.toggle : undefined}
            backdrop={false} // {this.state.backdrop}
            keyboard={false}
            style={{
              maxWidth: "55vw",
              width: "100%",
              touchAction: "none",
              transform: `translate(${SubtranslateX}px, ${SubtranslateY}px)`,
            }}
            centered={true}
          >
            <ModalHeader
              className="p-1 justify-content-center handlesub"
              onMouseDown={(e) => this.handleSubStart(e)}
              onTouchStart={(e) => this.handleSubStart(e)}
            >
              GDT Data Input
            </ModalHeader>
            <ModalBody className="pb-0">
              <Tabs>
                <TabList>
                  <Tab>Numeric</Tab>
                  <Tab>Symbols</Tab>
                  <Tab>Symbols 2</Tab>
                  <Tab>Tolerance</Tab>
                </TabList>

                <TabPanel>
                  <Table bordered size="sm" className="ag-cell--math tablec">
                    <thead></thead>
                    <tbody>
                      <tr>
                        <td
                          data-value={"0"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"0"}
                        </td>
                        <td
                          data-value={"1"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"1"}
                        </td>
                        <td
                          data-value={"2"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"2"}
                        </td>
                        <td
                          data-value={"3"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"3"}
                        </td>
                        <td
                          data-value={"4"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"4"}
                        </td>
                        <td
                          data-value={"5"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"5"}
                        </td>
                        <td
                          data-value={"6"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"6"}
                        </td>
                        <td
                          data-value={"7"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"7"}
                        </td>
                        <td
                          data-value={"8"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"8"}
                        </td>
                        <td
                          data-value={"9"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"9"}
                        </td>
                        <td
                          data-value={"+"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"+"}
                        </td>
                        <td
                          data-value={"-"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"-"}
                        </td>
                      </tr>
                      <tr>
                        <td
                          data-value={"."}
                          onClick={this.onButtonClickHandler}
                        >
                          {"."}
                        </td>
                        <td
                          data-value={"%"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"%"}
                        </td>
                        <td
                          data-value={"$"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"$"}
                        </td>
                        <td
                          data-value={"#"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"#"}
                        </td>
                        <td
                          data-value={"*"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"*"}
                        </td>
                        <td
                          data-value={"("}
                          onClick={this.onButtonClickHandler}
                        >
                          {"("}
                        </td>
                        <td
                          data-value={")"}
                          onClick={this.onButtonClickHandler}
                        >
                          {")"}
                        </td>
                        <td
                          data-value={"!"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"!"}
                        </td>
                        <td
                          data-value={"^"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"^"}
                        </td>
                        <td
                          data-value={"["}
                          onClick={this.onButtonClickHandler}
                        >
                          {"["}
                        </td>
                        <td
                          data-value={"]"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"]"}
                        </td>
                        <td
                          data-value={"="}
                          onClick={this.onButtonClickHandler}
                        >
                          {"="}
                        </td>
                      </tr>
                      <tr>
                        <td
                          data-value={"{"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"{"}{" "}
                        </td>
                        <td
                          data-value={"}"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"}"}
                        </td>
                        <td
                          data-value={":"}
                          onClick={this.onButtonClickHandler}
                        >
                          {":"}
                        </td>
                        <td
                          data-value={"?"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"?"}
                        </td>
                        <td
                          data-value={"/"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"/"}
                        </td>
                        <td
                          data-value={"\\"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"\\"}
                        </td>
                        <td
                          data-value={"@"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"@"}
                        </td>
                        <td colSpan={5} className="dishover"></td>
                      </tr>
                    </tbody>
                  </Table>
                </TabPanel>
                <TabPanel>
                  <Table bordered size="sm" className="ag-cell--math tablec">
                    <thead></thead>
                    <tbody>
                      <tr>
                        <td
                          data-value={"À"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"À"}
                        </td>
                        <td
                          data-value={"Á"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Á"}
                        </td>
                        <td
                          data-value={"Â"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Â"}
                        </td>
                        <td
                          data-value={"Ã"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ã"}
                        </td>
                        <td
                          data-value={"Ä"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ä"}
                        </td>
                        <td
                          data-value={"Å"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Å"}
                        </td>
                        <td
                          data-value={"Æ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Æ"}
                        </td>
                        <td
                          data-value={"Ç"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ç"}
                        </td>
                        <td
                          data-value={"È"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"È"}
                        </td>
                        <td
                          data-value={"É"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"É"}
                        </td>
                        <td
                          data-value={"Ê"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ê"}
                        </td>
                        <td
                          data-value={"Ë"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ë"}
                        </td>
                        <td
                          data-value={"Ì"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ì"}
                        </td>
                        <td
                          data-value={"Í"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Í"}
                        </td>
                        <td
                          data-value={"Î"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Î"}
                        </td>
                        <td colSpan={1} className="dishover"></td>
                      </tr>
                      <tr>
                        <td
                          data-value={"Ï"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ï"}
                        </td>
                        <td
                          data-value={"Ð"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ð"}
                        </td>
                        <td
                          data-value={"Ñ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ñ"}
                        </td>
                        <td
                          data-value={"Ò"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ò"}
                        </td>
                        <td
                          data-value={"Ó"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ó"}
                        </td>
                        <td
                          data-value={"Ô"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ô"}
                        </td>
                        <td
                          data-value={"Õ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Õ"}
                        </td>
                        <td
                          data-value={"Ö"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ö"}
                        </td>
                        <td
                          data-value={"×"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"×"}
                        </td>
                        <td
                          data-value={"Ø"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ø"}{" "}
                        </td>
                        <td
                          data-value={"Ù"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ù"}
                        </td>
                        <td className="dishover"></td>
                        <td
                          data-value={"¡"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¡"}
                        </td>
                        <td
                          data-value={"±"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"±"}
                        </td>
                        <td
                          data-value={"°"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"°"}
                        </td>
                        <td colSpan={1} className="dishover"></td>
                      </tr>
                      <tr>
                        <td
                          data-value={"û"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"û"}
                        </td>
                        <td
                          data-value={"è"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"è"}
                        </td>
                        <td
                          data-value={"ç"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ç"}
                        </td>
                        <td
                          data-value={"á"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"á"}
                        </td>
                        <td
                          data-value={"â"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"â"}
                        </td>
                        <td
                          data-value={"ã"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ã"}
                        </td>
                        <td
                          data-value={"å"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"å"}
                        </td>
                        <td
                          data-value={"ä"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ä"}
                        </td>
                        <td
                          data-value={"æ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"æ"}
                        </td>
                        <td
                          data-value={"²"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"²"}
                        </td>
                        <td
                          data-value={"³"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"³"}
                        </td>
                        <td
                          data-value={"ÿ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ÿ"}
                        </td>
                        <td
                          data-value={"–"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"–"}
                        </td>
                        <td
                          data-value={"º"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"º"}
                        </td>
                        <td colSpan={2} className="dishover"></td>
                      </tr>
                      <tr>
                        <td
                          data-value={"ë"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ë"}
                        </td>
                        <td
                          data-value={"ì"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ì"}
                        </td>
                        <td
                          data-value={"í"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"í"}
                        </td>
                        <td
                          data-value={"î"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"î"}
                        </td>
                        <td
                          data-value={"ï"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ï"}
                        </td>
                        <td
                          data-value={"ð"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ð"}
                        </td>
                        <td
                          data-value={"ñ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ñ"}
                        </td>
                        <td
                          data-value={"ò"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ò"}
                        </td>
                        <td
                          data-value={"ó"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ó"}
                        </td>
                        <td
                          data-value={"ô"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ô"}
                        </td>
                        <td
                          data-value={"õ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"õ"}
                        </td>
                        <td
                          data-value={"ö"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ö"}
                        </td>
                        <td
                          data-value={"÷"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"÷"}
                        </td>
                        <td
                          data-value={"ù"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ù"}
                        </td>
                        <td
                          data-value={"ú"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ú"}
                        </td>
                        <td
                          data-value={"ύ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ύ"}
                        </td>
                      </tr>
                      <tr>
                        <td
                          data-value={"é"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"é"}
                        </td>
                        <td
                          data-value={"ê"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ê"}
                        </td>
                        <td
                          data-value={"¹"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¹"}
                        </td>
                        <td
                          data-value={"¶"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¶"}
                        </td>
                        <td
                          data-value={"χ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"χ"}
                        </td>
                        <td className="dishover"></td>
                        <td
                          data-value={"à"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"à"}
                        </td>
                        <td
                          data-value={"•"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"•"}
                        </td>
                        <td className="dishover"></td>
                        <td
                          data-value={"ß"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ß"}
                        </td>
                        <td
                          data-value={"Þ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Þ"}
                        </td>
                        <td
                          data-value={"Ý"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ý"}
                        </td>
                        <td
                          data-value={"…"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"…"}
                        </td>
                        <td
                          data-value={"ž"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ž"}
                        </td>
                        <td
                          data-value={"Ÿ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ÿ"}
                        </td>
                        <td colSpan={1} className="dishover"></td>
                      </tr>
                    </tbody>
                  </Table>
                </TabPanel>
                <TabPanel>
                  <Table bordered size="sm" className="ag-cell--math tablec">
                    <thead></thead>
                    <tbody>
                      <tr>
                        <td
                          data-value={"£"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"£"}
                        </td>
                        <td
                          data-value={"¿"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¿"}
                        </td>
                        <td
                          data-value={"¬"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¬"}
                        </td>
                        <td
                          data-value={"Û"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Û"}
                        </td>
                        <td
                          data-value={"Ú"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ú"}
                        </td>
                        <td
                          data-value={"´"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"´"}
                        </td>
                        <td
                          data-value={"»"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"»"}
                        </td>
                        <td
                          data-value={"«"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"«"}
                        </td>
                        <td
                          data-value={"Ё"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ё"}
                        </td>
                        <td
                          data-value={"Ђ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ђ"}
                        </td>
                        <td
                          data-value={"Ѓ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ѓ"}
                        </td>
                        <td
                          data-value={"Є"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Є"}
                        </td>
                        <td
                          data-value={"ω"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ω"}
                        </td>
                        <td
                          data-value={"ϊ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ϊ"}
                        </td>
                      </tr>
                      <tr>
                        <td
                          data-value={"‚"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"‚"}
                        </td>
                        <td
                          data-value={"†"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"†"}
                        </td>
                        <td
                          data-value={"‡"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"‡"}
                        </td>
                        <td
                          data-value={"ˆ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ˆ"}
                        </td>
                        <td
                          data-value={"‰"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"‰"}
                        </td>
                        <td
                          data-value={"┴"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┴"}
                        </td>
                        <td
                          data-value={"‹"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"‹"}
                        </td>
                        <td
                          data-value={"¥"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¥"}
                        </td>
                        <td
                          data-value={"¢"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¢"}
                        </td>
                        <td
                          data-value={"ý"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ý"}
                        </td>
                        <td
                          data-value={"ϋ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ϋ"}
                        </td>
                        <td
                          data-value={"ό"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ό"}
                        </td>
                        <td
                          data-value={"Ѕ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"Ѕ"}
                        </td>
                        <td colSpan={1} className="dishover"></td>
                      </tr>
                      <tr>
                        <td
                          data-value={"‘"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"‘"}
                        </td>
                        <td
                          data-value={"’"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"’"}
                        </td>
                        <td
                          data-value={"“"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"“"}
                        </td>
                        <td
                          data-value={"”"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"”"}
                        </td>
                        <td
                          data-value={"„"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"„"}
                        </td>
                        <td
                          data-value={"¨"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¨"}
                        </td>
                        <td
                          data-value={"¸"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"¸"}
                        </td>
                        <td
                          data-value={"œ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"œ"}
                        </td>
                        <td
                          data-value={"®"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"®"}
                        </td>
                        <td
                          data-value={"˜"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"˜"}
                        </td>
                        <td
                          data-value={"š"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"š"}
                        </td>
                        <td
                          data-value={"ˉ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ˉ"}
                        </td>
                        <td
                          data-value={"ψ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ψ"}
                        </td>
                        <td
                          data-value={"ώ"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"ώ"}
                        </td>
                      </tr>
                      <tr>
                        <td
                          data-value={"─"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"─"}
                        </td>
                        <td
                          data-value={"│"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"│"}
                        </td>
                        <td
                          data-value={"┌"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┌"}
                        </td>
                        <td
                          data-value={"┐"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┐"}
                        </td>
                        <td
                          data-value={"└"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"└"}
                        </td>
                        <td
                          data-value={"┘"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┘"}
                        </td>
                        <td
                          data-value={"├"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"├"}
                        </td>
                        <td
                          data-value={"┤"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┤"}
                        </td>
                        <td
                          data-value={"┬"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┬"}
                        </td>
                        <td
                          data-value={"┴"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┴"}
                        </td>
                        <td
                          data-value={"┼"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"┼"}
                        </td>
                        <td
                          data-value={"═"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"═"}
                        </td>
                        <td
                          data-value={"║"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"║"}
                        </td>
                        <td
                          data-value={"╒"}
                          onClick={this.onButtonClickHandler}
                        >
                          {"╒"}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </TabPanel>
                <TabPanel>
                  <Table size="sm" className="ag-cell--math tablec tolerance">
                    <thead></thead>
                    <tbody>
                      <tr>
                        <td
                          className="dishover"
                          style={{ verticalAlign: "Top" }}
                        >
                          <fieldset>
                            <legend>Symbol</legend>

                            <Input
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              onMouseMove={(e) => {
                                e.stopPropagation();
                              }}
                              onMouseUp={(e) => {
                                e.stopPropagation();
                              }}
                              onFocus={(e) => e.stopPropagation()}
                              className="fieldmove"
                              id="tolerance_symbol"
                              name="tolerance_symbol"
                              type="select"
                              value={tolerance_symbol}
                              onChange={(e) => {
                                this.setState({
                                  tolerance_symbol: e.target.value,
                                });
                              }}
                            >
                              {tol_symbol.map((item, i) => (
                                <option key={i} value={item}>
                                  {item}
                                </option>
                              ))}
                              ;
                            </Input>
                          </fieldset>
                        </td>
                        <td
                          className="dishover"
                          style={{ verticalAlign: "Top" }}
                        >
                          <fieldset>
                            <legend className="m0">Tolerance</legend>
                            <div className="d-flex justify-content-around">
                              <FormGroup check>
                                <Input
                                  id="tolerance_check"
                                  name="tolerance_check"
                                  type="checkbox"
                                  checked={tolerance_check}
                                  onChange={(e) => {
                                    this.setState({
                                      tolerance_check: e.target.checked,
                                    });
                                  }}
                                />{" "}
                                <Label for="tolerance_check" check>
                                  {"ëàí"}
                                </Label>
                              </FormGroup>
                              <Input
                                id="cb_tolerance_1"
                                name="cb_tolerance_1"
                                type="select"
                                value={tolerance_1}
                                onChange={(e) => {
                                  this.setState({
                                    cb_tolerance_1: e.target.value,
                                  });
                                }}
                              >
                                {cb_tolerance_1.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                              <Input
                                id="cb_tolerance_2"
                                name="cb_tolerance_2"
                                type="select"
                                value={tolerance_2}
                                onChange={(e) => {
                                  this.setState({
                                    cb_tolerance_2: e.target.value,
                                  });
                                }}
                              >
                                {cb_tolerance_2.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                            </div>
                          </fieldset>
                        </td>
                        <td
                          className="dishover"
                          style={{ verticalAlign: "Top" }}
                        >
                          <fieldset>
                            <legend>Datums</legend>
                            <div className="d-flex  mb-2 justify-content-around">
                              <Input
                                id="tolerance_datumsA"
                                name="tolerance_datumsA"
                                type="select"
                                value={datum_a}
                                onChange={(e) => {
                                  this.setState({ cb_datum_a: e.target.value });
                                }}
                              >
                                {cb_datum_a.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                              <Input
                                id="tolerance_datums1"
                                name="tolerance_datums1"
                                type="select"
                                value={datum_1}
                                onChange={(e) => {
                                  this.setState({ cb_datum_1: e.target.value });
                                }}
                              >
                                {cb_datum_1.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                            </div>

                            <div className="d-flex  mb-2 justify-content-around">
                              <Input
                                id="tolerance_datumsB"
                                name="tolerance_datumsB"
                                type="select"
                                value={datum_b}
                                onChange={(e) => {
                                  this.setState({ cb_datum_b: e.target.value });
                                }}
                              >
                                {cb_datum_a.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                              <Input
                                id="tolerance_datums2"
                                name="tolerance_datums2"
                                type="select"
                                value={datum_2}
                                onChange={(e) => {
                                  this.setState({ cb_datum_2: e.target.value });
                                }}
                              >
                                {cb_datum_1.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                            </div>

                            <div className="d-flex mb-2 justify-content-around">
                              <Input
                                id="tolerance_datumsC"
                                name="tolerance_datumsC"
                                type="select"
                                value={datum_c}
                                onChange={(e) => {
                                  this.setState({ cb_datum_c: e.target.value });
                                }}
                              >
                                {cb_datum_a.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                              <Input
                                id="tolerance_datums3"
                                name="tolerance_datums3"
                                type="select"
                                value={datum_3}
                                onChange={(e) => {
                                  this.setState({ cb_datum_3: e.target.value });
                                }}
                              >
                                {cb_datum_1.map((item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ))}
                                ;
                              </Input>
                            </div>
                          </fieldset>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                  <div className="d-flex mb-2 justify-content-around">
                    <Button
                      color="light-btn btn buttons primary primary_hover "
                      onClick={this.addSpecification}
                    >
                      Insert
                    </Button>
                  </div>
                </TabPanel>
              </Tabs>

              <Table striped hover borderless className="popSpecification">
                <thead></thead>
                <tbody>
                  <tr>
                    <td>
                      <Input
                        id="gdt_input"
                        name="gdt_input"
                        type="textarea"
                        rows={5}
                        className="ims-cell--math gdt_input"
                        style={{ fontSize: "14px", backgroundColor: "#fff" }}
                        onSelect={this.handleSelect}
                        onChange={(e) => {
                          this.setState({ popSpecification: e.target.value });
                        }}
                        value={nspec}
                      ></Input>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </ModalBody>
            <ModalFooter className="handlesub">
              <Button
                color="light-btn btn buttons secondary"
                onClick={this.toggleAll}
              >
                Cancel
              </Button>
              {"   "}
              <Button
                color="light-btn btn buttons primary primary_hover "
                onClick={this.saveSpecification}
              >
                Update
              </Button>
            </ModalFooter>
          </Modal>

          {/* </Draggable> */}

          {/* <Draggable
                        cancel=".fieldmove"
                        handle=".handleactualPopup"
                        defaultPosition={{ x: 0, y: 0 }}
                        scale={1}
                        bounds={{ left: - window.innerWidth / 2, top: - window.innerHeight / 2, right: window.innerWidth / 2, bottom: window.innerHeight / 2 }}
                    > */}

          <Modal
            isOpen={this.state.actualPopup}
            toggle={this.toggleNested}
            onClosed={this.state.closeAll ? this.toggle : undefined}
            backdrop={false} // {this.state.backdrop}
            keyboard={false}
            style={{
              maxWidth: "48vw",
              width: "100%",
              touchAction: "none",
              transform: `translate(${PopuptranslateX}px, ${PopuptranslateY}px)`,
            }}
            centered={true}
          >
            <div
              className="modal-header handleactualPopup"
              style={{ border: "0px solid #ced4da" }}
              onMouseDown={(e) => this.handlePopupStart(e)}
              onTouchStart={(e) => this.handlePopupStart(e)}
            >
              <h2>
                Balloon No: {parseInt(this.props.selectedBalloon).toString()}
              </h2>
              {typeTolerance.toString() !== "3" && (
                <>
                  <p className="primary primary_hover p-1">Max: {maxValue}</p>
                  <p className="primary primary_hover p-1">Min: {minValue}</p>
                </>
              )}

              <div>
                <Button
                  color="light"
                  onClick={this.onHideactualPopup}
                  className="light-btn p-0"
                >
                  <CloseFill className="icon"></CloseFill>
                </Button>
              </div>
            </div>

            <ModalBody
              className="pb-0"
              style={{ overflowY: "auto", border: "0px solid #ced4da" }}
            >
              <Form id="renderActualField">
                {this.state.actualPopup && (
                  <>
                    <div key="actual_render" id="actual_render">
                      <Accordion
                        id="accordionPanelsStayOpenExample"
                        key="accordionPanelsStayOpenExample"
                        defaultActiveKey={0}
                      >
                        {this.state.selectedTolerance.toString() === "3" ? (
                          <>
                            {this.state.selectedQuantity > 1 &&
                              Object.keys(groupedData).map((key, i) => (
                                <>
                                  <Accordion.Item
                                    key={`${key.toString()}_accordion-item`}
                                    id={`${key.toString()}_accordion-item`}
                                    eventKey={i}
                                  >
                                    <h2
                                      className="accordion-header"
                                      key={`${groupedData[
                                        key
                                      ][0].id.toString()}_panelsStayOpen`}
                                      id={`${groupedData[
                                        key
                                      ][0].id.toString()}_panelsStayOpen`}
                                    >
                                      <Accordion.Button
                                        key={`${groupedData[
                                          key
                                        ][0].id.toString()}_accordion`}
                                        id={`${groupedData[
                                          key
                                        ][0].id.toString()}_accordion`}
                                        onClick={() => {
                                          // console.log("Attribute", key);
                                          if (i !== 0)
                                            this.handleAccordionToggle(i);
                                        }}
                                      >
                                        {"Balloon # " +
                                          key.replaceAll("_", ".").toString()}
                                      </Accordion.Button>
                                    </h2>

                                    {expandedIndex === i && (
                                      <>
                                        <Accordion.Body
                                          className={
                                            "accordion-collapse collapse show"
                                          }
                                          key={`${key.toString()}_accordion_item`}
                                          id={`${key.toString()}_accordion_item`}
                                        >
                                          {groupedData[key].map((item) => (
                                            <>
                                              <div
                                                key={`${item.id.toString()}_accordion_item`}
                                                id={`${item.id.toString()}_accordion_item`}
                                              >
                                                <Label
                                                  key={`${item.id.toString()}_accordion_item_label`}
                                                  id={`${item.id.toString()}_accordion_item_label`}
                                                  className="apW"
                                                >
                                                  {item.value.replaceAll(
                                                    key,
                                                    ""
                                                  )}
                                                </Label>
                                                <InputGroup
                                                  key={`${item.id.toString()}_accordion_item_group`}
                                                  id={`${item.id.toString()}_accordion_item_group`}
                                                  className="mb-2"
                                                  style={{
                                                    flexWrap: "nowrap",
                                                    gap: "10px",
                                                    justifyContent:
                                                      "space-around",
                                                  }}
                                                >
                                                  {item.elements.map(
                                                    (element) => {
                                                      //console.log(  this.state.ActualDecision)
                                                      let this_decision =
                                                        this.state
                                                          .ActualDecision[
                                                          element.sub
                                                        ][element.Qty][
                                                          element.label
                                                        ].Decision;
                                                      let this_value =
                                                        this.state
                                                          .ActualDecision[
                                                          element.sub
                                                        ][element.Qty][
                                                          element.label
                                                        ].Actual;

                                                      // console.log(element, parseFloat(Min), parseFloat(Max), this.state.ActualDecision)
                                                      const getClassName = (
                                                        this_decision
                                                      ) => {
                                                        if (
                                                          this_decision === ""
                                                        )
                                                          return "ims-cell--math";
                                                        if (
                                                          this_decision === true
                                                        )
                                                          return "ims-cell--math bg-success text-white";
                                                        if (
                                                          this_decision ===
                                                          false
                                                        )
                                                          return "ims-cell--math bg-danger text-white";
                                                        return "ims-cell--math";
                                                      };
                                                      let disabled_permission =
                                                        this.props.user[0].permission.includes(
                                                          "add_actual_value"
                                                        );
                                                      let role =
                                                        this.props.user[0].role;
                                                      let disabled_role =
                                                        this.props.roles.includes(
                                                          role
                                                        );
                                                      let disabled =
                                                        disabled_permission &&
                                                        ((disabled_role &&
                                                          element.label ===
                                                            "OP") ||
                                                          (disabled_role &&
                                                            element.label ===
                                                              "LI") ||
                                                          (disabled_role &&
                                                            element.label ===
                                                              "Final"));
                                                      // console.log(disabled_permission, disabled_role, role, element.label)
                                                      return (
                                                        <>
                                                          <InputGroupText
                                                            key={`${element.id.toString()}_gtext`}
                                                            id={`${element.id.toString()}_gtext`}
                                                            style={{
                                                              display: "flex",
                                                              flexWrap:
                                                                "nowrap",
                                                              gap: "10px",
                                                              pointerEvents:
                                                                disabled
                                                                  ? ""
                                                                  : "none",
                                                              backgroundColor:
                                                                !disabled
                                                                  ? "#e9ecef"
                                                                  : "#e9ecef",
                                                              border: !disabled
                                                                ? "1px"
                                                                : "1px solid",
                                                            }}
                                                          >
                                                            <Label
                                                              key={`${element.id.toString()}_glabel`}
                                                              id={`${element.id.toString()}_glabel`}
                                                              className="apW mb-0"
                                                            >
                                                              {element.label}
                                                            </Label>

                                                            <DynamicRadioInputs
                                                              key={element.id}
                                                              id={element.id}
                                                              element={element}
                                                              disabled={
                                                                disabled
                                                                  ? false
                                                                  : true
                                                              }
                                                              value={this_value}
                                                              className={getClassName(
                                                                this_decision
                                                              )}
                                                              this_decision={
                                                                this_decision
                                                              }
                                                              onChange={
                                                                this
                                                                  .handleRadioInputChange
                                                              }
                                                            />
                                                          </InputGroupText>
                                                        </>
                                                      );
                                                    }
                                                  )}
                                                </InputGroup>
                                              </div>
                                            </>
                                          ))}
                                        </Accordion.Body>
                                      </>
                                    )}
                                  </Accordion.Item>
                                </>
                              ))}

                            {this.state.selectedQuantity === 1 &&
                              groups.map((group, i) => (
                                <>
                                  {!group.collapse && (
                                    <>
                                      <Label
                                        key={`${group.id.toString()}_accordion_item_label`}
                                        id={`${group.id.toString()}_accordion_item_label`}
                                        className="apW"
                                      >
                                        {group.value}
                                      </Label>
                                      <div
                                        key={`${group.id.toString()}_accordion_item_group`}
                                        id={`${group.id.toString()}_accordion_item_group`}
                                        className="mb-2"
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-around",
                                          flexWrap: "nowrap",
                                          gap: "10px",
                                        }}
                                      >
                                        {group.elements.map((element) => {
                                          //console.log(  this.state.ActualDecision)
                                          let this_decision =
                                            this.state.ActualDecision[
                                              element.sub
                                            ][element.Qty][element.label]
                                              .Decision;
                                          let this_value =
                                            this.state.ActualDecision[
                                              element.sub
                                            ][element.Qty][element.label]
                                              .Actual;

                                          // console.log(element, parseFloat(Min), parseFloat(Max), this.state.ActualDecision)
                                          const getClassName = (
                                            this_decision
                                          ) => {
                                            if (this_decision === "")
                                              return "ims-cell--math";
                                            if (this_decision === true)
                                              return "ims-cell--math bg-success text-white";
                                            if (this_decision === false)
                                              return "ims-cell--math bg-danger text-white";
                                            return "ims-cell--math";
                                          };
                                          let disabled_permission =
                                            this.props.user[0].permission.includes(
                                              "add_actual_value"
                                            );
                                          let role = this.props.user[0].role;
                                          let disabled_role =
                                            this.props.roles.includes(role);
                                          let disabled =
                                            disabled_permission &&
                                            ((disabled_role &&
                                              element.label === "OP") ||
                                              (disabled_role &&
                                                element.label === "LI") ||
                                              (disabled_role &&
                                                element.label === "Final"));
                                          //  console.log(disabled_permission, disabled_role, role, element.label)
                                          return (
                                            <>
                                              <InputGroupText
                                                key={`${element.id.toString()}_accordion_item_grouptext`}
                                                id={`${element.id.toString()}_accordion_item_grouptext`}
                                                style={{
                                                  display: "flex",
                                                  flexWrap: "nowrap",
                                                  gap: "10px",
                                                  pointerEvents: disabled
                                                    ? ""
                                                    : "none",
                                                  backgroundColor: !disabled
                                                    ? "#e9ecef"
                                                    : "#e9ecef",
                                                  border: !disabled
                                                    ? "1px "
                                                    : "1px solid",
                                                }}
                                              >
                                                <Label
                                                  key={`${element.id.toString()}_accordion_item_grouplabel`}
                                                  id={`${element.id.toString()}_accordion_item_grouplabel`}
                                                  className="apW mb-0"
                                                >
                                                  {element.label}
                                                </Label>

                                                <DynamicRadioInputs
                                                  key={element.id}
                                                  id={element.id}
                                                  element={element}
                                                  disabled={
                                                    disabled ? false : true
                                                  }
                                                  value={this_value}
                                                  className={getClassName(
                                                    this_decision
                                                  )}
                                                  this_decision={this_decision}
                                                  onChange={
                                                    this.handleRadioInputChange
                                                  }
                                                />
                                              </InputGroupText>
                                            </>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </>
                              ))}
                          </>
                        ) : (
                          <>
                            {this.state.selectedQuantity > 1 &&
                              Object.keys(groupedData).map((key, i) => (
                                <>
                                  <Accordion.Item
                                    key={`${key.toString()}_accordion-item`}
                                    id={`${key.toString()}_accordion-item`}
                                    eventKey={i}
                                  >
                                    <h2
                                      className="accordion-header"
                                      key={`${groupedData[
                                        key
                                      ][0].id.toString()}_panelsStayOpen`}
                                      id={`${groupedData[
                                        key
                                      ][0].id.toString()}_panelsStayOpen`}
                                    >
                                      <Accordion.Button
                                        key={`${groupedData[
                                          key
                                        ][0].id.toString()}_accordion`}
                                        id={`${groupedData[
                                          key
                                        ][0].id.toString()}_accordion`}
                                        onClick={() => {
                                          // console.log("default",key);
                                          if (i !== 0)
                                            this.handleAccordionToggle(i);
                                        }}
                                      >
                                        {"Balloon # " +
                                          key.replaceAll("_", ".").toString()}
                                      </Accordion.Button>
                                    </h2>

                                    {(i === 0 || expandedIndex === i) && (
                                      <>
                                        <Accordion.Body
                                          className={
                                            "accordion-collapse collapse show"
                                          }
                                          key={`${key.toString()}_accordion_item`}
                                          id={`${key.toString()}_accordion_item`}
                                        >
                                          {groupedData[key].map((item) => (
                                            <>
                                              <div
                                                key={`${item.id.toString()}_accordion_item`}
                                                id={`${item.id.toString()}_accordion_item`}
                                              >
                                                <Label
                                                  key={`${item.id.toString()}_accordion_item_label`}
                                                  id={`${item.id.toString()}_accordion_item_label`}
                                                  className="apW"
                                                >
                                                  {item.value.replaceAll(
                                                    key,
                                                    ""
                                                  )}
                                                </Label>
                                                <InputGroup
                                                  key={`${item.id.toString()}_accordion_item_group`}
                                                  id={`${item.id.toString()}_accordion_item_group`}
                                                  className="mb-2"
                                                  style={{
                                                    flexWrap: "nowrap",
                                                    gap: "10px",
                                                  }}
                                                >
                                                  {item.elements.map(
                                                    (element) => {
                                                      //console.log(  this.state.ActualDecision)
                                                      let this_decision =
                                                        this.state
                                                          .ActualDecision[
                                                          element.sub
                                                        ][element.Qty][
                                                          element.label
                                                        ].Decision;
                                                      let this_value =
                                                        this.state
                                                          .ActualDecision[
                                                          element.sub
                                                        ][element.Qty][
                                                          element.label
                                                        ].Actual;
                                                      let Balloon = parseFloat(
                                                        element.Balloon
                                                      );
                                                      let Min = "0";
                                                      let Max = "0";
                                                      const state =
                                                        useStore.getState();
                                                      let originalRegions =
                                                        state.originalRegions;
                                                      originalRegions.map(
                                                        (item) => {
                                                          if (
                                                            item.Balloon.toString() ===
                                                            Balloon.toString()
                                                          ) {
                                                            Min = item.Minimum;
                                                            Max = item.Maximum;
                                                          }
                                                          return item;
                                                        }
                                                      );

                                                      let dynamicStepValue = [];
                                                      if (
                                                        Min !== "" &&
                                                        Max !== ""
                                                      ) {
                                                        const minPlaces = (
                                                          parseFloat(Min)
                                                            .toString()
                                                            .split(".")[1] || []
                                                        ).length;
                                                        const maxPlaces = (
                                                          parseFloat(Max)
                                                            .toString()
                                                            .split(".")[1] || []
                                                        ).length;
                                                        let decimalPlaces =
                                                          Math.max(
                                                            minPlaces,
                                                            maxPlaces
                                                          );

                                                        dynamicStepValue.push(
                                                          "."
                                                        );
                                                        for (
                                                          let j = 0;
                                                          j < decimalPlaces;
                                                          j++
                                                        ) {
                                                          dynamicStepValue.push(
                                                            "0"
                                                          );
                                                        }
                                                        dynamicStepValue.push(
                                                          "1"
                                                        );
                                                      }
                                                      // console.log(element, parseFloat(Min), parseFloat(Max), this.state.ActualDecision)
                                                      const getClassName = (
                                                        this_decision
                                                      ) => {
                                                        if (
                                                          this_decision === ""
                                                        )
                                                          return "ims-cell--math";
                                                        if (
                                                          this_decision === true
                                                        )
                                                          return "ims-cell--math bg-success text-white";
                                                        if (
                                                          this_decision ===
                                                          false
                                                        )
                                                          return "ims-cell--math bg-danger text-white";
                                                        return "ims-cell--math";
                                                      };
                                                      let disabled_permission =
                                                        this.props.user[0].permission.includes(
                                                          "add_actual_value"
                                                        );
                                                      let role =
                                                        this.props.user[0].role;
                                                      let disabled_role =
                                                        this.props.roles.includes(
                                                          role
                                                        );
                                                      let disabled =
                                                        disabled_permission &&
                                                        ((disabled_role &&
                                                          element.label ===
                                                            "OP") ||
                                                          (disabled_role &&
                                                            element.label ===
                                                              "LI") ||
                                                          (disabled_role &&
                                                            element.label ===
                                                              "Final"));
                                                      // console.log(disabled_permission, disabled_role, role, element.label)
                                                      return (
                                                        <>
                                                          <InputGroupText
                                                            key={`${element.id.toString()}_gtext`}
                                                            id={`${element.id.toString()}_gtext`}
                                                            style={{
                                                              display: "flex",
                                                              flexWrap:
                                                                "nowrap",
                                                              gap: "10px",
                                                            }}
                                                          >
                                                            <Label
                                                              key={`${element.id.toString()}_glabel`}
                                                              id={`${element.id.toString()}_glabel`}
                                                              className="apW mb-0"
                                                            >
                                                              {element.label}
                                                            </Label>

                                                            <CopyPasteInput
                                                              key={element.id}
                                                              id={element.id}
                                                              step={dynamicStepValue.join(
                                                                ""
                                                              )}
                                                              element={element}
                                                              disabled={
                                                                disabled
                                                                  ? false
                                                                  : true
                                                              }
                                                              // defaultValue={this_value}
                                                              value={this_value}
                                                              focusedInput={
                                                                this.state
                                                                  .focusedInput
                                                              }
                                                              className={getClassName(
                                                                this_decision
                                                              )}
                                                              showPopup={true}
                                                              onChange={
                                                                this
                                                                  .handleInputChange
                                                              }
                                                              onChangeClear={
                                                                this
                                                                  .handleInputClear
                                                              }
                                                              handleCopy={
                                                                this.handleCopy
                                                              }
                                                              clipboardContent={
                                                                this.state
                                                                  .clipboardContent
                                                              }
                                                              onFocus={
                                                                this.handleFocus
                                                              }
                                                              onFocusOut={
                                                                this
                                                                  .handleFocusOut
                                                              }
                                                            />
                                                          </InputGroupText>
                                                        </>
                                                      );
                                                    }
                                                  )}
                                                </InputGroup>
                                              </div>
                                            </>
                                          ))}
                                        </Accordion.Body>
                                      </>
                                    )}
                                  </Accordion.Item>
                                </>
                              ))}

                            {this.state.selectedQuantity === 1 &&
                              groups.map((group, i) => (
                                <>
                                  {!group.collapse && (
                                    <>
                                      <Label
                                        key={`${group.id.toString()}_accordion_item_label`}
                                        id={`${group.id.toString()}_accordion_item_label`}
                                        className="apW"
                                      >
                                        {group.value}
                                      </Label>
                                      <InputGroup
                                        key={`${group.id.toString()}_accordion_item_group`}
                                        id={`${group.id.toString()}_accordion_item_group`}
                                        className="mb-2"
                                        style={{
                                          flexWrap: "nowrap",
                                          gap: "10px",
                                        }}
                                      >
                                        {group.elements.map((element) => {
                                          //console.log(  this.state.ActualDecision)
                                          let this_decision =
                                            this.state.ActualDecision[
                                              element.sub
                                            ][element.Qty][element.label]
                                              .Decision;
                                          let this_value =
                                            this.state.ActualDecision[
                                              element.sub
                                            ][element.Qty][element.label]
                                              .Actual;
                                          let Balloon = parseFloat(
                                            element.Balloon
                                          );
                                          let Min = "";
                                          let Max = "";
                                          const state = useStore.getState();
                                          let originalRegions =
                                            state.originalRegions;
                                          originalRegions.map((item) => {
                                            if (
                                              item.Balloon.toString() ===
                                              Balloon.toString()
                                            ) {
                                              Min = item.Minimum;
                                              Max = item.Maximum;
                                            }
                                            return item;
                                          });

                                          let dynamicStepValue = [];
                                          if (Min !== "" && Max !== "") {
                                            const minPlaces = (
                                              parseFloat(Min)
                                                .toString()
                                                .split(".")[1] || []
                                            ).length;
                                            const maxPlaces = (
                                              parseFloat(Max)
                                                .toString()
                                                .split(".")[1] || []
                                            ).length;
                                            let decimalPlaces = Math.max(
                                              minPlaces,
                                              maxPlaces
                                            );

                                            dynamicStepValue.push(".");
                                            for (
                                              let j = 0;
                                              j < decimalPlaces;
                                              j++
                                            ) {
                                              dynamicStepValue.push("0");
                                            }
                                            dynamicStepValue.push("1");
                                          }
                                          // console.log(element, parseFloat(Min), parseFloat(Max), this.state.ActualDecision)
                                          const getClassName = (
                                            this_decision
                                          ) => {
                                            if (this_decision === "")
                                              return "ims-cell--math";
                                            if (this_decision === true)
                                              return "ims-cell--math bg-success text-white";
                                            if (this_decision === false)
                                              return "ims-cell--math bg-danger text-white";
                                            return "ims-cell--math";
                                          };
                                          let disabled_permission =
                                            this.props.user[0].permission.includes(
                                              "add_actual_value"
                                            );
                                          let role = this.props.user[0].role;
                                          let disabled_role =
                                            this.props.roles.includes(role);
                                          let disabled =
                                            disabled_permission &&
                                            ((disabled_role &&
                                              element.label === "OP") ||
                                              (disabled_role &&
                                                element.label === "LI") ||
                                              (disabled_role &&
                                                element.label === "Final"));
                                          //  console.log(disabled_permission, disabled_role, role, element.label)
                                          return (
                                            <>
                                              <InputGroupText
                                                key={`${element.id.toString()}_accordion_item_grouptext`}
                                                id={`${element.id.toString()}_accordion_item_grouptext`}
                                                style={{
                                                  display: "flex",
                                                  flexWrap: "nowrap",
                                                  gap: "10px",
                                                }}
                                              >
                                                <Label
                                                  key={`${element.id.toString()}_accordion_item_grouplabel`}
                                                  id={`${element.id.toString()}_accordion_item_grouplabel`}
                                                  className="apW mb-0"
                                                >
                                                  {element.label}
                                                </Label>

                                                <CopyPasteInput
                                                  key={element.id}
                                                  id={element.id}
                                                  step={dynamicStepValue.join(
                                                    ""
                                                  )}
                                                  element={element}
                                                  disabled={
                                                    disabled ? false : true
                                                  }
                                                  // defaultValue={this_value}
                                                  value={this_value}
                                                  focusedInput={
                                                    this.state.focusedInput
                                                  }
                                                  className={getClassName(
                                                    this_decision
                                                  )}
                                                  showPopup={true}
                                                  onChange={
                                                    this.handleInputChange
                                                  }
                                                  onChangeClear={
                                                    this.handleInputClear
                                                  }
                                                  handleCopy={this.handleCopy}
                                                  clipboardContent={
                                                    this.state.clipboardContent
                                                  }
                                                  onFocus={this.handleFocus}
                                                  onFocusOut={
                                                    this.handleFocusOut
                                                  }
                                                />
                                              </InputGroupText>
                                            </>
                                          );
                                        })}
                                      </InputGroup>
                                    </>
                                  )}
                                </>
                              ))}
                          </>
                        )}
                      </Accordion>
                    </div>
                  </>
                )}
              </Form>
            </ModalBody>
            <ModalFooter
              className="handleactualPopup border-top-0"
              style={{ border: "0px solid #ced4da" }}
            ></ModalFooter>
          </Modal>

          {/* </Draggable> */}
          {/* </Draggable > */}
        </>
      );
    } else {
      return <div />;
    }
  }
}
export default PopupModal;
