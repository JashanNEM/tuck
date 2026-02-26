import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, addDoc, updateDoc, increment, collection, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore";
import { 
  Box, Typography, Stack, Button, TextField, InputAdornment, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Card,
  Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { 
  QrCodeScanner, Search, Add as AddIcon, Remove as RemoveIcon
} from '@mui/icons-material';

// Helper to get local date string in YYYY-MM-DD format natively
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SHELF_LIFE_DAYS = {
  'FRESH': 1,
  'DAIRY': 4,
  'STAPLES': 3,
  'FRUITS': 7,
  'SNACKS': 90,
  'BEVERAGES': 180,
  'GENERAL': 30
};

const getCategory = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('sandwich') || lower.includes('roll') || lower.includes('fresh') || lower.includes('paneer')) return 'FRESH';
  if (lower.includes('milk') || lower.includes('yogurt') || lower.includes('cheese') || lower.includes('lassi')) return 'DAIRY';
  if (lower.includes('bread') || lower.includes('wheat') || lower.includes('rice')) return 'STAPLES';
  if (lower.includes('apple') || lower.includes('fruit')) return 'FRUITS';
  if (lower.includes('coke') || lower.includes('soda') || lower.includes('juice')) return 'BEVERAGES';
  if (lower.includes('chip') || lower.includes('snack') || lower.includes('chocolate')) return 'SNACKS';
  return 'GENERAL';
};

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

function ExpiryAlerts({ expired, expiringToday, expiringTomorrow }) {
  return (
    <Card sx={{ p: 3, borderRadius: 3, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
      <Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>Expiry & Waste Radar</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Box sx={{ flex: 1, p: 2, bgcolor: '#ffebee', borderRadius: 2, borderLeft: '4px solid #d32f2f' }}>
          <Typography variant="caption" color="error" fontWeight="bold">EXPIRED</Typography>
          <Typography variant="h4" fontWeight="900" color="#c62828">{expired}</Typography>
          <Typography variant="body2" color="text.secondary">Items still in stock</Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: '#fff3e0', borderRadius: 2, borderLeft: '4px solid #ed6c02' }}>
          <Typography variant="caption" sx={{ color: '#e65100' }} fontWeight="bold">EXPIRING TODAY</Typography>
          <Typography variant="h4" fontWeight="900" color="#ef6c00">{expiringToday}</Typography>
          <Typography variant="body2" color="text.secondary">Needs immediate action</Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: '#fff8e1', borderRadius: 2, borderLeft: '4px solid #fbc02d' }}>
          <Typography variant="caption" sx={{ color: '#f57f17' }} fontWeight="bold">EXPIRING TOMORROW</Typography>
          <Typography variant="h4" fontWeight="900" color="#f9a825">{expiringTomorrow}</Typography>
          <Typography variant="body2" color="text.secondary">Clearance opportunity</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export default function InventoryPage({ setLastScanned }) {
  const [allStock, setAllStock] = useState([]); 
  const [salesData, setSalesData] = useState({ revenue: 0, totalSales: 0 }); 
  const [batches, setBatches] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("READY");
  const bufferRef = useRef("");

  const [scanDialog, setScanDialog] = useState({
    open: false, barcode: "", name: "", price: "", qty: 1, isNew: false, expiryDate: ""
  });

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("lastUpdated", "desc"));
    return onSnapshot(q, (snapshot) => {
      setAllStock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(query(collection(db, "sales")), (snapshot) => {
      let totalRev = 0;
      snapshot.forEach((doc) => totalRev += Number(doc.data().price || 0));
      setSalesData({ revenue: totalRev, totalSales: snapshot.size });
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "batches"), where("qty_remaining", ">", 0));
    return onSnapshot(q, (snapshot) => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);

  let expiredCount = 0, expiringTodayCount = 0, expiringTomorrowCount = 0;
  batches.forEach(b => {
    if(!b.expiry_date) return;
    const exp = b.expiry_date.toDate();
    exp.setHours(0,0,0,0);
    if(exp < today) expiredCount += b.qty_remaining;
    else if(exp.getTime() === today.getTime()) expiringTodayCount += b.qty_remaining;
    else if(exp.getTime() === tomorrow.getTime()) expiringTomorrowCount += b.qty_remaining;
  });

  const filteredStock = allStock.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (item.name || "").toLowerCase().includes(term) || (item.barcode || "").toLowerCase().includes(term);
  });

  const criticalCount = allStock.filter(item => (item.quantity || 0) <= 2).length;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        if (barcode.length > 2) processScan(barcode);
        bufferRef.current = "";
      } else if (e.key.length === 1) bufferRef.current += e.key;
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const processScan = async (barcode) => {
    setStatus("SCANNING...");
    try {
      const docRef = doc(db, "inventory", barcode);
      const docSnap = await getDoc(docRef);
      let name = "", price = "";

      if (docSnap.exists()) {
        const data = docSnap.data();
        name = data.name; price = data.price;
      } else {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await res.json();
        if (data.status === 1) name = `${data.product.brands || ''} ${data.product.product_name}`.trim();
      }

      setScanDialog({ 
        open: true, barcode, name: name || "", price: price !== "" ? price : "", 
        qty: 1, isNew: !name || price === "", expiryDate: getTodayStr() 
      });
      setStatus("READY");
    } catch (e) { setStatus("ERROR"); }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const { barcode, name, price, qty, expiryDate } = scanDialog;
    
    const finalName = name.trim() || "Unknown";
    const finalQty = parseInt(qty) || 1;
    const finalPrice = parseFloat(price) || 0;

    const docRef = doc(db, "inventory", barcode);
    await setDoc(docRef, { name: finalName, price: finalPrice, quantity: increment(finalQty), barcode, lastUpdated: new Date() }, { merge: true });

    if (finalQty > 0) {
      let expDate = null;
      
      // 👉 SMART FALLBACK CHECK:
      // If the date is exactly today's date, we assume the user left the default value and didn't actively enter an expiry.
      if (expiryDate && expiryDate !== getTodayStr()) {
        expDate = new Date(expiryDate);
      } else {
        // User didn't change it -> Apply Shelf-Life Fallback
        const cat = getCategory(finalName);
        const days = SHELF_LIFE_DAYS[cat] || 30;
        expDate = new Date();
        expDate.setDate(expDate.getDate() + days);
      }
      
      await addDoc(collection(db, "batches"), {
        productId: barcode, productName: finalName, qty_remaining: finalQty, expiry_date: expDate, created_at: new Date()
      });
    } else if (finalQty < 0) {
      const batchesQ = query(collection(db, "batches"), where("productId", "==", barcode), where("qty_remaining", ">", 0));
      const batchSnap = await getDocs(batchesQ);
      if (!batchSnap.empty) {
          const sortedBatches = batchSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => a.expiry_date.toDate() - b.expiry_date.toDate());
          
          let remainingToDeduct = Math.abs(finalQty);
          for (const b of sortedBatches) {
              if (remainingToDeduct <= 0) break;
              const deductAmt = Math.min(b.qty_remaining, remainingToDeduct);
              await updateDoc(doc(db, "batches", b.id), { qty_remaining: increment(-deductAmt) });
              remainingToDeduct -= deductAmt;
          }
      }
    }

    if (setLastScanned) setLastScanned(barcode);
    setScanDialog({ open: false, barcode: "", name: "", price: "", qty: 1, isNew: false, expiryDate: "" });
  };

  return (
    <Box sx={{ flexGrow: 1, width: '100%', boxSizing: 'border-box', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5 }}>In Shop</Typography>
          <Typography variant="body2" color="text.secondary">Add/Check Stock</Typography>
        </Box>
        <Button variant="outlined" startIcon={<QrCodeScanner />} sx={{ borderRadius: 2, borderColor: '#1976d2', color: '#1976d2', fontWeight: 700, textTransform: 'none', px: 2 }}>
          {status === "READY" ? "SCANNER IS ACTIVE" : status}
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}><MetricCard title="Revenue" value={`₹${salesData.revenue.toFixed(2)}`} color="#1976d2" bg="#e3f2fd" sub="TOTAL INFLOW" /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><MetricCard title="Units Sold" value={salesData.totalSales} color="#9c27b0" bg="#f3e5f5" sub="TRANSACTIONS" /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><MetricCard title="Critical Items" value={criticalCount} color="#d32f2f" bg="#ffebee" sub="RESTOCK SOON" /></Box>
      </Stack>

      <ExpiryAlerts expired={expiredCount} expiringToday={expiringTodayCount} expiringTomorrow={expiringTomorrowCount} />

      <TextField
        fullWidth placeholder="Search by name or scan code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff', '& fieldset': { borderColor: '#e0e0e0' } } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
      />

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: 'none', overflow: 'hidden' }}>
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
              const isLowStock = (item.quantity || 0) <= 2;
              
              return (
                <TableRow key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }, transition: 'background-color 0.2s' }}>
                  <TableCell component="th" scope="row"><Typography variant="subtitle2" fontWeight="800" sx={{ color: '#1a1a1a' }}>{item.name}</Typography></TableCell>
                  <TableCell><Chip label={category} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 700, fontSize: '0.65rem', height: 24 }} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', color: '#888', fontSize: '0.85rem' }}>{item.barcode}</TableCell>
                  <TableCell align="right"><Typography variant="subtitle2" fontWeight="800" sx={{ color: '#333' }}>₹{parseFloat(item.price || 0).toFixed(2)}</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle1" fontWeight="900" sx={{ color: isLowStock ? '#d32f2f' : '#2e7d32' }}>{item.quantity || 0}</Typography></TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" onClick={() => { setScanDialog({ open: true, barcode: item.barcode, name: item.name, price: item.price, qty: -1, isNew: false, expiryDate: "" }); }} sx={{ bgcolor: '#ffebee', color: '#d32f2f', borderRadius: 1.5, '&:hover': { bgcolor: '#ffcdd2' } }}><RemoveIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => { setScanDialog({ open: true, barcode: item.barcode, name: item.name, price: item.price, qty: 1, isNew: false, expiryDate: getTodayStr() }); }} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', borderRadius: 1.5, '&:hover': { bgcolor: '#c8e6c9' } }}><AddIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={scanDialog.open} onClose={() => setScanDialog(prev => ({ ...prev, open: false }))} PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}>
        <form onSubmit={handleScanSubmit}>
          <DialogTitle sx={{ fontWeight: 900, pb: 1, bgcolor: '#f8f9fa' }}>
            {scanDialog.isNew ? "New Item Scanned" : `Update ${scanDialog.name}`}
          </DialogTitle>
          <DialogContent sx={{ pt: '24px !important' }}>
            {scanDialog.isNew && (
              <>
                <TextField autoFocus margin="dense" label="Product Name" fullWidth variant="outlined" required value={scanDialog.name} onChange={(e) => setScanDialog(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
                <TextField margin="dense" label="Price (₹)" type="number" fullWidth variant="outlined" required value={scanDialog.price} onChange={(e) => setScanDialog(p => ({ ...p, price: e.target.value }))} sx={{ mb: 2 }} />
              </>
            )}
            <TextField autoFocus={!scanDialog.isNew} margin="dense" label="Quantity" type="number" fullWidth variant="outlined" required value={scanDialog.qty} onChange={(e) => setScanDialog(p => ({ ...p, qty: e.target.value }))} helperText="Negative numbers deduct stock" sx={{ mb: 2 }} />
            
            {scanDialog.qty > 0 && (
              <TextField 
                margin="dense" label="Expiry Date" type="date" fullWidth variant="outlined" 
                value={scanDialog.expiryDate} onChange={(e) => setScanDialog(p => ({ ...p, expiryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                helperText="Leave as today to auto-assign based on item category"
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => setScanDialog(prev => ({ ...prev, open: false }))} sx={{ fontWeight: 700, color: '#757575' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, borderRadius: 2, px: 3, boxShadow: 'none' }}>Save Stock</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}