import React, { Component } from 'react';
import useStore from "./../Store/store";
import { Navigate } from 'react-router-dom';
import axios from "axios";
import Swal from 'sweetalert2';
import './create.css';
import { config, showAlert, seo, CatchError } from '../Common/Common';
import classNames from "classnames";
import { Modal,  ModalBody, Button} from "reactstrap";
import { ReactComponent as CloseFill } from "../../assets/close-fill.svg";
export default class CreateUser extends Component {
    static displayName = "User Management";

    constructor(props) {
        super(props);
        this.state = {
            users: [],
            loading: true,
            popupShown: false,
            modal: false,
            closeAll: false,
            backdrop: "static",
            font: "0.875em",
            loading: false,
            isVisiblepassword: false,
            modalTitle: "",
            credentials: { UserName: '', UserEmail: '', Password: '', status:'active', UserRole: "CNC Operator", userId: 0 },
            inputs: []
        };       
    }
 
    componentWillUnmount = () => {
        seo({
            title: `${CreateUser.displayName}`,
            metaDescription: config.APP_TITLE
        });
    }
    componentDidMount() {
        seo({
            title: `${CreateUser.displayName}`,
            metaDescription: config.APP_TITLE
        });
        let state = useStore.getState();
        var r = [],
            keys = state.roles,
            values = state.roles;

        for (let i = 0; i < keys.length; i++) {
            r[i] = [values[i], values[i]];
        }
        this.setState({ inputs: r });
       // console.log(state.roles,  r)
        this.ListUser();
    }
   
    addClick = (e) => {
        e.preventDefault();
        const allowedRoles = this.getAllowedRoles();
        const defaultRole = allowedRoles.length > 0 ? allowedRoles[0][1] : "CNC Operator";
        this.setState({
            modalTitle: "Add User",
            credentials: { ...this.state.credentials, UserRole: defaultRole, userId: 0, UserName: '', UserEmail: '', Password: '', status: 'active' }
        });
        this.setState({ modal: true, popupShown: true });
    }

    handleValidationErrors = (errors) => {
        let colllection = [];
        for (const field in errors) {
            if (errors.hasOwnProperty(field)) {
                const messages = errors[field];
                for (let message of messages) {
                    // console.error(`${field}: ${message}`);
                    message = message.replace(/\r\n/g, '<br>');
                    colllection.push(`<span>${message}</span>`);
                }
            }
        }
        if (colllection.length > 0) {
            showAlert("Error", colllection.join("<br/>"));
        }
    }
    createEmptyUserObject = (userFields) => {
        return userFields.reduce((acc, field) => {
            acc[field] = '';
            return acc;
        }, {});
    };
    createClick = async (e) => {
        e.preventDefault();
        if (config.console)
            console.log(this.state)

        let state = useStore.getState();
        let currentUser = state.user[0];
        
        const data = {
            UserName: this.state.credentials.UserName,
            UserEmail: this.state.credentials.UserEmail.toLowerCase(),
            Password: this.state.credentials.Password,
            UserRole: this.state.credentials.UserRole,
            UserId: this.state.credentials.userId
        };
        const regex = /^[a-zA-Z0-9_.]*$/;
        let error = [];
        let errorForm = this.createEmptyUserObject([...Object.keys(data)]);

        // Required field validation
        if (!data.UserName || !data.UserName.trim()) {
            error.push('UserName');
            errorForm.UserName = ['Name is required'];
        }
        if (!data.UserEmail || !data.UserEmail.trim()) {
            error.push('UserEmail');
            errorForm.UserEmail = ['User Name is required'];
        }
        if (!data.Password || !data.Password.trim()) {
            error.push('Password');
            errorForm.Password = ['Password is required'];
        }
        if (!data.UserRole || !data.UserRole.trim()) {
            error.push('UserRole');
            errorForm.UserRole = ['Role is required'];
        }

        for (const [name, value] of Object.entries(data)) {
            if (!config.Demo && !regex.test(value) && name === 'UserEmail') {
                error.push(name);
                errorForm.UserEmail = ["Please enter a Valid UserName,\r\nAllowed Alpha numeric, underscore and dot."]
            }
            if (config.Demo && name === 'UserEmail') {
                if (!/^[\w+\.]+@(?:[\w]+\.)+[A-Za-z]+$/.test(value)) {
                    error.push(name);
                    errorForm.UserEmail = ['Please enter a valid email'];
                }
            }
        }
        if (error.length > 0) {
            this.handleValidationErrors(errorForm)
            return false;
        }
        
        if (config.console)
            console.log(data)

        useStore.setState({ isLoading: true, loadingText: "User Creating..." })
        try {
            let BASE_URL = process.env.REACT_APP_SERVER;
            let url = BASE_URL + "/api/users/create";
            let res = await axios.post(url, data, {
                headers: {
                    "authorization": "Bearer " + currentUser.jwtToken,
                    Accept: "application/json",
                },
            });
            useStore.setState({ isLoading: false });
            if (config.console)
                console.log(res.data)
            this.ListUser();
            this.onHidePopup();
            Swal.fire({
                title: '<strong style="font-size:1.1rem;color:#1a1a2e">Success</strong>',
                html: `<p style="font-size:0.95rem;color:#444;margin:0">${res.data}</p>`,
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb',
                timer: 3000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__fadeInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' },
                customClass: { popup: 'swal-professional', icon: 'swal-icon-sm' }
            });
        } catch (err) {
            if (config.console)
                console.log(err)

            useStore.setState({ isLoading: false });

            if (err.response) {
                if (err.response.status === 401) {
                    CatchError(err);
                } else if (err.response.status === 400) {
                    showAlert("Error", err.response.data);
                } else if (err.response.status === 422) {
                    this.handleValidationErrors(err.response.data);
                } else {
                    showAlert("Error", err.response.data || "Something went wrong. Please try again.");
                }
            } else {
                showAlert("Error", "Network error. Please check your connection.");
            }
        }
        return false;
    }

    deleteClick = (e) => {
        e.preventDefault();
        const btn = e.target.closest('[data-value]');
        if (!btn || !btn.dataset.value) return;
        let user = JSON.parse(btn.dataset.value);
       // console.log(e,JSON.parse(user))
        Swal.fire({
            title: '<strong style="font-size:1.1rem;color:#1a1a2e">Confirm Delete</strong>',
            html: `<p style="font-size:0.95rem;color:#444;margin:0">Are you sure you want to delete <b>${user.name}</b> (${user.role})?</p><p style="font-size:0.85rem;color:#999;margin:8px 0 0 0">This action cannot be undone.</p>`,
            icon: 'warning',
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#dc2626',
            denyButtonText: 'Cancel',
            denyButtonColor: '#6b7280',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: { popup: 'swal-professional' }
        }).then((result) => {
            if (result.isConfirmed) {
                let state = useStore.getState();
                let currentUser = state.user[0];
                try {
                    let BASE_URL = process.env.REACT_APP_SERVER;
                    let url = BASE_URL + "/api/users/userDelete/"+user.id;
                    axios.delete(url, {
                        headers: {                            
                            "authorization": "Bearer " + currentUser.jwtToken,
                            Accept: "application/json",
                        },
                    }).then(r => {
                        useStore.setState({ isLoading: false })
                        if (config.console)
                            console.log(r)
                        this.ListUser();
                        Swal.fire({
                            title: '<strong style="font-size:1.1rem;color:#1a1a2e">Deleted</strong>',
                            html: '<p style="font-size:0.95rem;color:#444;margin:0">User has been deleted successfully.</p>',
                            icon: 'success',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#2563eb',
                            timer: 2500,
                            timerProgressBar: true,
                            customClass: { popup: 'swal-professional' }
                        });
                    });
                } catch (e) {
                    console.log(e);
                }
            }  
        });
        return false;
    }

    updateUser = async (e) => {
        e.preventDefault();
        if (config.console)
        console.log(this.state)
        let state = useStore.getState();
        let currentUser = state.user[0];

        const data = {
            UserName: this.state.credentials.UserName,
            UserEmail: this.state.credentials.UserEmail.toLowerCase(),
            Password: this.state.credentials.Password,
            UserRole: this.state.credentials.UserRole,
            status: this.state.credentials.status,
            UserId: this.state.credentials.userId
        };
        const regex = /^[a-zA-Z0-9_.]*$/;
        let error = [];
        let errorForm = this.createEmptyUserObject([...Object.keys(data)]);

        for (const [name, value] of Object.entries(data)) {

            if (!regex.test(value) && name === 'UserEmail') {
                error.push(name);
                errorForm.UserEmail = ["Please enter a Valid UserName,\r\nAllowed Alpha numeric, underscore and dot."]
            }
        }
        if (error.length > 0) {
            this.handleValidationErrors(errorForm)
            return false;
        }
        if (config.console)
            console.log(data)
         useStore.setState({ isLoading: true, loadingText: "User Updating..." })
        try {
            let BASE_URL = process.env.REACT_APP_SERVER;
            let url = BASE_URL + "/api/users/update";
            let res = await axios.put(url, data, {
                headers: {
                    "authorization": "Bearer " + currentUser.jwtToken,
                    Accept: "application/json",
                },
            });
            useStore.setState({ isLoading: false });
            if (config.console)
                console.log(res.data)
            this.ListUser();
            this.onHidePopup();
            Swal.fire({
                title: '<strong style="font-size:1.1rem;color:#1a1a2e">Success</strong>',
                html: `<p style="font-size:0.95rem;color:#444;margin:0">${res.data}</p>`,
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb',
                timer: 3000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__fadeInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' },
                customClass: { popup: 'swal-professional', icon: 'swal-icon-sm' }
            });
        } catch (err) {
            if (config.console)
                console.log(err)

            useStore.setState({ isLoading: false });

            if (err.response) {
                if (err.response.status === 401) {
                    CatchError(err);
                } else if (err.response.status === 400) {
                    showAlert("Error", err.response.data);
                } else if (err.response.status === 422) {
                    this.handleValidationErrors(err.response.data);
                } else {
                    showAlert("Error", err.response.data || "Something went wrong. Please try again.");
                }
            } else {
                showAlert("Error", "Network error. Please check your connection.");
            }
        }
        return false;
    }

    renderForecastsTable = (users) => {
        let state = useStore.getState();
        const loggedUser = state.user[0];
        const filteredData = users.map(({ id, name, email, role, status }) => ({ id, name, email, role, status }));
        if (config.console)
            console.log(filteredData)

        const isSelf = (u) => u.id === loggedUser.id;
        const isAdmin = (u) => u.role && u.role.toLowerCase() === 'admin';
        const isSuperAdmin = (u) => u.email && u.email.toLowerCase() === 'manpro';

        return (
            <div className="um-table-wrapper">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th style={{width:'60px'}}>#</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th style={{width:'100px'}}>Status</th>
                            <th style={{width:'180px'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((user, index) =>
                            <tr key={user.id}>
                                <td className="um-td-num">{index + 1}</td>
                                <td>
                                    <div className="um-user-info">
                                        <div className="um-avatar">{user.name.charAt(0).toUpperCase()}</div>
                                        <span className="um-user-name">{user.name}</span>
                                    </div>
                                </td>
                                <td><code className="um-username">{user.email}</code></td>
                                <td>
                                    <span className={`um-role-badge ${isAdmin(user) ? 'um-role-admin' : 'um-role-user'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`um-status ${user.status === 'active' ? 'um-status-active' : 'um-status-inactive'}`}>
                                        <span className="um-status-dot"></span>
                                        {user.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    {isSuperAdmin(user) ? (
                                        <span className="um-super-badge">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5z"/>
                                            </svg>
                                            Protected
                                        </span>
                                    ) : (
                                        <div className="um-actions">
                                            <button className="um-btn-edit"
                                                onClick={() => {
                                                    this.setState({ modalTitle: "Update User", modal: true, popupShown: true, credentials: { UserName: user.name, UserEmail: user.email, status: user.status || 'active', Password: '', UserRole: user.role, userId: user.id } });
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                    <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                                                </svg>
                                                Edit
                                            </button>
                                            {!isAdmin(user) && !isSelf(user) && (
                                                <button className="um-btn-delete"
                                                    data-value={JSON.stringify(user)}
                                                    onClick={(e) => this.deleteClick(e)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                                                    </svg>
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    changeuserAdd = (e) => {
        const { name, value } = e.target;
        const cred = this.state.credentials;
        const regex = /^[a-zA-Z0-9_.]*$/;
        if (regex.test(value) && name === 'UserEmail') {
            cred[name] = value;
           // console.log(name, value)
            this.setState({ credentials: cred })
        } else {
            cred[name] = value;
            this.setState({ credentials: cred })
        }       
    }

    onHidePopup = (e) => {
        const cred = { UserName: '', UserEmail: '', Password: '', status: 'active' , UserRole: "CNC Operator", userId: 0 };
        this.setState({ credentials: cred })
        this.setState({ modalTitle: "", popupShown: false, modal: !this.state.modal });
    }
    renderheaders = () => {
        return (<>
            <Button type="button"
                className="btn btn-primary m-2 float-end"
                style={{ fontSize: this.state.font }}
                onClick={(e) => this.addClick(e)}>
                Add User
            </Button>
        </>);
    }
    // Helper: count users by role
    getAdminCount = () => this.state.users.filter(u => u.role && u.role.toLowerCase() === 'admin').length;
    getSuperAdminCount = () => this.state.users.filter(u => u.email && u.email.toLowerCase() === 'manpro').length;

    // Helper: check if current logged-in user is super admin
    // Note: AuthenticateResponse has userName (not email), and DB stores username in 'email' column
    isLoggedInSuperAdmin = () => {
        const state = useStore.getState();
        if (state.user.length === 0) return false;
        const u = state.user[0];
        // Check both possible field names
        const username = (u.userName || u.UserName || u.email || u.name || '').toLowerCase();
        return username === 'manpro';
    }
    isLoggedInAdmin = () => {
        const state = useStore.getState();
        if (state.user.length === 0) return false;
        const role = (state.user[0].role || state.user[0].Role || '').toLowerCase();
        return role === 'admin';
    }

    // Get allowed roles for current user to assign
    getAllowedRoles = () => {
        const adminCount = this.getAdminCount();
        const MAX_ADMINS = 3; // max 3 admins (1 super + 2 more)

        if (this.isLoggedInSuperAdmin()) {
            // Super admin can create Admin (up to 3 total) and all other roles
            let roles = [];
            if (adminCount < MAX_ADMINS) {
                roles.push(['Admin', 'Admin']);
            }
            // Add all non-admin roles from the system
            const state = useStore.getState();
            state.roles.forEach(r => {
                if (r.toLowerCase() !== 'admin') {
                    roles.push([r, r]);
                }
            });
            return roles;
        } else if (this.isLoggedInAdmin()) {
            // Admin can create non-admin roles only (Supervisor, CNC Operator, etc.)
            const state = useStore.getState();
            return state.roles.filter(r => r.toLowerCase() !== 'admin').map(r => [r, r]);
        }
        return [];
    }

    render() {
        let modalTitle = this.state.modalTitle;
        let state = useStore.getState();
        const user = state.user;

         if (config.console)
            console.log(this.state , user[0])

        let contents = this.state.loading
            ? <div className="um-loading"><div className="um-spinner"></div><span>Loading users...</span></div>
            : this.renderForecastsTable(this.state.users);

        const canCreateUsers = this.isLoggedInSuperAdmin() || this.isLoggedInAdmin();
        const allowedRoles = this.getAllowedRoles();

        return (
            <div className="um-page">
                <>
                    {user.length === 0 && (
                        <Navigate to="/login" replace={true} />
                    )}
                </>
                <div className="um-container">
                    <div className="um-header">
                        <div className="um-header-left">
                            <button className="um-back-btn" onClick={() => window.history.back()}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                                </svg>
                                Back
                            </button>
                            <div className="um-title-group">
                                <h4 className="um-title">User Management</h4>
                                <span className="um-subtitle">{this.state.users.length} user{this.state.users.length !== 1 ? 's' : ''} registered &middot; {this.getAdminCount()} admin{this.getAdminCount() !== 1 ? 's' : ''} (max 3)</span>
                            </div>
                        </div>
                        {canCreateUsers && <button className="um-add-btn" onClick={(e) => this.addClick(e)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            </svg>
                            Add User
                        </button>}
                    </div>
                    <div className="um-card">
                        {contents}
                    </div>
                </div>
                <Modal isOpen={this.state.modal} backdrop={this.state.backdrop} className="user-modal-dialog" centered>
                    <div className="user-modal-header">
                        <div className="user-modal-header-left">
                            <div className="user-modal-icon">
                                <i className={`bi ${this.state.credentials.userId === 0 ? 'bi-person-plus-fill' : 'bi-pencil-square'}`}></i>
                            </div>
                            <div>
                                <h5 className="user-modal-title">{modalTitle}</h5>
                                <p className="user-modal-subtitle">{this.state.credentials.userId === 0 ? 'Fill in the details to create a new user' : 'Modify user details below'}</p>
                            </div>
                        </div>
                        <button type="button" className="user-modal-close" onClick={this.onHidePopup}>
                            <CloseFill className="icon" />
                        </button>
                    </div>
                    <ModalBody className="user-modal-body">
                        <form onSubmit={this.state.credentials.userId === 0 ? this.createClick : this.updateUser}>

                            <div className="user-form-group">
                                <label className="user-form-label">
                                    <i className="bi bi-person"></i> Name
                                </label>
                                <input type="text" name="UserName" className="form-control user-form-input"
                                    placeholder="Enter full name"
                                    value={this.state.credentials.UserName}
                                    onChange={this.changeuserAdd} />
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">
                                    <i className="bi bi-at"></i> User Name
                                </label>
                                <input type="text" name="UserEmail" className="form-control user-form-input"
                                    placeholder="Enter username"
                                    value={this.state.credentials.UserEmail}
                                    onChange={this.changeuserAdd} />
                            </div>

                            <div className="user-form-group">
                                <label className="user-form-label">
                                    <i className="bi bi-shield-check"></i> Role
                                </label>
                                <div className="user-role-grid">
                                    {allowedRoles.map(([text, value], i) => {
                                        const isSelfAdminLock = this.state.credentials.userId === user[0].id && user[0].role === "Admin" && value !== "Admin";
                                        const isAdminFull = value === "Admin" && this.getAdminCount() >= 3 && this.state.credentials.userId === 0;
                                        const isDisabled = isSelfAdminLock || isAdminFull;
                                        return (
                                            <label key={i} className={`user-role-option ${this.state.credentials.UserRole === value ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                htmlFor={"UserRole-" + i}
                                                title={isAdminFull ? 'Maximum 3 admins reached' : ''}>
                                                <input className="form-check-input d-none" type="radio" name="UserRole" id={"UserRole-" + i}
                                                    checked={this.state.credentials.UserRole === value}
                                                    onChange={isDisabled ? undefined : this.changeuserAdd}
                                                    readOnly={isDisabled}
                                                    value={value} />
                                                <span className="user-role-radio"></span>
                                                {text}
                                                {isAdminFull && <span style={{ fontSize: '.65rem', color: '#999', marginLeft: '4px' }}>(max)</span>}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {this.state.credentials.userId !== 0 && this.state.credentials.userId !== user[0].id && (
                                <div className="user-form-group">
                                    <label className="user-form-label">
                                        <i className="bi bi-toggle-on"></i> Status
                                    </label>
                                    <div className="user-status-toggle">
                                        <label className={`user-status-option ${this.state.credentials.status === 'active' ? 'active' : ''}`}
                                            htmlFor="status-active">
                                            <input name="status" type="radio" className="d-none" id="status-active"
                                                checked={this.state.credentials.status === "active"}
                                                value="active"
                                                onChange={this.changeuserAdd} />
                                            <i className="bi bi-check-circle-fill"></i> Active
                                        </label>
                                        <label className={`user-status-option ${this.state.credentials.status === 'inactive' ? 'active inactive' : ''}`}
                                            htmlFor="status-inactive">
                                            <input name="status" type="radio" className="d-none" id="status-inactive"
                                                checked={this.state.credentials.status === "inactive"}
                                                value="inactive"
                                                onChange={this.changeuserAdd} />
                                            <i className="bi bi-x-circle-fill"></i> Inactive
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="user-form-group">
                                <label className="user-form-label">
                                    <i className="bi bi-lock"></i> Password
                                    {this.state.credentials.userId !== 0 && <span className="user-form-hint">(leave blank to keep current)</span>}
                                </label>
                                <div className="user-password-wrapper">
                                    <input type={this.state.isVisiblepassword ? "text" : "password"} name="Password" className="form-control user-form-input"
                                        placeholder={this.state.credentials.userId === 0 ? "Enter password" : "Enter new password"}
                                        onChange={this.changeuserAdd} />
                                    <button type="button" className="user-password-toggle"
                                        onClick={() => this.setState({ isVisiblepassword: !this.state.isVisiblepassword })}>
                                        <i className={`bi ${this.state.isVisiblepassword ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="user-modal-footer">
                                <button type="button" className="btn user-btn-cancel" onClick={this.onHidePopup}>Cancel</button>
                                <button className="btn user-btn-submit" type="submit">
                                    <i className={`bi ${this.state.credentials.userId === 0 ? 'bi-plus-lg' : 'bi-check-lg'}`}></i>
                                    {this.state.credentials.userId === 0 ? ' Create User' : ' Update User'}
                                </button>
                            </div>
                        </form>
                    </ModalBody>
                </Modal>
            </div>
        );
    }

    async ListUser() {
        let state = useStore.getState();
        let currentUser = state.user[0];
        try {
            let BASE_URL = process.env.REACT_APP_SERVER;
            let url = BASE_URL + "/api/users/getallUser";
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

                this.setState({ users: res, loading: false });
            });
        } catch (e) {
            console.log(e);
        }
    }
}