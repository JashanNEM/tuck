import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, increment, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Box, Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress } from '@mui/material';
import { QrCodeScanner, ReceiptLong } from '@mui/icons-material';

export default function Sales() {
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
    } else { alert("Item not in inventory!"); }
    setLoading(false);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 5, bgcolor: '#1a1a1a', color: '#4caf50' }}>
          <QrCodeScanner sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" fontWeight="900">LIVE SCAN</Typography>
          <Typography sx={{ color: '#fff', opacity: 0.6 }}>Scanning in progress...</Typography>
          {loading && <LinearProgress color="success" sx={{ mt: 2 }} />}
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper sx={{ borderRadius: 5, overflow: 'hidden', minHeight: '70vh' }}>
          <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="800"><ReceiptLong /> LAST 20 SALES</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead><TableRow>
                <TableCell>TIME</TableCell><TableCell>ITEM</TableCell>
                <TableCell align="right">PRICE</TableCell><TableCell align="right">QTY</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.timestamp?.toDate().toLocaleTimeString()}</TableCell>
                    <TableCell fontWeight="700">{s.name}</TableCell>
                    <TableCell align="right">₹{s.price}</TableCell>
                    <TableCell align="right"><Chip label="-1" size="small" color="error" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}