import React from 'react';
import { Grid, Card, CardActionArea, Typography, Box } from '@mui/material';
import { Inventory2, PointOfSale } from '@mui/icons-material';

export default function Home({ setView }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h3" fontWeight="900" gutterBottom>Welcome back!</Typography>
      <Typography color="text.secondary" sx={{ mb: 6 }}>Choose a terminal to begin</Typography>
      
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 5, border: '2px solid #eee', '&:hover': { borderColor: '#1976d2' } }}>
            <CardActionArea onClick={() => setView("INVENTORY")} sx={{ p: 6 }}>
              <Inventory2 sx={{ fontSize: 80, color: '#1976d2', mb: 2 }} />
              <Typography variant="h5" fontWeight="800">Inventory</Typography>
              <Typography variant="body2">Add stock & manage database</Typography>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 5, border: '2px solid #eee', '&:hover': { borderColor: '#2e7d32' } }}>
            <CardActionArea onClick={() => setView("SALES")} sx={{ p: 6 }}>
              <PointOfSale sx={{ fontSize: 80, color: '#2e7d32', mb: 2 }} />
              <Typography variant="h5" fontWeight="800">Sales Terminal</Typography>
              <Typography variant="body2">Scan to sell items</Typography>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}