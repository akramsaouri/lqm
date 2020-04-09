import React, { useEffect, useState } from "react";
import * as serviceWorker from "./serviceWorker";

const SwNotification = () => {
  const [alert, setAlert] = useState({
    visible: false,
  });

  const onSWrUpdate = () => {
    setAlert({
      visible: true,
    });
  };

  const activateWaitingSW = () => {
    serviceWorker.unregister().then(() => {
      window.location.reload();
    });
  };

  useEffect(() => {
    window.addEventListener("onSWRUpdate", onSWrUpdate);
    return () => window.removeEventListener("onSWRUpdate", onSWrUpdate);
  }, []);

  return alert.visible ? (
    <div className="alert">
      <p className="alert-content">
        Some changes were made while you were away,{" "}
        <button onClick={activateWaitingSW} className="alert-button">
          reload
        </button>{" "}
        <span>to get the latest updates</span>
      </p>
    </div>
  ) : null;
};

export default SwNotification;
