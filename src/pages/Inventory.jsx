import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, increment, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  Box, Grid, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, LinearProgress, Card, CardContent, 
  Stack, CssBaseline, Button, TextField, InputAdornment, IconButton, Divider, Chip
} from '@mui/material';
import { 
  QrCodeScanner, ShoppingBag, AttachMoney, Search, Settings, 
  DeleteSweep, Keyboard, TrendingUp, AccessTime, Inventory2, LocalFireDepartment
} from '@mui/icons-material';

function App() {
  const [history, setHistory] = useState([]);
  const [allStock, setAllStock] = useState([]); // All items in DB
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("READY");
  const [loading, setLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState({ count: 0, value: 0, items: 0 });
  const bufferRef = useRef("");

  // Real-time listener for the WHOLE database
  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("lastUpdated", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stockItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllStock(stockItems);
    });
    return () => unsubscribe();
  }, []);

  const filteredStock = allStock.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(term) ||
      (item.barcode || "").toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        if (barcode.length > 2) processScan(barcode);
        bufferRef.current = "";
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const processScan = async (barcode) => {
    setLoading(true);
    setStatus("SCANNING...");
    try {
      const docRef = doc(db, "inventory", barcode);
      const docSnap = await getDoc(docRef);
      let name = "", price = 0;

      if (docSnap.exists()) {
        const data = docSnap.data();
        name = data.name; price = data.price;
      } else {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await res.json();
        if (data.status === 1) name = `${data.product.brands || ''} ${data.product.product_name}`.trim();
      }

      if (!name) name = prompt("New Item Name:") || "Unknown";
      const qtyStr = prompt(`Qty for ${name}:`, "1");
      if (qtyStr === null) { setStatus("READY"); setLoading(false); return; }
      const qty = parseInt(qtyStr) || 1;
      if (price === 0) price = parseFloat(prompt(`Price for ${name}:`, "0")) || 0;

      await setDoc(docRef, { name, price, quantity: increment(qty), barcode, lastUpdated: new Date() }, { merge: true });

      const itemInfo = { name, qty, price, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setHistory(prev => [itemInfo, ...prev].slice(0, 5));
      setSessionStats(prev => ({ count: prev.count + qty, value: prev.value + (price * qty), items: prev.items + 1 }));
      setStatus("READY");
    } catch (e) { setStatus("ERROR"); }
    setLoading(false);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100%', overflowX: 'hidden' }}>
      <CssBaseline />
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2, sm: 3 },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: { xs: 2, md: 3 },
            border: '1px solid #e0e0e0',
            py: { xs: 1.25, md: 1.75 },
            px: { xs: 2, sm: 3 },
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                bgcolor: '#1976d2',
                p: 0.75,
                borderRadius: 2,
                display: 'flex',
              }}
            >
              <ShoppingBag sx={{ color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="800">
                Inventory Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live view of every product in your tuck shop
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box>
        {/* STATS */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
  { label: 'Session Units', val: sessionStats.count, icon: <ShoppingBag />, color: '#e3f2fd', iconCol: '#1976d2' },
  { label: 'Session Value', val: `₹${sessionStats.value.toLocaleString('en-IN')}`, icon: <AttachMoney />, color: '#e8f5e9', iconCol: '#2e7d32' },
  { label: 'Unique Items', val: allStock.length, icon: <Inventory2 />, color: '#f3e5f5', iconCol: '#9c27b0' },
  { label: 'Total Stock Value', val: `₹${allStock.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('en-IN')}`, icon: <TrendingUp />, color: '#fff3e0', iconCol: '#ed6c02' },
].map((card, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #ddd' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase' }}>{card.label}</Typography>
                    <Typography variant="h5" fontWeight="800">{card.val}</Typography>
                  </Box>
                  <Box sx={{ bgcolor: card.color, p: 1, borderRadius: 2, color: card.iconCol, display: 'flex' }}>{card.icon}</Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* LEFT: SCANNER & RECENT SESSION (Takes 35% of space) */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid #ddd', bgcolor: '#fff' }}>
                {loading && <LinearProgress sx={{ mb: 2 }} />}
                <Box sx={{ width: 80, height: 80, bgcolor: '#e3f2fd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <QrCodeScanner sx={{ fontSize: 40, color: '#1976d2' }} />
                </Box>
                <Typography variant="h5" fontWeight="800" gutterBottom>{status}</Typography>
                <Button variant="contained" disableElevation fullWidth sx={{ borderRadius: 2, py: 1, fontWeight: 700 }}>Manual Entry</Button>
              </Paper>

              <Paper sx={{ borderRadius: 4, border: '1px solid #ddd', overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
                  <Typography variant="subtitle2" fontWeight="800">LAST SCANNED</Typography>
                </Box>
                <Table size="small">
                  <TableBody>
                    {history.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 800 }}>+{row.qty}</TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && <TableRow><TableCell align="center" sx={{ py: 4, color: '#999' }}>No scans yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Paper>
            </Stack>
          </Grid>

          {/* RIGHT: COMPLETE INVENTORY DATABASE (Takes 65% of space) */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                borderRadius: 4,
                border: '1px solid #ddd',
                minHeight: { xs: 420, md: 560 },
                bgcolor: '#fff',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  borderBottom: '1px solid #eee',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Inventory2 color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight="800">
                    Current Inventory Database
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search by name or barcode"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Chip
                    label={`${filteredStock.length} Products`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  />
                </Stack>
              </Box>

              <TableContainer
                sx={{
                  flex: 1,
                  maxHeight: { xs: 360, md: 'calc(100vh - 320px)' },
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          bgcolor: '#f8f9fa',
                          color: '#666',
                          minWidth: 160,
                        }}
                      >
                        PRODUCT
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          bgcolor: '#f8f9fa',
                          color: '#666',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        BARCODE
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 800,
                          bgcolor: '#f8f9fa',
                          color: '#666',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        PRICE (₹)
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 800,
                          bgcolor: '#f8f9fa',
                          color: '#666',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        STOCK LEVEL
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredStock.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            maxWidth: 220,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </TableCell>
                        <TableCell sx={{ color: '#888', fontFamily: 'monospace' }}>
                          {item.barcode}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹
                          {parseFloat(item.price).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.quantity}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: item.quantity < 10 ? '#ffebee' : '#e8f5e9',
                              color: item.quantity < 10 ? '#c62828' : '#2e7d32',
                              border: item.quantity < 10 ? '1px solid #ffcdd2' : 'none',
                              minWidth: 45,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
        </Box>
      </Box>
    </Box>
  );
}

export default App;