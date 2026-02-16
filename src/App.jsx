import React, { useState } from 'react';
import { Box, CssBaseline, Stack, Typography, Button, IconButton } from '@mui/material';
import { Home as HomeIcon, Inventory2, PointOfSale, ArrowBack, Psychology, BarChart as BarChartIcon } from '@mui/icons-material';

import HomePage from './pages/Home';
import InventoryPage from './pages/Inventory';
import SalesPage from './pages/Sales';
import Consultant from './pages/Consultant'; 
import Analytics from './pages/Analytics'; 

function App() {
  const [view, setView] = useState("HOME");

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f1f3f5', display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      
      {/* GLOBAL NAVBAR - Fixed at top */}
      <Box sx={{ 
        bgcolor: '#fff', 
        borderBottom: '1px solid #e0e0e0', 
        py: 1.5, px: 4, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000 
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {view !== "HOME" && (
            <IconButton onClick={() => setView("HOME")} size="small"><ArrowBack /></IconButton>
          )}
          <Typography variant="h6" fontWeight="900">TUCK SHOP <span style={{color:'#1976d2'}}>PRO</span></Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<HomeIcon />} onClick={() => setView("HOME")} color={view === "HOME" ? "primary" : "inherit"}>Home</Button>
          <Button startIcon={<Inventory2 />} onClick={() => setView("INVENTORY")} color={view === "INVENTORY" ? "primary" : "inherit"}>Inventory</Button>
          <Button startIcon={<PointOfSale />} onClick={() => setView("SALES")} color={view === "SALES" ? "primary" : "inherit"}>Sales</Button>
          <Button startIcon={<BarChartIcon />} onClick={() => setView("ANALYTICS")} color={view === "ANALYTICS" ? "primary" : "inherit"}>Analytics</Button>
          <Button startIcon={<Psychology />} onClick={() => setView("CONSULTANT")} color={view === "CONSULTANT" ? "primary" : "inherit"}>Consultant</Button>
        </Stack>
      </Box>

      {/* PAGE ROUTING - p: 0 ensures Analytics can go edge-to-edge */}
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        {view === "HOME" && <Box sx={{ p: 3 }}><HomePage setView={setView} /></Box>}
        {view === "INVENTORY" && <Box sx={{ p: 3 }}><InventoryPage /></Box>}
        {view === "SALES" && <Box sx={{ p: 3 }}><SalesPage /></Box>}
        
        {/* Analytics controls its own padding internally */}
        {view === "ANALYTICS" && <Analytics />}
        
        {view === "CONSULTANT" && <Box sx={{ p: 3 }}><Consultant /></Box>}
      </Box>
    </Box>
  );
}

export default App;