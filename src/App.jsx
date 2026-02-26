import React, { useState } from 'react';
import { Box, CssBaseline, Stack, Typography, Paper, Drawer, IconButton, Avatar } from '@mui/material';
import { 
  Home as HomeIcon, 
  Inventory2, 
  PointOfSale, 
  MenuBook, // <-- Added for Khaata
  HelpOutline,
  Menu as MenuIcon,
  Storefront
} from '@mui/icons-material';

import HomePage from './pages/Home';
import InventoryPage from './pages/Inventory';
import SalesPage from './pages/Sales'; 
import Khaata from './pages/Khaata'; // <-- Imported Khaata page

function App() {
  const [view, setView] = useState("INVENTORY"); // Defaulted to Inventory for testing
  const [lastScanned, setLastScanned] = useState("---");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "HOME", label: "Dashboard", subtext: "Today's Summary", icon: <HomeIcon /> },
    { id: "SALES", label: "Point of Sale", subtext: "Scan & Sell", icon: <PointOfSale /> },
    { id: "INVENTORY", label: "Inventory", subtext: "Manage Stock", icon: <Inventory2 /> },
    { id: "KHAATA", label: "Khaata", subtext: "Ledgers & Debts", icon: <MenuBook /> }, // <-- Added Khaata to Sidebar
  ];

  const renderSidebarContent = () => (
    <>
      {/* Branding */}
      <Box sx={{ p: 3, pb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#fff', color: '#0056FF', width: 48, height: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Storefront />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ color: '#fff', letterSpacing: '-0.5px' }}>
            TuckShop
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '1px' }}>
            SMART MANAGER
          </Typography>
        </Box>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ px: 2, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <Box
              key={item.id}
              onClick={() => { setView(item.id); setMobileOpen(false); }}
              sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 2.5,
                bgcolor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ 
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', 
                  display: 'flex', 
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 2,
                  bgcolor: isActive ? '#0047d1' : 'transparent'
                }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={isActive ? 700 : 500} sx={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.85)' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                    {item.subtext}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* Scanner Status */}
      <Box sx={{ px: 2, mt: 'auto', mb: 3 }}>
        <Paper sx={{ 
          bgcolor: 'rgba(0,0,0,0.15)', 
          p: 2, 
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ 
              width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50',
              boxShadow: '0 0 10px rgba(76, 175, 80, 0.8)'
            }} />
            <Typography variant="caption" fontWeight="800" sx={{ color: '#fff', letterSpacing: '0.5px' }}>
              SCANNER READY
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.5 }}>
            LAST SCANNED
          </Typography>
          <Typography variant="body2" fontWeight="700" sx={{ color: '#fff', fontFamily: 'monospace' }}>
            {lastScanned}
          </Typography>
        </Paper>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <CssBaseline />
      
      {/* Desktop Sidebar */}
      <Box sx={{ 
        width: { xs: 0, md: 280 },
        bgcolor: '#0056FF',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        boxShadow: '4px 0 24px rgba(0,0,0,0.05)',
        zIndex: 1200
      }}>
        {renderSidebarContent()}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, bgcolor: '#0056FF' }
        }}
      >
        {renderSidebarContent()}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        marginLeft: { xs: 0, md: '280px' },
        width: { xs: '100%', md: 'calc(100% - 280px)' },
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Mobile Header */}
        <Box sx={{ 
          display: { xs: 'flex', md: 'none' },
          bgcolor: '#fff',
          color: '#1a1a1a',
          p: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          alignItems: 'center',
          boxShadow: '0 1px 12px rgba(0,0,0,0.05)'
        }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#1a1a1a', mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Box>
            <Typography variant="subtitle1" fontWeight="800">TuckShop</Typography>
          </Box>
        </Box>

        {/* Page Content Container */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
          {view === "HOME" && <HomePage setView={setView} />}
          {view === "INVENTORY" && <InventoryPage setLastScanned={setLastScanned} />}
          {view === "SALES" && <SalesPage setLastScanned={setLastScanned} />}
          {view === "KHAATA" && <Khaata />} {/* <-- Added Khaata component here */}
        </Box>
      </Box>
    </Box>
  );
}

export default App;