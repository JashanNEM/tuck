import React, { useState } from 'react';
import { Box, CssBaseline, Stack, Typography, Paper, Chip, Drawer, IconButton } from '@mui/material';
import { 
  Home as HomeIcon, 
  Inventory2, 
  PointOfSale, 
  Psychology, 
  BarChart as BarChartIcon,
  QrCodeScanner,
  HelpOutline,
  Menu as MenuIcon
} from '@mui/icons-material';

import HomePage from './pages/Home';
import InventoryPage from './pages/Inventory';
import SalesPage from './pages/Sales';
import Consultant from './pages/Consultant'; 
import Analytics from './pages/Analytics'; 

function App() {
  const [view, setView] = useState("HOME");
  const [lastScanned, setLastScanned] = useState("---");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "HOME", label: "Home Screen", subtext: "Today's Summary", icon: <HomeIcon /> },
    { id: "INVENTORY", label: "Items in Shop", subtext: "Add/Check Stock", icon: <Inventory2 /> },
    { id: "SALES", label: "Sales Terminal", subtext: "Scan to sell", icon: <PointOfSale /> },
    { id: "ANALYTICS", label: "Analytics", subtext: "Store insights", icon: <BarChartIcon /> },
    { id: "CONSULTANT", label: "Consultant", subtext: "AI recommendations", icon: <Psychology /> },
  ];

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', bgcolor: '#f5f7fa' }}>
      <CssBaseline />
      
      {/* LEFT SIDEBAR - SmartShop Style */}
      <Box sx={{ 
        width: { xs: 0, md: 280 },
        bgcolor: '#0056FF',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 1200
      }}>
        {/* Branding */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 0.5 }}>
            TUCK SHOP
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
            SIMPLE MANAGER
          </Typography>
        </Box>

        {/* Navigation Items */}
        <Box sx={{ px: 2, py: 1 }}>
          {navItems.map((item) => {
            const isActive = view === item.id;
            return (
              <Box
                key={item.id}
                onClick={() => setView(item.id)}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 3,
                  bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={isActive ? 800 : 600} sx={{ color: '#fff' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
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
            bgcolor: '#e8f5e9', 
            p: 2, 
            borderRadius: 2,
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: '#4caf50',
                boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)'
              }} />
              <Typography variant="caption" fontWeight="700" sx={{ color: '#2e7d32' }}>
                SCANNER READY
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
              LAST CODE SCANNED
            </Typography>
            <Typography variant="body2" fontWeight="700" sx={{ color: '#333', fontFamily: 'monospace' }}>
              {lastScanned}
            </Typography>
          </Paper>
        </Box>

        {/* Help Section */}
        <Box sx={{ px: 2, pb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <HelpOutline fontSize="small" />
            <Typography variant="caption">Need Help?</Typography>
          </Stack>
        </Box>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box sx={{ 
        flexGrow: 1, 
        marginLeft: { xs: 0, md: '280px' },
        width: { xs: '100%', md: 'calc(100% - 280px)' },
        minHeight: '100vh',
        bgcolor: '#f5f7fa'
      }}>
        {/* Mobile Header */}
        <Box sx={{ 
          display: { xs: 'flex', md: 'none' },
          bgcolor: '#0056FF',
          color: '#fff',
          p: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton 
              onClick={() => setMobileOpen(true)}
              sx={{ color: '#fff' }}
            >
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="900">TUCK SHOP</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>SIMPLE MANAGER</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              bgcolor: '#0056FF'
            }
          }}
        >
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 0.5 }}>
              TUCK SHOP
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
              SIMPLE MANAGER
            </Typography>
          </Box>

          <Box sx={{ px: 2, py: 1 }}>
            {navItems.map((item) => {
              const isActive = view === item.id;
              return (
                <Box
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setMobileOpen(false);
                  }}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 3,
                    bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={isActive ? 800 : 600} sx={{ color: '#fff' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                        {item.subtext}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ px: 2, mt: 'auto', mb: 3 }}>
            <Paper sx={{ 
              bgcolor: '#e8f5e9', 
              p: 2, 
              borderRadius: 2,
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#4caf50',
                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)'
                }} />
                <Typography variant="caption" fontWeight="700" sx={{ color: '#2e7d32' }}>
                  SCANNER READY
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                LAST CODE SCANNED
              </Typography>
              <Typography variant="body2" fontWeight="700" sx={{ color: '#333', fontFamily: 'monospace' }}>
                {lastScanned}
              </Typography>
            </Paper>
          </Box>
        </Drawer>

        {/* Page Content */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {view === "HOME" && <HomePage setView={setView} />}
          {view === "INVENTORY" && <InventoryPage setLastScanned={setLastScanned} />}
          {view === "SALES" && <SalesPage setLastScanned={setLastScanned} />}
          {view === "ANALYTICS" && <Analytics />}
          {view === "CONSULTANT" && <Consultant />}
        </Box>
      </Box>
    </Box>
  );
}

export default App;