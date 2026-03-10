# Integration Testing Guide

## Prerequisites

### Backend Setup
1. Ensure backend is running on port 8080:
   ```bash
   cd backend
   npm run dev
   ```

2. Database should be migrated and have at least one admin user:
   ```bash
   # Check if admin exists in your database
   # You may need to create one manually or through a seed script
   ```

### Frontend Setup
1. Ensure frontend dependencies are installed:
   ```bash
   cd frontend/admin
   npm install
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   ```

3. Open browser to the URL shown (typically `http://localhost:5173`)

## Test Scenarios

### 1. Authentication Flow

#### Test 1.1: Admin Login
**Steps:**
1. Navigate to `/login` page
2. Enter admin username (e.g., "admin")
3. Enter admin password
4. Click "Sign In"

**Expected Results:**
- Loading spinner appears during request
- On success: Redirect to dashboard (`/`)
- On failure: Error message displayed in red box
- Token saved in localStorage as `ola_auth_token`
- Admin flag saved as `ola_is_admin = '1'`

#### Test 1.2: Invalid Credentials
**Steps:**
1. Navigate to `/login` page
2. Enter invalid username/password
3. Click "Sign In"

**Expected Results:**
- Error message: "Invalid admin credentials..." or backend error message
- Stay on login page
- No token saved

#### Test 1.3: Logout
**Steps:**
1. Login successfully
2. Click logout button (if available) or clear localStorage manually
3. Try to access admin pages

**Expected Results:**
- Token removed from localStorage
- Redirect to login page

---

### 2. Dashboard Statistics

#### Test 2.1: View Dashboard
**Steps:**
1. Login as admin
2. Navigate to dashboard (`/`)

**Expected Results:**
- "Loading dashboard..." shown initially
- Three stat cards appear:
  - Pesanan Hari Ini (Orders Today)
  - Total Pelanggan (Total Customers)
  - Total Pendapatan (Total Revenue in Rupiah)
- Weekly sales chart displays

#### Test 2.2: Verify Statistics
**Steps:**
1. Note the statistics on dashboard
2. Navigate to Pesanan page and count orders
3. Navigate to Pengguna page and count customers
4. Compare values

**Expected Results:**
- Dashboard stats match actual data counts

---

### 3. Product Management (Stok Barang)

#### Test 3.1: List Products
**Steps:**
1. Navigate to "Produk" page

**Expected Results:**
- "Loading..." appears initially
- Table displays all products with columns: Nama, Stok, Harga, Aksi
- Prices formatted as Indonesian Rupiah (Rp format)
- Pagination appears if more than 4 items (configurable)

#### Test 3.2: Search Products
**Steps:**
1. On Produk page, type in search box
2. Enter partial product name

**Expected Results:**
- Table filters to show only matching products
- Pagination updates accordingly

#### Test 3.3: Create Product
**Steps:**
1. Click "Tambah Produk" button
2. Fill in:
   - Nama Produk: "Kertas A4"
   - Jumlah Stok: 100
   - Harga Satuan: 45000
3. Click "Simpan"

**Expected Results:**
- Modal closes
- Product list refreshes
- New product appears in table
- Backend receives: `{ nama: "Kertas A4", jumlah_stok: 100, harga_satuan: 45000 }`

#### Test 3.4: Edit Product
**Steps:**
1. Click "Edit" button on any product
2. Modify the values
3. Click "Simpan"

**Expected Results:**
- Modal shows current product values
- After save, modal closes
- Product list refreshes
- Changes reflected in table

#### Test 3.5: Delete Product
**Steps:**
1. Click "Hapus" button on any product
2. Confirm deletion in dialog

**Expected Results:**
- Confirmation dialog appears
- Product removed from list
- Backend DELETE request sent

#### Test 3.6: Validation
**Steps:**
1. Click "Tambah Produk"
2. Leave fields empty
3. Click "Simpan"

**Expected Results:**
- Error message: "Semua field harus diisi"
- Modal stays open

---

### 4. Order Management (Pesanan)

#### Test 4.1: List Orders
**Steps:**
1. Navigate to "Pesanan" page

**Expected Results:**
- Table displays orders with: ID, Nama Pelanggan, Layanan, Nilai, File, Aksi
- Customer names show from related pelanggan table
- Values formatted as Rupiah

#### Test 4.2: Create Order
**Steps:**
1. Click "Tambah Pesanan"
2. Fill in:
   - Select customer from dropdown
   - Jenis Layanan: "Cetak Dokumen"
   - Nama File: "document.pdf" (optional)
   - Catatan: "Warna" (optional)
   - Nilai Pesanan: 50000
3. Click "Simpan"

**Expected Results:**
- Customer dropdown populated with existing customers
- Order created successfully
- List refreshes with new order

#### Test 4.3: Edit Order
**Steps:**
1. Click "Edit" on any order
2. Modify jenis_layanan or nilai_pesanan
3. Click "Simpan"

**Expected Results:**
- Customer dropdown is disabled (cannot change customer)
- Changes saved successfully
- Note: `id_pelanggan` not sent in update request

#### Test 4.4: Delete Order
**Steps:**
1. Click "Hapus"
2. Confirm deletion

**Expected Results:**
- Order removed from list

#### Test 4.5: Search Orders
**Steps:**
1. Type in search box
2. Enter customer name or service type

**Expected Results:**
- Orders filtered by customer name OR service type

---

### 5. Service Management (Layanan)

#### Test 5.1: List Services
**Steps:**
1. Navigate to "Layanan" page

**Expected Results:**
- Table shows: Nama Layanan, Deskripsi, Icon, Status, Aksi
- Status shows "Aktif" or "Nonaktif" badge

#### Test 5.2: Create Service
**Steps:**
1. Click "Tambah Layanan"
2. Fill in:
   - Nama: "Cetak Dokumen"
   - Deskripsi: "Layanan cetak berbagai jenis dokumen"
   - Nama Icon: "printer"
   - Check "Layanan Aktif"
3. Click "Simpan"

**Expected Results:**
- Service created with status_layanan = true
- Appears in list with "Aktif" status

#### Test 5.3: Toggle Service Status
**Steps:**
1. Edit a service
2. Uncheck "Layanan Aktif"
3. Save

**Expected Results:**
- Status changes to "Nonaktif"
- status_layanan = false in backend

#### Test 5.4: Delete Service
**Steps:**
1. Click "Hapus"
2. Confirm

**Expected Results:**
- Service removed

---

### 6. User Management (Pengguna)

#### Test 6.1: List Users
**Steps:**
1. Navigate to "Pengguna" page

**Expected Results:**
- Users displayed as cards with:
  - nama_lengkap
  - nomor_telepon
  - email (if akunPelanggan exists)

#### Test 6.2: Search Users
**Steps:**
1. Type in search box
2. Enter partial name

**Expected Results:**
- Users filtered by name

#### Test 6.3: Delete User
**Steps:**
1. Click "Hapus"
2. Confirm deletion

**Expected Results:**
- User removed from list
- Confirmation dialog shown first

---

## Error Testing

### Test E.1: Network Error
**Steps:**
1. Stop backend server
2. Try any API operation

**Expected Results:**
- Error message displayed
- No crash
- User can retry after backend restarts

### Test E.2: 401 Unauthorized
**Steps:**
1. Manually clear `ola_auth_token` from localStorage
2. Try to create/edit/delete (admin operations)

**Expected Results:**
- Automatic redirect to login page
- Token removed
- `ola_is_admin` flag removed

### Test E.3: Invalid Data
**Steps:**
1. Try to create product with negative stock
2. Try to create order with non-existent customer ID

**Expected Results:**
- Backend validation error shown
- Clear error message to user

---

## Browser Console Checks

### Console Logs to Verify
1. No error messages in console
2. API requests show correct URLs
3. Requests include Authorization header (except login)
4. Responses have correct format

### Network Tab Verification
1. POST requests send correct JSON body
2. PUT requests send correct JSON body
3. DELETE requests complete successfully
4. GET requests return expected data structure

---

## Data Integrity Checks

### Check 1: Product CRUD
1. Create a product with stock 100
2. Edit to stock 150
3. Verify in database: stock = 150
4. Delete and verify removal

### Check 2: Order Relationships
1. Create an order for customer ID 1
2. Verify order.id_pelanggan = 1
3. Verify order includes pelanggan data in response
4. Check that customer's orders list includes this order

### Check 3: Dashboard Calculations
1. Create 2 orders today with values: 50000, 75000
2. Refresh dashboard
3. Verify: "Total Pendapatan" shows sum (Rp125.000)
4. Verify: "Pesanan Hari Ini" shows 2

---

## Common Issues & Solutions

### Issue 1: CORS Error
**Symptom:** Browser blocks requests with CORS error
**Solution:** Backend needs to add CORS headers:
```javascript
app.use(cors({
  origin: 'http://localhost:5173'
}))
```

### Issue 2: 404 Not Found
**Symptom:** API requests return 404
**Solution:** 
- Verify backend is running
- Check API_BASE_URL is correct (http://localhost:8080)
- Verify backend routes are registered

### Issue 3: Empty Data
**Symptom:** Lists show empty even though data exists
**Solution:**
- Check backend response format matches expected structure
- Verify response interceptor is extracting data correctly
- Check browser console for errors

### Issue 4: Cannot Login
**Symptom:** Login fails with valid credentials
**Solution:**
- Verify username field is sent (not email)
- Check backend expects `{ username, password }`
- Verify admin user exists in database

### Issue 5: Token Not Persisting
**Symptom:** Logout after page refresh
**Solution:**
- Check token is saved to localStorage
- Verify APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN matches
- Check token is sent in Authorization header

---

## Checklist Summary

- [ ] Login with admin credentials works
- [ ] Dashboard shows correct statistics
- [ ] Products: List, Create, Edit, Delete all work
- [ ] Orders: List, Create, Edit, Delete all work
- [ ] Services: List, Create, Edit, Delete all work
- [ ] Users: List, Delete work
- [ ] Search functionality works on all pages
- [ ] Pagination works correctly
- [ ] Error messages display properly
- [ ] Loading states show during API calls
- [ ] Currency formatting displays correctly
- [ ] Confirmation dialogs appear before delete
- [ ] 401 errors redirect to login
- [ ] No console errors
- [ ] Network requests show correct data

---

## Performance Checks

- [ ] Initial page load < 3 seconds
- [ ] API responses < 1 second
- [ ] Search filtering is instant
- [ ] Pagination doesn't refetch data
- [ ] Modal open/close is smooth

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Mobile Responsiveness (Optional)

- [ ] Login page works on mobile
- [ ] Dashboard cards stack vertically
- [ ] Tables scroll horizontally
- [ ] Modals are readable
- [ ] Buttons are tappable

---

## Final Verification

After all tests pass:
1. Perform a full user flow from login to logout
2. Create one item in each section
3. Verify all data persists
4. Check database directly to confirm
5. Restart both servers and verify data loads

**All tests passed?** ✅ Integration is complete!
