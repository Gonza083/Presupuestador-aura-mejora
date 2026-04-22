import React from "react";
import Routes from "./Routes";
import { AuthProvider } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Routes />
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
