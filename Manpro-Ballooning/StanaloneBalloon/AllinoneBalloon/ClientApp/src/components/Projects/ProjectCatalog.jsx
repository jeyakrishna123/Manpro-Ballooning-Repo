import React from 'react';
import { Navigate } from 'react-router-dom';
import { config, seo, showAlert } from '../Common/Common';
import useStore from "./../Store/store";
import axios from "axios";
import { ReactComponent as Grid } from "../../assets/grid.svg";
import { ReactComponent as List } from "../../assets/List.svg";
import {  Button,  Input, Form,  Label } from "reactstrap";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Swal from 'sweetalert2';

class Product extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            font: this.props.font,
            contextMenuVisible: false,
            selectedItem: null,
            props:null
        }
        this.contextMenuRef = React.createRef();
    }

    handleBlock = (e) => {
        e.preventDefault();
        let state = useStore.getState();
       // console.log(e.target.dataset)
        let send = e.target.dataset.value;
        let isClosed = e.target.dataset.isclosed === 'true' ? "Unblock" : "Block";
        let title = e.target.dataset.title;
        Swal.fire({
            title: `Do you want to ${isClosed} ${title} ?`,
            showCancelButton: true,
            confirmButtonText: 'Yes',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
                setTimeout(async () => {
                    let BASE_URL = process.env.REACT_APP_SERVER;
                    let url = BASE_URL + "/api/fileupload/block";
                    let req = { hdrid: send };
                    let currentUser = state.user[0];
                    useStore.setState({ isLoading: true, loadingText: "Please wait..." })
                    await axios.post(url, req, {
                        headers: {
                            "Authorization": "Bearer " + currentUser.jwtToken,
                            Accept: "application/json",
                        },
                    })
                        .then(r => {
                            //console.log(r)
                            return r.data;
                        })
                        .then(res => {
                           // console.log(res)
                            useStore.setState({ isLoading: false })
                            this.props.onUpdate(true)
                            //showAlert("Success", res.response + " " + title);
                            Swal.fire({
                                position: "center",
                                icon: "",
                                title: "Success",
                                html: res.response + " " + title,
                                showConfirmButton: false,
                                timer: 2500
                            });
                        }, (e) => {
                            useStore.setState({ isLoading: false })
                            this.props.onUpdate(true)
                            showAlert("Error", e.response.data);

                        }).catch(e => { console.log("catch", e) })
                }, 100);
            }
        })
    }

    handleLoad = (e) => {
        e.preventDefault();
        if (!this.props.isClosed) {

            let drawingNo = e.target.dataset.title;
            let revNo = e.target.dataset.revision;
            useStore.setState({
                drawingNo: drawingNo,
                revNo: revNo,
                autoload: true
            }); 
            this.props.onRedirect(true)
        }
    }

    componentDidMount() {
        document.addEventListener("click", this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener("click", this.handleClickOutside);
    }

    handleContextMenu = (e, item, props) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            contextMenuVisible: true,           
            selectedItem: item,
            props: props,
        });
    };

    handleClickOutside = (e) => {
 
        if (!e.target.closest("label") &&
            this.contextMenuRef.current &&
            !this.contextMenuRef.current.contains(e.target)
        ) {
            this.setState({ contextMenuVisible: false });
        }
    };

    renderContextMenu = () => {
        const { contextMenuVisible,  selectedItem, props } = this.state;

        if (!contextMenuVisible) return null;
 
        return (
            <div
                className="prjRef"           
                ref={this.contextMenuRef}
                style={{ display: "initial", position:"fixed", border: '1px solid #ccc', background: 'white', padding: '0 10px 0 10px', zIndex: 999999 }}
            >
                <Container
                    key={"prjReful_" + this.props.baloonDrwID}
                    className="text-center p-1"
                    style={{ fontSize: this.state.font, position: "relative", width: "max-content", height: "auto", padding: '0px' }}
                >
                {selectedItem.length === 0 && (
                    <>
                        N/A
                    </>
                )}
                {selectedItem.length > 0 && (
                    <>
                        <table className="table table-borderless ">
                            <thead>
                                <tr>
                                    <th>Reference#</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>                    
                                {selectedItem.map((item, index) => (
                                    <>
                                        <tr className="p-0 mb-0" key={"prjRefhw_" + item.productionOrderNumber + "_" + props.baloonDrwID} >
                                            <td className="text-center p-1" key={"prjRefhcolrefw_" + item.productionOrderNumber + "_" + props.baloonDrwID}><>{item.productionOrderNumber}</></td>
                                            <td className="text-center p-1" key={"prjRefhcolqtyw_" + item.productionOrderNumber + "_" + props.baloonDrwID}><>{item.quantity}</></td>
                                        </tr>
                                    </>
                                ))}
                            </tbody>
                        </table>    
                    </>
                    )}
                </Container>
            </div>
        );
    };
 
    render() {
        let items = this.props.projectItem.filter(a => a.productionOrderNumber !== "N/A");
        return (
            <>
                <div className={!this.props.grid ? "cols p-0" : "cols"} key={this.props.id + "cols"}>
                    <div key={this.props.id + "_ProductItem"} className={!this.props.grid ? "ProductItem d-flex" : "ProductItem"}>
                        {!this.props.grid && (
                            <>
                                <Container style={{ fontSize: this.state.font }}>
                                    <Card className={"mb-1 p-1 border " + (this.props.isClosed ? " border-danger alert alert-danger" : " border-success alert alert-success")} key={"card_" + this.props.id}>
                                        <Row className="align-items-center">
                                            <Col className="text-center p-1">
                                                <div key={"card_image_wrapper_" + this.props.id} className="text-center p-1" style={{ overflow: "hidden", objectFit: 'cover' }}>
                                                    <Card.Img
                                                        key={"card_image_" + this.props.id}
                                                        src={this.props.base64String}
                                                        alt={this.props.title}
                                                        className="icon border responsive-image"
                                                        style={{
                                                            width: '100%',
                                                            height: 'auto',
                                                            maxWidth: '100%',
                                                            maxHeight: '100px',
                                                            objectFit: 'cover'
                                                        }} />
                                                </div>
                                                </Col>
                                            <Col className="text-center align-middle p-1">{this.props.title.toUpperCase()}</Col>
                                            <Col className="text-center align-middle p-1">{this.props.revision.toUpperCase()}</Col>
                                            <Col className="text-center align-middle p-1">
                                                {items.length === 0 && (<> N/A </>)}
                                                {items.length > 0 && (
                                                    <>
                                                        <table className="table table-borderless ">
                                                            <thead>
                                                                <tr>
                                                                    <th>Ref #</th>
                                                                    <th>Qty</th>
                                                                </tr>
                                                            </thead>
                                                        <tbody className="projects " style={{
                                                            maxHeight: '100px',
                                                            overflowY: 'auto'
                                                        }}>

                                                        {items.map((item, index) => (
                                                            <>
                                                                <tr className="p-0 mb-0" key={"prjRefhw_" + item.productionOrderNumber + "_" + this.props.baloonDrwID} >
                                                                    <td className="text-center p-1" key={"prjRefhcolrefw_" + item.productionOrderNumber + "_" + this.props.baloonDrwID}><>{item.productionOrderNumber}</></td>
                                                                    <td className="text-center p-1" key={"prjRefhcolqtyw_" + item.productionOrderNumber + "_" + this.props.baloonDrwID}><>{item.quantity}</></td>
                                                                </tr>
                                                            </>
                                                        ))}
                                                            </tbody>
                                                        </table>
                                                    </>
                                                )}
                                            </Col>
                                            <Col className="text-center align-middle p-1">
                                                <div className="text-center p-1 d-flex justify-content-evenly  items-center mb-2" key={"prjbtnw_" + this.props.baloonDrwID}>
                                                    <Button variant="primary"
                                                        key={"prjbtn_" + this.props.baloonDrwID}
                                                        className="text-center p-1 primary_hover "
                                                        onClick={this.handleBlock}
                                                        data-value={parseInt(this.props.baloonDrwID)}
                                                        data-isclosed={this.props.isClosed}
                                                        data-title={`${this.props.title.toUpperCase()}  -  ${this.props.revision.toUpperCase()}`}
                                                        style={{ fontSize: this.state.font, minWidth: 70 }}>
                                                        {!this.props.isClosed ? "Block" : "Unblock"}
                                                    </Button>
                                                    <Button variant="primary"
                                                        key={"prjbtnload_" + this.props.baloonDrwID}
                                                        onClick={this.handleLoad}
                                                        disabled={this.props.isClosed}
                                                        data-title={(this.props.title)}
                                                        data-revision={(this.props.revision)}
                                                        data-value={parseInt(this.props.baloonDrwID)}
                                                        className="text-center p-1 primary_hover "
                                                        style={{ fontSize: this.state.font, minWidth: 70 }}>
                                                        {"Load"}
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Container>           
                            </>
                        )}
                        {this.props.grid && (
                            <>
                                <Card className={"mb-1 p-1 border " + (this.props.isClosed ? " border-danger alert alert-danger": " border-success alert alert-success") } key={"card_"+this.props.id}>
                                    <div key={"card_image_wrapper_" + this.props.id} className="text-center p-1" style={{ overflow: "hidden", objectFit: 'cover' } }>
                                        <Card.Img
                                            key={"card_image_" + this.props.id}
                                            src={this.props.base64String}
                                            alt={this.props.title}
                                            className="icon border responsive-image"
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                maxWidth: '100%',
                                                maxHeight: '100px',
                                                objectFit:'cover'
                                            }} />
                                    </div>

                                    <Card.Body className="text-center p-0" key={"card_body_wrapper_" + this.props.id}>
                                        <Card.Title
                                            key={"card_imageTitle_" + this.props.id}
                                            className="text-center p-0 m-0"
                                            style={{ fontSize: this.state.font }}
                                        > 
                                            {this.props.title.toUpperCase()} - {this.props.revision.toUpperCase()}
                                        </Card.Title>
                                        <div className="body" key={"product_body_" + this.props.id}>
                                            <div className="text-center p-0" key={"card_imagetextwrapper_" + this.props.id}>
                                               <> <Label
                                                    className={"text-center p-0 m-0 bg-white " + (items.length > 0 ? " text-success " : " text-danger ")}
                                                    style={{ fontSize: this.state.font, padding: "0px", cursor: "context-menu" }}
                                                >Reference</Label>
                                                <Label
                                                        className={"prjRef text-center p-0 m-0 bg-white " + (items.length > 0 ? " text-success " : " text-danger ")}
                                                    key={"ref_"+parseInt(this.props.baloonDrwID)}
                                                    data-value={parseInt(this.props.baloonDrwID)}
                                                    onMouseOver={(e) => {
                                                        e.preventDefault();
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.preventDefault();
                                                        }}
                                                        onClick={(e) => {
                                                            
                                                            this.handleContextMenu(e, items, this.props)
                                                        }}
                                                    style={{ fontSize: this.state.font, padding: "0px", cursor: "context-menu" }}
                                                >{`(${items.length})`}</Label>
                                                </>
                                                {this.renderContextMenu()}
                                            </div>
                                            <div className="text-center p-1 d-flex justify-content-between  items-center mb-2"  key={"prjbtnw_" + this.props.baloonDrwID}>
                                
                                                <Button variant="primary"
                                                    key={"prjbtn_" + this.props.baloonDrwID}
                                                    className="text-center p-1 primary_hover "
                                                    onClick={this.handleBlock}
                                                    data-value={parseInt(this.props.baloonDrwID)}
                                                    data-isclosed={this.props.isClosed}
                                                    data-title={`${this.props.title.toUpperCase()}  -  ${this.props.revision.toUpperCase()}` }
                                                    style={{ fontSize: this.state.font, minWidth:70 }}>
                                                    {!this.props.isClosed ? "Block" : "Unblock"}
                                                </Button>
                                                <Button variant="primary"
                                                    key={"prjbtnload_" + this.props.baloonDrwID}
                                                    onClick={this.handleLoad}
                                                    disabled={this.props.isClosed}
                                                    data-title={(this.props.title)}
                                                    data-revision={(this.props.revision)}
                                                    data-value={parseInt(this.props.baloonDrwID)}
                                                    className="text-center p-1 primary_hover "
                                                    style={{ fontSize: this.state.font, minWidth: 70 }}>
                                                    {"Load"}
                                                </Button>
                                            </div>
                                        </div>                                        
                                    </Card.Body>
                                </Card>                                
                            </>
                        )}
                    </div>
                </div>
            </>
        );
    }
}
class ProjectSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchQuery: "", // Track the search input
        };
    }

    handleSearch = (event) => {
        const query = event.target.value;
        this.setState({ searchQuery: query });
        this.props.onSearch(query);
    };
    handlePageSizeChange = (event) => {
        const pageSize = parseInt(event.target.value, 10);
        this.props.onPageSize(pageSize);
    };
    render() {

        const { searchQuery } = this.state;
 
        return (<>
            <div className={"d-flex gap-3"} key={"search_element_outter"}>
                <div key={"search_element_inner"} >
                    <Form className="d-flex  gap-3 items-center">
                        <div className="m-0" key={"search_element_cols"} >
                            <Input
                                key={"search_element"} id={"search_element"}
                                type="text"
                                placeholder="Search by Drawing Number"
                                name={"search_element"}
                                className={"outline-none "}
                                bsSize="sm"
                                style={{ fontSize: "0.675rem" }}
                                value={searchQuery}
                                onChange={this.handleSearch}
                            />                                 
                        </div>
                        {/* Page Size Dropdown */}
                        <div style={{ marginBottom: "10px", fontSize: this.props.font }}>
                            <label htmlFor="pageSize">entries per page &nbsp;:&nbsp; </label>
                            <select id="pageSize" value={this.props.pageSize} onChange={this.handlePageSizeChange}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </Form>
                </div>
            </div>
        </>);
    }
}
class ProjectView extends React.Component {
 
    handleGridClick = () =>{
        this.props.handleViewChange(true);
    }
    handleListClick = () => {
        this.props.handleViewChange(false);
    }
    render() {
        return (<>
            <div className={"d-flex  gap-3 items-center"} key={"ProjectView_wrapper"}>
                <Button key={"BtnProjectViewGrid"} className={this.props.grid ? "btn-primary ProjectView primary_hover light-btn":""} color="light" outline size={"sm"} onClick={this.handleGridClick} >
                    <Grid className={!this.props.grid ? "icon svg-container" : "svg-container-selected"} />
                    </Button>
                
                <Button key={"BtnProjectViewList"} className={!this.props.grid ? "btn-primary ProjectView primary_hover light-btn" : ""} color="light" outline size={"sm"} onClick={this.handleListClick}>
                    <List className={this.props.grid ? "icon svg-container" : "svg-container-selected"} />
                    </Button>
            </div>          
        </>);
    }
}
export default class ProjectCatalog extends React.Component {
    static displayName = "Drawing Management";
    constructor(props) {
        super(props);
        this.state = {
            products: [], // Store all products
            filteredProducts: [], // Store search results
            grid: true,
            reload:false,
            loading: true,
            redirect: false,
            search: '',
            currentPage: 1,
            totalPages: 1,
            pageSize: 5,
            windowHeight: window.innerHeight,
            font: "0.875em"
        };
        this.handleViewChange = this.handleViewChange.bind(this);
        this.handleViewReload = this.handleViewReload.bind(this);
    }
    componentDidMount() {
        seo({
            title: `${ProjectCatalog.displayName}`,
            metaDescription: config.APP_TITLE
        });
        this.loadproducts(1);
        window.addEventListener("resize", this.updateWindowHeight);
    }

    componentWillUnmount = () => {
        window.removeEventListener("resize", this.updateWindowHeight);
        if (this._searchTimer) clearTimeout(this._searchTimer);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.reload !== this.state.reload) {
            this.loadproducts(1);
        } 
    }

    updateWindowHeight = () => {
        this.setState({ windowHeight: window.innerHeight });
    };

    handlePageChange = (page) => {
        if (page < 1 || page > this.state.totalPages) return;
        this.loadproducts(page);
    };

    handlePageSizeChange = (attr) => {
        const pageSize = parseInt(attr, 10);
        this.setState({ pageSize }, () => this.loadproducts(1, pageSize)); // Reset to page 1 when page size changes
    };

    async loadproducts(page = 1) {
        let state = useStore.getState();
        let currentUser = state.user[0];
        try {
            let BASE_URL = process.env.REACT_APP_SERVER;
            let url = BASE_URL + `/api/drawingsearch/getallProjects?page=${page}&search=${this.state.search}&pageSize=${this.state.pageSize}`;
            await axios.get(url, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "authorization": "Bearer " + currentUser.jwtToken,
                    Accept: "application/json",
                },
            }).then(r => {
                useStore.setState({ isLoading: false })
                return r.data;
            }).then(res => {
                if (config.console)
                    console.log(res)

                const { products, currentPage, totalPages } = res;

                this.setState({
                    products: products,
                    currentPage: currentPage,
                    totalPages: totalPages,
                    filteredProducts: products,
                    loading: false
                });
            });
        } catch (e) {
            console.log(e);
            this.setState({ loading: false });
            if (e.response && e.response.status === 401) {
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('roles');
                window.location.assign('/login');
            } else {
                Swal.fire({ title: "Error", text: "Failed to load drawings. Please try again.", icon: "error" });
            }
        }
    }

    handleViewChange = (attr) => {
        this.setState({ grid: attr })
    }

    handleViewReload = (attr) => {
        if (attr) {
            this.setState((prevState) => ({ reload: !prevState.reload }));
        }
    }

    handleRedirect = () => {
        this.setState({ redirect: true });
    };

    handleSearch = (searchQuery) => {
        this.setState({ search: searchQuery }, () => {
            // Debounce: clear previous timer, wait 400ms before calling API
            if (this._searchTimer) clearTimeout(this._searchTimer);
            this._searchTimer = setTimeout(() => {
                this.loadproducts(1);
            }, 400);
        });
    };
    
    renderProject(products, currentPage, totalPages, pageSize) {
    
        const { windowHeight } = this.state;
        return (
            <>
                <Container key={"ProjectViewPage"}  className="container-sm"  >
                    <div key={"ProjectView_title"} className="d-flex justify-content-between align-items-center mb-2">
                        <span>{ProjectCatalog.displayName}</span>
                        <Button color="secondary" size="sm" className="primary_hover" style={{ fontSize: this.state.font }} onClick={() => this.setState({ redirect: true })}>
                            Close
                        </Button>
                    </div>
                    <div key={"ProjectView_option"} className="flex justify-content-between items-center mb-2" style={{ flexDirection:"row"} }>
                        <ProjectSearch key={"ProjectSearch"}
                            pageSize={pageSize}
                            font={this.state.font }
                            onPageSize={attr => this.handlePageSizeChange(attr)}
                            onSearch={attr => this.handleSearch(attr)}
                          />
                        <ProjectView
                            key={"ProjectView"}
                            grid={this.state.grid }
                            handleViewChange={this.handleViewChange}
                        />
                    </div>
                {products.length === 0 && (<>
                        <Container key={"NoProject_wrapper"} className="container-sm" style={{ fontSize: this.state.font }}>
                        No Project Found.
                    </Container>
                    </>)}
                    {products.length > 0 && (
                        <>                          
                            <Container fluid className="p-0" style={{ fontSize: this.state.font }}>
                                {!this.state.grid && (
                                    <>
                                        <Container className="p-0">
                                            <Row>
                                                <Col className="text-center p-1"><Label>Image</Label></Col>
                                                <Col className="text-center p-1"><Label>DrawingNumber #</Label> </Col>
                                                <Col className="text-center p-1"><Label>Revision #</Label></Col>
                                            <Col className="text-center p-1"><Label>Reference</Label></Col>
                                                <Col className="text-center p-1"><Label>Action</Label></Col>
                                            </Row>
                                        </Container>
                                    </>
                            )}
                                <Container key={"Project_wrapper"} fluid className="container-sm projects p-0" style={{ overflowY: "auto", overflowX: "hidden", maxHeight: windowHeight - 200 }}>
                                    <div key={"ProjectView_wrapper"} className={this.state.grid ? "grid row row-cols-1 row-cols-sm-2 row-cols-md-4  row-cols-lg-5" : "flex row row-cols-1 gap-2 "} >
                               
                                    {products.map((product, index) => (
                                        <Product
                                            key={index + "Projects_wrapper"}
                                            id={index}
                                            grid={this.state.grid}
                                            font={this.state.font}
                                            baloonDrwID={product.baloonDrwID }
                                            projectItem={product.projectItem}
                                            title={product.drawingNumber}
                                            revision={product.revision}
                                            isClosed={product.isClosed}
                                            onUpdate={attr => this.handleViewReload(attr) }
                                            onRedirect={attr => this.handleRedirect()}
                                            base64String={"data:image/jpeg;base64,"+product.image }
                                        />
                                    ))}
                            </div>
                                </Container>
                            </Container>
                        </>
                    )}
                    <div className="mb-4">&nbsp;</div>
                    {products.length > 0 && (
                        <>
                            <div className="d-flex justify-content-between items-center mb-2">
                                <Button style={{ fontSize: this.state.font }}  variant="primary"  className={"primary_hover"} onClick={() => this.handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            Previous
                        </Button>
                                <span style={{ fontSize: this.state.font }}>
                            Page {currentPage} of {totalPages}
                                </span>
                                <Button style={{ fontSize: this.state.font }}  variant="primary" className={"primary_hover"}  onClick={() => this.handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                            Next
                        </Button>
                            </div>
                        </>
                    )}
                </Container>               
            </>);
    }

    render() {
        if (this.state.redirect) {
            return <Navigate to="/" />;
        }
        const { filteredProducts, currentPage, totalPages, pageSize, loading } = this.state;

        let state = useStore.getState();
        //console.log(state)
        const user = state.user;
 
        let contents = loading
            ? <p><em>Loading....</em></p>
            : this.renderProject(filteredProducts, currentPage, totalPages, pageSize);

       return ( <div className="content-fluid p-0">
            <>
                {user.length === 0 && (
                    <Navigate to="/login" replace={true} />
                )}
            </>
           <div className="container-sm pt-5">
               <div className="admin-page-header">
                    <button className="admin-back-btn" onClick={() => window.history.back()}>
                        <i className="bi bi-arrow-left"></i> Back to Home
                    </button>
                    <h4 className="admin-page-title">
                        <i className="bi bi-folder-fill me-2"></i>Drawings Management
                    </h4>
                </div>
               {contents}
           </div>
       </div>
        );
    }
}