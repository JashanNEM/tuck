import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Stack, Chip, Paper, Button } from '@mui/material';
import { 
  Inventory2, 
  Warning, 
  AccessTime, 
  AttachMoney,
  QrCodeScanner
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
    // Fetch inventory stats
    const invUnsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lowStockCount = items.filter(item => (item.quantity || 0) < 10).length;
      setStats(prev => ({
        ...prev,
        shopItems: items.length,
        lowStock: lowStockCount
      }));
    });

    // Fetch recent sales (simulating loans for now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const salesQuery = query(
      collection(db, "sales"),
      where("timestamp", ">=", Timestamp.fromDate(today)),
      orderBy("timestamp", "desc")
    );
    
    const salesUnsub = onSnapshot(salesQuery, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentLoans(sales.slice(0, 2));
      setStats(prev => ({ ...prev, loanTotal: sales.length }));
    });

    return () => {
      invUnsub();
      salesUnsub();
    };
  }, []);

  const summaryCards = [
    {
      icon: <Inventory2 sx={{ fontSize: 32, color: '#1976d2' }} />,
      value: stats.shopItems,
      title: "Shop Items",
      sub: "TOTAL PRODUCTS",
      color: '#1976d2'
    },
    {
      icon: <Warning sx={{ fontSize: 32, color: '#d32f2f' }} />,
      value: stats.lowStock,
      title: "Low Stock",
      sub: "BUY MORE SOON",
      color: '#d32f2f'
    },
    {
      icon: <AccessTime sx={{ fontSize: 32, color: '#ed6c02' }} />,
      value: stats.oldItems,
      title: "Old Items",
      sub: "CHECK EXPIRY",
      color: '#ed6c02'
    },
    {
      icon: <AttachMoney sx={{ fontSize: 32, color: '#2e7d32' }} />,
      value: stats.loanTotal,
      title: "Today's Sales",
      sub: "TRANSACTIONS",
      color: '#2e7d32'
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Today's summary and quick insights
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: 'none',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>{card.icon}</Box>
                <Typography variant="h3" fontWeight="900" sx={{ mb: 0.5, color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase' }}>
                  {card.sub}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bottom Sections */}
      <Grid container spacing={3}>
        {/* Check Freshness Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="800">
                Check Freshness
              </Typography>
              {expiringItems.length > 0 && (
                <Chip label="URGENT" size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }} />
              )}
            </Stack>
            {expiringItems.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No items expiring soon
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {expiringItems.map((item, i) => (
                  <Paper
                    key={i}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#fff',
                      border: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700">
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.quantity} LEFT IN SHOP
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        EXPIRES ON
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#d32f2f' }}>
                        {item.expiryDate}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Recent Sales Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#2e7d32' }}>
                Recent Sales
              </Typography>
              <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
            </Stack>
            {recentLoans.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No sales today yet
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {recentLoans.map((sale, i) => (
                  <Paper
                    key={sale.id || i}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#fff',
                      border: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: '#e3f2fd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#1976d2'
                        }}
                      >
                        {sale.name?.charAt(0) || '?'}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700">
                          {sale.name || 'Unknown Item'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sale.timestamp?.toDate().toLocaleTimeString() || 'Just now'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="subtitle2" fontWeight="800">
                      ₹{parseFloat(sale.price || 0).toFixed(2)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}