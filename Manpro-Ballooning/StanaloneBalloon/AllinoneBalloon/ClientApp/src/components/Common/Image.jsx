import React from "react";



const Image = ({ name, alt, title, className, style, onClick }) => {
    try {
        // Import image on demand
        const image = require(`../../assets/${name}`);
        // If the image doesn't exist. return null
        if (!image) return null;
        return <img src={image} alt={alt} title={title} className={className} style={style} onClick={onClick } />;
    } catch (error) {
        console.log(`Image with name "${name}" does not exist`);
        return null;
    }
};


export default Image;