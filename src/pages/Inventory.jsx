import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, increment, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  Box, Grid, Typography, Card, CardContent, 
  Stack, Button, TextField, InputAdornment, Chip
} from '@mui/material';
import { 
  QrCodeScanner, Search
} from '@mui/icons-material';

export default function InventoryPage({ setLastScanned }) {
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
    <Box>
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
          SCANNER IS ACTIVE
        </Button>
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

      {/* Product Grid - SmartShop Card Style */}
      <Grid container spacing={2}>
        {filteredStock.map((item) => {
          const category = getCategory(item.name);
          const isLowStock = (item.quantity || 0) < 10;
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  border: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Top Row: Category & Price */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Chip
                      label={category}
                      size="small"
                      sx={{
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20
                      }}
                    />
                    <Typography variant="h6" fontWeight="900" sx={{ color: '#333' }}>
                      ₹{parseFloat(item.price || 0).toFixed(2)}
                    </Typography>
                  </Stack>

                  {/* Product Name */}
                  <Typography variant="h6" fontWeight="800" sx={{ mb: 0.5, color: '#1a1a1a' }}>
                    {item.name}
                  </Typography>

                  {/* Product Code */}
                  <Typography variant="caption" sx={{ color: '#888', mb: 2, fontFamily: 'monospace' }}>
                    CODE: {item.barcode}
                  </Typography>

                  {/* Bottom: Stock Control */}
                  <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f0f0f0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5 }}>
                          ITEMS IN SHOP
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight="900"
                          sx={{ color: isLowStock ? '#d32f2f' : '#333' }}
                        >
                          {item.quantity || 0}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          sx={{
                            minWidth: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: '#ffebee',
                            color: '#d32f2f',
                            fontWeight: 800,
                            '&:hover': { bgcolor: '#ffcdd2' }
                          }}
                        >
                          −
                        </Button>
                        <Button
                          size="small"
                          sx={{
                            minWidth: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: '#e8f5e9',
                            color: '#2e7d32',
                            fontWeight: 800,
                            '&:hover': { bgcolor: '#c8e6c9' }
                          }}
                        >
                          +
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

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
    </Box>
  );
}