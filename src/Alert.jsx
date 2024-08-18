import React, { useEffect } from "react";
import "./Alert.css"; // Import the CSS file for custom styling

const Alert = ({ message, type, onClose }) => {
  useEffect(() => {
    // Automatically close the alert after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // 3000ms = 3 seconds

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [onClose]);

  const alertClass = `alert ${type}`; // Apply different styles based on the type

  return (
    <div className={alertClass}>
      <span className="alert-message">{message}</span>
      <button className="close-button" onClick={onClose}>
        &#10005; {/* Close icon */}
      </button>
    </div>
  );
};

export default Alert;
