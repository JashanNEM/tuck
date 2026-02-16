import React from 'react';
import { Box, Typography, Card, Stack, Chip, Button, Avatar } from '@mui/material';
import { Psychology, AutoGraph, LocalOffer, TipsAndUpdates } from '@mui/icons-material';

const InsightCard = ({ title, reason, action, icon, color }) => (
  <Card sx={{ p: 3, mb: 2, borderRadius: 4, borderLeft: `6px solid ${color}`, bgcolor: '#fff' }}>
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Avatar sx={{ bgcolor: color }}>{icon}</Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight="700">AI STRATEGY</Typography>
        <Typography variant="h6" fontWeight="900" sx={{ mb: 1 }}>{title}</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
          <strong>Reason:</strong> {reason}
        </Typography>
        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px dashed #ccc' }}>
          <Typography variant="caption" fontWeight="800" color="primary">SUGGESTED ACTION:</Typography>
          <Typography variant="body2" fontWeight="600">{action}</Typography>
        </Box>
      </Box>
      <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>Apply</Button>
    </Stack>
  </Card>
);

export default function Consultant() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Psychology sx={{ fontSize: 40, color: '#673ab7' }} />
        <Box>
          <Typography variant="h4" fontWeight="900">AI Consultant</Typography>
          <Typography color="text.secondary">Real-time profit & behavior optimization</Typography>
        </Box>
      </Stack>

      <InsightCard 
        title="The 'Chai-Time' Bundle"
        reason="100% of customers buying Sugar also buy Tea Powder. They are inseparable."
        action="Place 'Tea Powder' 10 feet away from 'Sugar' to force customers to walk past the Biscuit aisle."
        icon={<LocalOffer />}
        color="#ff9800"
      />

      <InsightCard 
        title="Inventory Efficiency"
        reason="Sugar has a 100% attachment rate to Tea Powder but 0% to Milk."
        action="Stop putting Milk near Sugar. It's 'Dead Space'. Use that space for high-margin Biscuits instead."
        icon={<AutoGraph />}
        color="#4caf50"
      />

      <InsightCard 
        title="Evening Rush Density"
        reason="Transaction density peaks at 6:30 PM with 'Snack' items."
        action="Pre-pack 'Tea + Sugar' small pouches near the counter before 6 PM to speed up the queue."
        icon={<TipsAndUpdates />}
        color="#2196f3"
      />
    </Box>
  );
}