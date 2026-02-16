import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, increment, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Box, Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, Stack, Button } from '@mui/material';
import { QrCodeScanner, ReceiptLong } from '@mui/icons-material';

export default function Sales({ setLastScanned }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const bufferRef = useRef("");

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("timestamp", "desc"), limit(20));
    return onSnapshot(q, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const handleKey = async (e) => {
      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        if (code) await handleSale(code);
        bufferRef.current = "";
      } else if (e.key.length === 1) bufferRef.current += e.key;
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSale = async (barcode) => {
    setLoading(true);
    const docRef = doc(db, "inventory", barcode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const item = snap.data();
      await setDoc(docRef, { quantity: increment(-1) }, { merge: true });
      await setDoc(doc(collection(db, "sales")), {
        name: item.name, price: item.price, timestamp: new Date(), barcode
      });
      if (setLastScanned) setLastScanned(barcode);
    } else { alert("Item not in inventory!"); }
    setLoading(false);
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5 }}>
            Sales Terminal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan to sell items
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<QrCodeScanner />}
          sx={{
            borderRadius: 2,
            borderColor: '#1976d2',
            color: '#1976d2',
            fontWeight: 700,
            textTransform: 'none',
            px: 2
          }}
        >
          SCANNER IS ACTIVE
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 3, 
            bgcolor: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: '#e8f5e9', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mx: 'auto', 
              mb: 2 
            }}>
              <QrCodeScanner sx={{ fontSize: 40, color: '#2e7d32' }} />
            </Box>
            <Typography variant="h5" fontWeight="800" sx={{ mb: 1, color: loading ? '#2e7d32' : '#666' }}>
              {loading ? 'SCANNING...' : 'READY TO SCAN'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {loading ? 'Processing sale...' : 'Scan barcode to sell'}
            </Typography>
            {loading && <LinearProgress color="success" sx={{ mt: 2 }} />}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            borderRadius: 3, 
            overflow: 'hidden', 
            minHeight: '70vh',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptLong color="primary" />
                <Typography variant="h6" fontWeight="800">Recent Sales</Typography>
                <Chip label={`${sales.length} transactions`} size="small" sx={{ ml: 'auto' }} />
              </Stack>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 800 }}>TIME</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>ITEM</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>PRICE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>QTY</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#999' }}>
                        No sales yet. Start scanning to record transactions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map(s => (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.timestamp?.toDate().toLocaleTimeString() || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{parseFloat(s.price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label="-1" size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}