import { Outlet, Navigate } from 'react-router-dom'
import useStore from "../../components/Store/store";
const PrivateRoutes = () => {
    let state = useStore.getState();
    const user = state.user;
    return (
        user.length > 0 ? <Outlet /> : <Navigate to="/login" />
    )
}

export default PrivateRoutes