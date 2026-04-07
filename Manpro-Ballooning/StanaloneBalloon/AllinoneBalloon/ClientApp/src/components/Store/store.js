import { create } from "zustand";
import initialState from "./init";
const useStore = create((set, get) => ({
    ...initialState,

    setSize: ({ width, height }) =>
        set({ width, height }),
    setImageSize: size =>
        set(() => ({ width: size.width, height: size.height })),
    setDrawingNo: d =>
        set(() => ({ drawingNo: d.drawingNo })),
    setRevNo: d =>
        set(() => ({ revNo: d.revNo })),
    setSidebarIsOpen: d =>
        set(() => ({ sidebarIsOpen: d.sidebarIsOpen })),
    setIsLoading: d =>
        set(() => ({ isLoading: d.isLoading })),
    setTopbarIsOpen: d =>
        set(() => ({ topbarIsOpen: d.topbarIsOpen })),
    setselectedRegion: (value) =>
        set(() => ({ selectedRegion: value })),
    setBgImgRotation: d =>
        set(() => ({ bgImgRotation: d.bgImgRotation })),
    setBgImgX: d =>
        set(() => ({ bgImgX: d.bgImgX })),
    setBgImgY: d =>
        set(() => ({ bgImgY: d.bgImgY })),
    setItemView: d =>
        set(() => ({ ItemView: d.ItemView })),
    setDrawingDetails: d =>
        set(() => ({ drawingDetails: d.drawingDetails })),
    setDrawingHeader: d =>
        set(() => ({ drawingHeader: d.drawingHeader })),
    setDrawingRegions: d =>
        set(() => ({ drawingRegions: d.drawingRegions })),
    setScrollHeight: d =>
        set(() => ({ scrollHeight: d.scrollHeight })),
    reset: () => {
        set(initialState);
    },

}));

export default useStore;
