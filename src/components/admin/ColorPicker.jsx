import React, { useEffect } from 'react';
import { ColorPicker, useColor } from 'react-color-palette';
import 'react-color-palette/css';

const AdvancedColorPicker = ({ color, onChange }) => {
  // Updated for react-color-palette v7+: useColor takes only the color string
  const [internalColor, setInternalColor] = useColor(color || '#FFFFFF');
  
  // Effect to sync prop changes to internal state if needed, 
  // though react-color-palette is primarily internal state driven.
  // We use the key prop in the parent to force re-initialization if color changes drastically from outside.
  
  const handleChange = (newColor) => {
    setInternalColor(newColor);
    if (onChange) {
      onChange(newColor.hex);
    }
  };

  return (
    <div className="custom-color-picker-wrapper">
      <ColorPicker 
        color={internalColor}
        onChange={handleChange}
        height={120}
        hideInput={["rgb", "hsv"]}
      />
    </div>
  );
};

export default AdvancedColorPicker;