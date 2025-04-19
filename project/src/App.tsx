import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import ClientPage from './pages/ClientPage';
import CasePage from './pages/CasePage';
import TaskPage from './pages/TaskPage';
import AppointmentPage from './pages/AppointmentPage';
import TeamMemberPage from './pages/TeamMemberPage';
import ServicesPage from './pages/ServicesPage';
import InvoicePage from './pages/InvoicePage';
import ChatbotPage from './pages/ChatbotPage';
import SettingsPage from './pages/SettingsPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute allowedRoles={['lawyer']}>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PrivateRoute allowedRoles={['lawyer']}>
            <Layout>
              <ClientPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <PrivateRoute allowedRoles={['lawyer', 'client']}>
            <Layout>
              <CasePage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <PrivateRoute allowedRoles={['lawyer']}>
            <Layout>
              <TaskPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <PrivateRoute allowedRoles={['lawyer']}>
            <Layout>
              <AppointmentPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/team"
        element={
          <PrivateRoute allowedRoles={['lawyer']}>
            <Layout>
              <TeamMemberPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/earnings/services"
        element={
          <PrivateRoute allowedRoles={['lawyer', 'client']}>
            <Layout>
              <ServicesPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/earnings/invoices"
        element={
          <PrivateRoute allowedRoles={['lawyer']}>
            <Layout>
              <InvoicePage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/chatbot"
        element={
          <PrivateRoute allowedRoles={['lawyer', 'client']}>
            <Layout>
              <ChatbotPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute allowedRoles={['lawyer']}>
            <Layout>
              <SettingsPage />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Redirect to login for unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;