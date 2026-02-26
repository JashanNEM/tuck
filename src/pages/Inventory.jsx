import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, increment, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  Box, Typography, Stack, Button, TextField, InputAdornment, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Card
} from '@mui/material';
import { 
  QrCodeScanner, Search, Add as AddIcon, Remove as RemoveIcon
} from '@mui/icons-material';

// 1. Metric Card Component for the layout
function MetricCard({ title, value, color, sub, bg }) {
  return (
    <Card sx={{ 
      p: 3, borderRadius: 3, borderLeft: `6px solid ${color}`, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderTop: '1px solid #f0f0f0',
      borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0',
      height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center'
    }}>
      <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</Typography>
      <Typography variant="h3" fontWeight="900" sx={{ color: '#212121', my: 1 }}>{value}</Typography>
      <Box><Chip label={sub} size="small" sx={{ bgcolor: bg, color: color, fontWeight: 700, borderRadius: 1.5 }} /></Box>
    </Card>
  );
}

export default function InventoryPage({ setLastScanned }) {
  const [history, setHistory] = useState([]);
  const [allStock, setAllStock] = useState([]); // All items in DB
  const [salesData, setSalesData] = useState({ revenue: 0, totalSales: 0 }); // Added state for Sales Metrics
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("READY");
  const [loading, setLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState({ count: 0, value: 0, items: 0 });
  const bufferRef = useRef("");

  // Real-time listener for the WHOLE inventory database
  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("lastUpdated", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stockItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllStock(stockItems);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for Sales Data (Revenue & Transactions)
  useEffect(() => {
    const q = query(collection(db, "sales"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRev = 0;
      snapshot.forEach((doc) => {
        totalRev += Number(doc.data().price || 0);
      });
      setSalesData({
        revenue: totalRev,
        totalSales: snapshot.size
      });
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

  // Calculate Critical Items dynamically based on current inventory
  // (Assuming critical means quantity is 2 or less)
  const criticalCount = allStock.filter(item => (item.quantity || 0) <= 2).length;

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
      if (setLastScanned) setLastScanned(barcode);
      setStatus("READY");
    } catch (e) { setStatus("ERROR"); }
    setLoading(false);
  };

  // Get category from item name (simple categorization)
  const getCategory = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('milk') || lower.includes('yogurt') || lower.includes('cheese')) return 'DAIRY';
    if (lower.includes('bread') || lower.includes('wheat') || lower.includes('rice')) return 'STAPLES';
    if (lower.includes('apple') || lower.includes('fruit')) return 'FRUITS';
    if (lower.includes('coke') || lower.includes('soda') || lower.includes('juice')) return 'BEVERAGES';
    if (lower.includes('chip') || lower.includes('snack')) return 'SNACKS';
    return 'GENERAL';
  };

  return (
    // boxSizing and width guarantees the page doesn't break out of the window frame
    <Box sx={{ flexGrow: 1, width: '100%', boxSizing: 'border-box', p: { xs: 2, md: 4 } }}>
      
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5 }}>
            In Shop
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add/Check Stock
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
          {status === "READY" ? "SCANNER IS ACTIVE" : status}
        </Button>
      </Stack>

      {/* TOP METRICS ROW: Forced layout grid using Stack */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MetricCard title="Revenue" value={`₹${salesData.revenue.toFixed(2)}`} color="#1976d2" bg="#e3f2fd" sub="TOTAL INFLOW" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MetricCard title="Units Sold" value={salesData.totalSales} color="#9c27b0" bg="#f3e5f5" sub="TRANSACTIONS" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MetricCard title="Critical Items" value={criticalCount} color="#d32f2f" bg="#ffebee" sub="RESTOCK SOON" />
        </Box>
      </Stack>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search by name or scan code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: '#fff',
            '& fieldset': { borderColor: '#e0e0e0' }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Product Data Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: 'none',
          overflow: 'hidden'
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="inventory table">
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#555' }}>Product Details</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#555' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#555' }}>Barcode</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#555' }}>Price</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#555' }}>Stock Level</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#555' }}>Quick Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStock.map((item) => {
              const category = getCategory(item.name);
              const isLowStock = (item.quantity || 0) <= 2; // Updated low stock rule to match "Critical" rule
              
              return (
                <TableRow
                  key={item.id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#1a1a1a' }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={category}
                      size="small"
                      sx={{
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 24
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', color: '#888', fontSize: '0.85rem' }}>
                    {item.barcode}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#333' }}>
                      ₹{parseFloat(item.price || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="subtitle1"
                      fontWeight="900"
                      sx={{ color: isLowStock ? '#d32f2f' : '#2e7d32' }}
                    >
                      {item.quantity || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: '#ffebee',
                          color: '#d32f2f',
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#ffcdd2' }
                        }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: '#e8f5e9',
                          color: '#2e7d32',
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#c8e6c9' }
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Empty State */}
        {filteredStock.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No products found' : 'No products in inventory'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start scanning items to add them to your inventory
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}