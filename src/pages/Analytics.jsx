import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, Stack, ToggleButton, 
  ToggleButtonGroup, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress 
} from '@mui/material'; // Fixed: Import LinearProgress
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, where, Timestamp, getDocs } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, BarChart, Bar 
} from 'recharts';

// HELPER COMPONENT (Must be defined for the page to render)
function MetricCard({ title, value, color, sub }) {
  return (
    <Card sx={{ p: 3, borderRadius: 4, borderLeft: `6px solid ${color}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
      <Typography variant="caption" color="text.secondary" fontWeight="900" sx={{ textTransform: 'uppercase' }}>{title}</Typography>
      <Typography variant="h3" fontWeight="900" sx={{ color: color, my: 0.5 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{sub}</Typography>
    </Card>
  );
}

export default function Analytics() {
  const [range, setRange] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ revenue: 0, totalSales: 0, trends: [], inventoryHealth: [], topPerformers: [] });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchAndModelData = async () => {
      try {
        // 1. Fetch Inventory First
        const invSnap = await getDocs(collection(db, "inventory"));
        const invMap = {};
        invSnap.forEach(doc => {
          const d = doc.data();
          invMap[d.name] = { stock: Number(d.quantity || 0) };
        });

        // 2. Calculate correct start time
        const now = new Date();
        let start = new Date();
        
        if (range === 'daily') {
          start.setHours(0, 0, 0, 0);
        } else if (range === 'weekly') {
          start.setDate(now.getDate() - 7);
        } else {
          start.setMonth(now.getMonth() - 1);
        }

        // 3. The Query (Note: Check console for index link)
        const q = query(
          collection(db, "sales"),
          where("timestamp", ">=", Timestamp.fromDate(start)),
          orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;

          let totalRev = 0;
          const velocityMap = {};
          const timeMap = {};

          snapshot.forEach((doc) => {
            const s = doc.data();
            const price = Number(s.price || 0);
            totalRev += price;
            velocityMap[s.name] = (velocityMap[s.name] || 0) + 1;

            const date = s.timestamp?.toDate();
            if (date) {
              const label = range === 'daily' 
                ? `${date.getHours()}:00` 
                : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              
              timeMap[label] = (timeMap[label] || 0) + price;
            }
          });

          const chartTrends = Object.keys(timeMap).map(k => ({ time: k, amount: timeMap[k] }));

          const healthModel = Object.keys(invMap).map(name => {
            const sold = velocityMap[name] || 0;
            const daysCount = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
            const avgDaily = sold / daysCount;
            const currentStock = invMap[name].stock;
            const estDaysLeft = avgDaily > 0 ? Math.ceil(currentStock / avgDaily) : 999;
            
            let status = "Healthy";
            if (estDaysLeft <= 2) status = "Critical";
            else if (estDaysLeft <= 5) status = "Warning";
            else if (sold === 0) status = "Dead Stock";

            return { name, stock: currentStock, avgDaily: avgDaily.toFixed(1), estDaysLeft, status };
          });

          setData({
            revenue: totalRev,
            totalSales: snapshot.size,
            trends: chartTrends,
            inventoryHealth: healthModel.sort((a,b) => a.estDaysLeft - b.estDaysLeft),
            topPerformers: Object.keys(velocityMap).map(name => ({ 
              name: name.split(' ')[0], 
              count: velocityMap[name] 
            })).sort((a,b) => b.count - a.count).slice(0, 5)
          });
          setLoading(false);
        }, (error) => {
          console.error("Firebase Error:", error);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error("Fetch Error:", err);
        setLoading(false);
      }
    };

    fetchAndModelData();
    return () => { isMounted = false; };
  }, [range]);

  if (loading) return <LinearProgress sx={{ mt: 5 }} />;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', px: 4, py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="900">Store Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Real-time behavior & stock modeling</Typography>
        </Box>
        <ToggleButtonGroup 
          value={range} 
          exclusive 
          onChange={(e, val) => val && setRange(val)} 
          size="small"
          sx={{ bgcolor: '#fff' }}
        >
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
          <ToggleButton value="monthly">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <MetricCard title="Revenue" value={`₹${data.revenue}`} color="#1976d2" sub="Inflow" />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard title="Units" value={data.totalSales} color="#9c27b0" sub="Sold" />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard title="Critical" value={data.inventoryHealth.filter(i => i.status === "Critical").length} color="#d32f2f" sub="Low Stock" />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, borderRadius: 4, height: 450 }}>
            <Typography variant="h6" fontWeight="800" mb={3}>Revenue Velocity</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#1976d2" strokeWidth={3} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, borderRadius: 4, height: 450 }}>
            <Typography variant="h6" fontWeight="800" mb={3}>Top Movers</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={data.topPerformers} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={11} fontWeight="bold" />
                <Tooltip />
                <Bar dataKey="count" fill="#4caf50" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight="800" mb={2}>Stock Health Model</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 4, mb: 5 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Velocity</TableCell>
              <TableCell>Days Left</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.inventoryHealth.map((item) => (
              <TableRow key={item.name}>
                <TableCell fontWeight="600">{item.name}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{item.avgDaily}</TableCell>
                <TableCell>{item.estDaysLeft > 100 ? '99+' : item.estDaysLeft}</TableCell>
                <TableCell>
                  <Chip label={item.status} size="small" 
                    sx={{ bgcolor: item.status === 'Critical' ? '#ffebee' : '#e8f5e9', color: item.status === 'Critical' ? '#d32f2f' : '#2e7d32' }} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}