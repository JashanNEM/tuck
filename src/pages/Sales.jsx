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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5, color: '#1a1a1a' }}>Point of Sale</Typography>
          <Typography variant="body2" color="text.secondary">Scan barcodes to process transactions automatically</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#fff',
            boxShadow: loading ? '0 0 0 4px rgba(46, 125, 50, 0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(224, 224, 224, 0.4)', height: '100%',
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{ 
              width: 100, height: 100, borderRadius: '50%', mx: 'auto', mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              bgcolor: loading ? '#e8f5e9' : '#f5f5f5',
              color: loading ? '#2e7d32' : '#9e9e9e',
              boxShadow: loading ? '0 8px 24px rgba(46, 125, 50, 0.2)' : 'none'
            }}>
              <QrCodeScanner sx={{ fontSize: 50 }} />
            </Box>
            <Typography variant="h5" fontWeight="900" sx={{ mb: 1, color: loading ? '#2e7d32' : '#424242' }}>
              {loading ? 'PROCESSING...' : 'READY TO SCAN'}
            </Typography>
            <Typography variant="body2" fontWeight="600" color="text.secondary" sx={{ mb: 3 }}>
              {loading ? 'Recording sale to database...' : 'Awaiting barcode input'}
            </Typography>
            {loading ? <LinearProgress color="success" sx={{ height: 6, borderRadius: 3 }} /> : 
              <Box sx={{ height: 6, bgcolor: '#f0f0f0', borderRadius: 3 }} />}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            borderRadius: 3, overflow: 'hidden', minHeight: '60vh',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(224, 224, 224, 0.4)'
          }}>
            <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid rgba(224, 224, 224, 0.4)' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <ReceiptLong sx={{ color: '#1976d2' }} />
                <Typography variant="h6" fontWeight="800" color="#212121">Transaction Log</Typography>
                <Chip label={`${sales.length} today`} size="small" sx={{ ml: 'auto', bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 700 }} />
              </Stack>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 500 }}>
                <TableHead sx={{ bgcolor: '#fafafa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#757575', py: 2 }}>TIME</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#757575', py: 2 }}>ITEM PURCHASED</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#757575', py: 2 }}>PRICE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#757575', py: 2 }}>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8, color: '#9e9e9e' }}>
                        <Typography variant="subtitle1" fontWeight="600">No transactions recorded yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map(s => (
                      <TableRow key={s.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8f9fa' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#757575' }}>
                          {s.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#212121' }}>{s.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#424242' }}>
                          ₹{parseFloat(s.price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label="SOLD" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800, borderRadius: 1.5 }} />
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