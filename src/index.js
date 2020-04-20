import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";

import App from "./App";
import Footer from "./Footer";
import SwNotification from "./SwNotification";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <main className="App">
      <SwNotification />
      <App />
    </main>
    <Footer />
  </React.StrictMode>,
  rootElement
);

// serviceWorker.unregister();
serviceWorker.register({
  onUpdate: () => {
    window.dispatchEvent(new Event("onSWRUpdate"));
  },
});
