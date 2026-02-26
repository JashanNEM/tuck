import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Stack, Chip, Paper, Button, Avatar } from '@mui/material';
import { 
  Inventory2, 
  Warning, 
  AccessTime, 
  AttachMoney,
  QrCodeScanner,
  ArrowForwardIos
} from '@mui/icons-material';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';

export default function Home({ setView }) {
  const [stats, setStats] = useState({
    shopItems: 0,
    lowStock: 0,
    oldItems: 0,
    loanTotal: 0
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);

  useEffect(() => {
    const invUnsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lowStockCount = items.filter(item => (item.quantity || 0) <= 5).length;
      setStats(prev => ({ ...prev, shopItems: items.length, lowStock: lowStockCount }));
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const salesQuery = query(
      collection(db, "sales"),
      where("timestamp", ">=", Timestamp.fromDate(today)),
      orderBy("timestamp", "desc")
    );
    
    const salesUnsub = onSnapshot(salesQuery, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentLoans(sales.slice(0, 4)); // Show top 4
      setStats(prev => ({ ...prev, loanTotal: sales.length }));
    });

    return () => { invUnsub(); salesUnsub(); };
  }, []);

  const summaryCards = [
    { icon: <Inventory2 />, value: stats.shopItems, title: "Total Items", sub: "INVENTORY", color: '#1976d2', bg: '#e3f2fd' },
    { icon: <Warning />, value: stats.lowStock, title: "Low Stock", sub: "ACTION NEEDED", color: '#d32f2f', bg: '#ffebee' },
    { icon: <AccessTime />, value: stats.oldItems, title: "Expiring", sub: "CHECK DATES", color: '#ed6c02', bg: '#fff3e0' },
    { icon: <AttachMoney />, value: stats.loanTotal, title: "Sales Today", sub: "TRANSACTIONS", color: '#2e7d32', bg: '#e8f5e9' }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5, color: '#1a1a1a' }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Store overview and quick insights</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<QrCodeScanner />}
          onClick={() => setView('SALES')}
          sx={{
            borderRadius: 2, bgcolor: '#1976d2', color: '#fff', fontWeight: 700, textTransform: 'none', px: 3,
            boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)'
          }}
        >
          GO TO POS
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{
              borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(224, 224, 224, 0.4)',
              height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 48, height: 48, borderRadius: 2 }}>
                    {card.icon}
                  </Avatar>
                </Stack>
                <Typography variant="h3" fontWeight="900" sx={{ mb: 0.5, color: '#212121' }}>{card.value}</Typography>
                <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#757575' }}>{card.title}</Typography>
                <Typography variant="caption" fontWeight="700" sx={{ color: card.color, textTransform: 'uppercase' }}>{card.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(224, 224, 224, 0.4)', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="800" color="#212121">Check Freshness</Typography>
              {expiringItems.length > 0 && <Chip label="URGENT" size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }} />}
            </Stack>
            {expiringItems.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <AccessTime sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                <Typography variant="body1" fontWeight="600" color="text.secondary">All items are fresh!</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {expiringItems.map((item, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="800" color="#212121">{item.name}</Typography>
                      <Typography variant="caption" fontWeight="600" color="#757575">{item.quantity} IN STOCK</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ display: 'block' }}>EXPIRES</Typography>
                      <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#d32f2f' }}>{item.expiryDate}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(224, 224, 224, 0.4)', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="800" color="#212121">Recent Sales</Typography>
              <Chip label="LIVE" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
            </Stack>
            {recentLoans.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                <Typography variant="body1" fontWeight="600" color="text.secondary">No sales today yet</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {recentLoans.map((sale, i) => (
                  <Box key={sale.id || i} sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ width: 40, height: 40, bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 800 }}>
                        {sale.name?.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="800" color="#212121">{sale.name || 'Unknown Item'}</Typography>
                        <Typography variant="caption" fontWeight="600" color="#9e9e9e">{sale.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Just now'}</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight="900" color="#2e7d32">₹{parseFloat(sale.price || 0).toFixed(2)}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}