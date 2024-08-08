"use client";

import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'; // Import Grid component
import Paper from '@mui/material/Paper'; // Import Paper component
import { styled } from '@mui/material/styles'; // Import styled for custom styling
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { db } from '@/firebase';
import { collection, setDoc, doc, getDocs, Timestamp, deleteDoc, getDoc } from 'firebase/firestore';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import Slide from '@mui/material/Slide';
import './globals.css'; // Ensure your CSS is imported

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  cursor: 'pointer'
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

export default function ColorTabs() {
  const [value, setValue] = React.useState('one');
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [newQty, setNewQty] = React.useState('');
  const [newExp, setNewExp] = React.useState('');
  const [actionType, setActionType] = React.useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchBarOpen, setSearchBarOpen] = React.useState(false);
  

  React.useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "pantry_items"));
      const items = querySnapshot.docs.map((doc, index) => ({
        id: index + 1,
        item: doc.id,
        qty: doc.data().qty,
        exp: doc.data().exp ? doc.data().exp.toDate() : null,
      }));
      setRows(items);
    };
    fetchData();
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleClickOpen = (row, type) => {
    if (type === 'add') {
      setSelectedItem({ item: row });
    } else {
      setSelectedItem({ item: row }); // Pass the entire row object for edit and delete
    }
    setActionType(type);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
    setNewQty('');
    setNewExp('');
    setActionType(null);
  };

  const handleAddItem = async () => {
    if (selectedItem && newQty && newExp) {
      // Validate quantity
      const qty = parseInt(newQty, 10);
      if (isNaN(qty) || qty <= 0) {
        // Display error message
        alert("Please enter a valid quantity.");
        return;
      }

      // Validate expiry date
      const expDate = new Date(newExp);
      if (isNaN(expDate.getDate())) {
        // Display error message
        alert("Please enter a valid expiry date.");
        return;
      }
      const newItem = {
        qty: parseInt(newQty, 10),
        exp: Timestamp.fromDate(new Date(newExp))
      };
      await setDoc(doc(collection(db, "pantry_items"), selectedItem.item), newItem);
      setRows([...rows, { id: rows.length + 1, item: selectedItem.item, qty: newItem.qty, exp: newItem.exp.toDate() }]);
      handleClose();
    }
  };

  const handleDeleteItem = async (selectedItem) => {
    try {
      const docRef = doc(db, "pantry_items", selectedItem.item);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.error(`Item ${selectedItem.item} does not exist.`);
        return;
      }

      const currentQty = docSnap.data().qty;

      if (currentQty === 1) {
        await deleteDoc(docRef);
        setRows(rows.filter(row => row.item !== selectedItem.item));
      } else {
        await setDoc(docRef, { qty: currentQty - 1 }, { merge: true });
        setRows(rows.map(row =>
          row.item === selectedItem.item ? { ...row, qty: currentQty - 1 } : row
        ));
      }
      
      handleClose();
      handleConfirmDeleteClose();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEditItem = async (selectedItem) => {
    console.log(selectedItem.item)
    const docRef = doc(db, "pantry_items", selectedItem.item);
    const docSnap = await getDoc(docRef);
    if (selectedItem.item && newQty && newExp) {
      const updatedItem = {
        qty: parseInt(newQty, 10),
        exp: Timestamp.fromDate(new Date(newExp))
      };
      await setDoc(doc(db, "pantry_items", selectedItem.item), updatedItem);
      setRows(rows.map(row =>
        row.item === selectedItem.item ? { ...row, qty: updatedItem.qty, exp: new Date(newExp) } : row
      ));
      handleClose();
    }
  };

  const handleConfirmDelete = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteClose = () => {
    setConfirmDeleteOpen(false);
  };

  
  
  const items = ["Apples", "Bananas", "Oranges", "Grapes", "Strawberries", "Blueberries", 
    "Lemons", "Limes", "Pears", "Peaches", "Plums", "Watermelons", "Pineapples", "Mangoes",
    "Avocados", "Tomatoes", "Cucumbers", "Carrots", "Lettuce", "Spinach", "Kale", "Bell Peppers",
    "Chicken Broth", "Beef Broth", "Soy Sauce", 
    "Vinegar", "Honey", "Peanut Butter", "Jam", "Cereal", "Oats", "Coffee", "Tea", "Bread", "Tortillas", 
    "Crackers", "Chips", "Nuts", "Dried Fruit", "Frozen Vegetables", "Frozen Fruits", "Ice Cream", 
    "Frozen Pizza", "Frozen Meals", "Spices", "Herbs", "Baking Powder", "Baking Soda", "Yeast", "Pasta Sauce", 
    "Salad Dressing", "Salsa"]
  .sort();

  const [filteredItems, setFilteredItems] = React.useState(items);


  const handleSearchChange = (e) => { 
    const searchitem = e.target.value;
    setSearchQuery(searchitem)
    const filteredItems = items.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  

    setFilteredItems(filteredItems);
    
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 90, headerAlign: 'center', align: 'center' },
    { field: 'item', headerName: 'Item', width: 150, headerAlign: 'center', align: 'center', editable: true },
    { field: 'qty', headerName: 'Quantity', width: 150, headerAlign: 'center', align: 'center', editable: true },
    {
      field: 'exp',
      headerName: 'Expiry Date',
      width: 150,
      editable: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toLocaleDateString();
        }
      }
    },
    {
      field: 'Actions',
      headerName: '',
      width: 150,
      editable: false,
      renderCell: (params) => (
        <Box>
          {/* <IconButton
            color="primary"
            onClick={() => handleEditItem(params.row)}
            sx={{ mr: 1 }}
          >
            <EditIcon />
          </IconButton> */}
          <IconButton
            color="primary"
            onClick={() => {
              handleDeleteItem(params.row); 

              setConfirmDeleteOpen(true); // Open the confirm delete dialog
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    }
  ];
  return (
    <Box sx={{ width: '100%', justifyContent: 'center', alignItems: 'center', backgroundImage: 'url(/wp2.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat', }}>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="secondary" // Indicator color if needed
        aria-label="secondary tabs example"
        centered
        sx={{
          backgroundImage: 'url(/wp1.jpg)',
          height: '300%',
          backgroundSize: '300%',
          display: 'flex',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          '& .MuiTab-root': {
            color: 'black', // Font color of tabs
          },
          '& .MuiTab-root.Mui-selected': {
            color: 'darkblue', // Font color of selected tab
          },
          '& .MuiTabs-indicator': {
            backgroundColor: 'darkblue', // Indicator color
          },
        }}
      >
        <Tab value="one" label="Your Pantry" />
        <Tab value="two" label="Add an item" />
      </Tabs>

      {value === 'one' && (
        <Box sx={{ height: 623, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginTop: 2,  }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            disableRowSelectionOnClick
          />
        </Box>
      )}

      {value === 'two' && (
        <Box sx={{ width: '100%', height: 700,
         }}>
          <IconButton
            color="primary"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
            }}
            onClick={() => setSearchBarOpen(!searchBarOpen)}
          >
            <SearchIcon />
          </IconButton>

          <Slide direction="left" in={searchBarOpen} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 50,  // Position the box from the right edge
              backgroundColor: 'white',
              padding: 0,  // Remove padding to ensure consistent height
              borderRadius: 20,  // Match border radius with TextField
              boxShadow: 2,
              zIndex: 1,
              width: '250px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                borderRadius: 20,  // Match border radius with Box
                height: '140%',  // Full height of the Box
                '& .MuiOutlinedInput-root': {
                  borderRadius: 20,  // Match border radius with Box
                },
              }}
            />
            
          </Box>
          </Slide>
          <Grid container spacing={2} sx={{ position: 'relative', marginTop: 2 }}>
            {(searchQuery === '' ? items : filteredItems).map((item, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Item onClick={() => handleClickOpen(item, 'add')}>{item}</Item>
              </Grid>
            ))}
          </Grid>

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{actionType === 'edit' ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {actionType === 'edit' ? 'Edit the quantity and expiry date of the item.' : 'Enter the quantity and expiry date of the item to add to your pantry.'}
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Quantity"
                type="number"
                fullWidth
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
              />
              <TextField
                margin="dense"
                id="name"
                label="Expiry Date"
                type="date"
                fullWidth
                value={newExp}
                onChange={(e) => setNewExp(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              {actionType === 'edit' ? (
                <Button onClick={handleEditItem}>Save</Button>
              ) : (
                <Button onClick={handleAddItem}>Add</Button>
              )}
            </DialogActions>
          </Dialog>

        </Box>
      )}
    </Box>
  );
}
