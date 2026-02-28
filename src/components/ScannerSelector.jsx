import React, { useState, useEffect } from 'react';
import { Box, Button, Menu, MenuItem, Typography, Stack, Chip } from '@mui/material';
import { Usb, UsbOff } from '@mui/icons-material';

// We safely require electron so the app doesn't crash if run in a normal browser
const electron = window.require ? window.require('electron') : null;

export default function ScannerSelector() {
  const [ports, setPorts] = useState([]);
  const [activePort, setActivePort] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (!electron) return;

    // Listen for connection success/failure
    electron.ipcRenderer.on('serial-connection-status', (event, status) => {
      if (status.success) {
        setActivePort(status.portPath);
      } else {
        alert("Failed to connect to scanner: " + status.error);
        setActivePort(null);
      }
    });

    return () => electron.ipcRenderer.removeAllListeners('serial-connection-status');
  }, []);

  const fetchPortsAndOpen = async (event) => {
    if (electron) {
      const availablePorts = await electron.ipcRenderer.invoke('get-serial-ports');
      setPorts(availablePorts);
    }
    setAnchorEl(event.currentTarget);
  };

  const connectToPort = (portPath) => {
    if (electron) {
      electron.ipcRenderer.send('connect-serial-port', portPath);
    }
    setAnchorEl(null);
  };

  if (!electron) return null; // Hide if not in Electron app

  return (
    <Box>
      <Button
        variant="outlined"
        color={activePort ? "success" : "warning"}
        startIcon={activePort ? <Usb /> : <UsbOff />}
        onClick={fetchPortsAndOpen}
        sx={{ borderRadius: 2, fontWeight: 'bold' }}
      >
        {activePort ? `SCANNER: ${activePort}` : "CONNECT SCANNER"}
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem disabled>
          <Typography variant="caption" fontWeight="bold">SELECT USB PORT</Typography>
        </MenuItem>
        {ports.length === 0 ? (
          <MenuItem disabled>No devices found</MenuItem>
        ) : (
          ports.map(port => (
            <MenuItem key={port.path} onClick={() => connectToPort(port.path)}>
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Typography fontWeight="bold">{port.path}</Typography>
                <Chip size="small" label={port.manufacturer || "Unknown Device"} sx={{ fontSize: '0.65rem' }} />
              </Stack>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}