import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, query, orderBy, 
  addDoc, updateDoc, deleteDoc, doc, increment 
} from "firebase/firestore";
import { 
  Box, Typography, Stack, Button, TextField, InputAdornment, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { 
  Search, Add as AddIcon, Remove as RemoveIcon, 
  DeleteOutline, WarningAmber, AccountBalanceWallet 
} from '@mui/icons-material';

export default function Khaata() {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  // Fetch data from Firebase
  useEffect(() => {
    const q = query(collection(db, "khaata"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(accData);
    });
    return () => unsubscribe();
  }, []);

  // Filter accounts based on search
  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add a new person to Khaata
  const handleAddPerson = async () => {
    if (!newName.trim()) return;
    const initialBalance = parseFloat(newAmount) || 0;

    try {
      await addDoc(collection(db, "khaata"), {
        name: newName.trim(),
        balance: initialBalance,
        lastUpdated: new Date()
      });
      setNewName("");
      setNewAmount("");
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding account: ", error);
    }
  };

  // Adjust balance (+ or -)
  const handleAdjustBalance = async (id, name, isAdd) => {
    const actionStr = isAdd ? "Add to" : "Deduct from";
    const amountStr = prompt(`Enter amount to ${actionStr} ${name}'s balance:`, "0");
    
    if (amountStr === null || amountStr.trim() === "") return;
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    const delta = isAdd ? amount : -amount;

    try {
      const docRef = doc(db, "khaata", id);
      await updateDoc(docRef, {
        balance: increment(delta),
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error("Error updating balance: ", error);
    }
  };

  // Delete a person
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to completely remove ${name} from Khaata?`)) {
      try {
        await deleteDoc(doc(db, "khaata", id));
      } catch (error) {
        console.error("Error deleting account: ", error);
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5, color: '#1a1a1a' }}>
            Khaata Database
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer ledgers, deposits, and debts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          sx={{
            borderRadius: 2,
            bgcolor: '#1976d2',
            color: '#fff',
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)'
          }}
        >
          NEW ACCOUNT
        </Button>
      </Stack>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search accounts by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          mb: 4,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            '& fieldset': { borderColor: 'rgba(224, 224, 224, 0.6)' },
            '&:hover fieldset': { borderColor: '#bdbdbd' },
            '&.Mui-focused fieldset': { borderColor: '#1976d2' },
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: '#9e9e9e' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Data Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(224, 224, 224, 0.4)',
          overflow: 'hidden'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#fafafa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#757575', py: 2 }}>CUSTOMER NAME</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#757575', py: 2 }}>CURRENT BALANCE</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#757575', py: 2 }}>STATUS</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#757575', py: 2 }}>TRANSACT</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#757575', py: 2 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#9e9e9e' }}>
                  <AccountBalanceWallet sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="600">No accounts found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((acc) => {
                const isDebt = acc.balance < 0;
                const isLow = acc.balance >= 0 && acc.balance < 200;
                
                return (
                  <TableRow key={acc.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8f9fa' } }}>
                    <TableCell sx={{ fontWeight: 800, color: '#212121', fontSize: '1rem' }}>
                      {acc.name}
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography 
                        variant="h6" 
                        fontWeight="900" 
                        sx={{ color: isDebt ? '#d32f2f' : '#2e7d32' }}
                      >
                        {isDebt ? `-₹${Math.abs(acc.balance).toFixed(2)}` : `₹${parseFloat(acc.balance).toFixed(2)}`}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      {isDebt ? (
                        <Chip icon={<WarningAmber fontSize="small" />} label="IN DEBT" size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 800, borderRadius: 1.5 }} />
                      ) : isLow ? (
                        <Chip icon={<WarningAmber fontSize="small" />} label="LOW BALANCE (< ₹200)" size="small" sx={{ bgcolor: '#fff3e0', color: '#ed6c02', fontWeight: 800, borderRadius: 1.5 }} />
                      ) : (
                        <Chip label="HEALTHY" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800, borderRadius: 1.5 }} />
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleAdjustBalance(acc.id, acc.name, false)}
                          startIcon={<RemoveIcon />}
                          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                        >
                          Deduct
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleAdjustBalance(acc.id, acc.name, true)}
                          startIcon={<AddIcon />}
                          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                        >
                          Add
                        </Button>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(acc.id, acc.name)}
                        sx={{ color: '#9e9e9e', '&:hover': { color: '#d32f2f', bgcolor: '#ffebee' } }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Person Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}>
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Create New Account</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Customer Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Initial Deposit Amount (₹)"
            type="number"
            fullWidth
            variant="outlined"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ fontWeight: 700, color: '#757575' }}>Cancel</Button>
          <Button onClick={handleAddPerson} variant="contained" sx={{ fontWeight: 700, borderRadius: 2, px: 3, boxShadow: 'none' }}>
            Save Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}