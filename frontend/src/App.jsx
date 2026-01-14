import React from "react";
import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Canvas from "./pages/Canvas";
import { Toaster } from "@/components/ui/sonner";
import { io } from 'socket.io-client';

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/canvas/:id" element={<Canvas />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* <Routes>
        <Route path="/" element={<Canvas />} />
      </Routes> */}
      <Toaster />
    </>
  );
};

export default App;
