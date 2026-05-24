# 🔒 Data Leakage Fix - Deployment Guide

## Overview

This guide walks you through fixing the data leakage issue where restaurant users can access other restaurants' data.

**Root Cause**: Incomplete RLS policies and orphaned `order_items.restaurant_id` column.

---

## 📋 Quick Start

### Phase 1: Database Schema Fix (Supabase)
```bash
# 1. Log into Supabase dashboard
# 2. Go to SQL Editor
# 3. Copy and paste the content of: scripts/20-fix-data-leakage.sql
# 4. Execute the query
# 5. Check for warnings/errors in output
```

### Phase 2: Application Deployment
```bash
# 1. Deploy the latest code (with new service layer validations)
npm run build
npm run start:prod

# 2. Run validation
npm run validate:data-leakage
```

---

## 🔧 Detailed Deployment Steps

### STEP 1: Database Schema Migration (5-10 minutes)

**File**: `scripts/20-fix-data-leakage.sql`

**What it does**:
1. Drops dangerous/incorrect RLS policies
2. Populates missing `order_items.restaurant_id` values
3. Adds foreign key constraint on `order_items.restaurant_id`
4. Creates corrected RLS policies
5. Validates data consistency

**How to execute**:
```
1. Open Supabase Dashboard
2. Navigate to: SQL Editor (in left sidebar)
3. Click: "+ New Query"
4. Paste entire content of scripts/20-fix-data-leakage.sql
5. Click: "Run" button
6. Check output for warnings:
   ✅ Should see: "Data consistency check passed"
   ✅ Should see: "Menu consistency check passed"
   ⚠️  If warnings appear → investigate before proceeding
7. Click: "Save" to keep query for reference
```

**Expected Output**:
```
NOTICE: Data consistency check passed: all orders have matching restaurant_id
NOTICE: Menu consistency check passed: all order_items reference correct restaurant
```

---

### STEP 2: Code Deployment

**Files changed**:
- `src/database/supabase.service.ts` - Added `getClient()` compatibility
- `src/modules/staff/staff.service.ts` - Fixed role on staff removal
- `src/modules/kitchen/kitchen.service.ts` - Secured order status updates
- `src/modules/[module]/[module].controller.spec.ts` - Added security tests
- `package.json` - Added validation scripts

**Deploy**:
```bash
npm run build
npm run lint

# If running locally
npm run start:dev

# If deploying to production
npm run start:prod
```

---

### STEP 3: Validation & Verification (5 minutes)

**Full validation suite**:
```bash
npm run validate:data-leakage
```

This runs:
1. Static code analysis: `scripts/check-unscoped-queries.js`
2. RLS policy tests: `src/scripts/validate-rls-policies.ts`

**Output should show**:
```
✅ No suspicious unscoped queries detected.
✅ All validation tests passed! RLS policies appear to be working correctly.
```

**Manual verification in Supabase**:
```sql
-- Test 1: Verify order_items.restaurant_id is populated
SELECT COUNT(*) as null_count FROM order_items WHERE restaurant_id IS NULL;
-- Expected: 0

-- Test 2: Verify FK constraint exists
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'order_items' AND constraint_type = 'FOREIGN KEY';
-- Expected: fk_order_items_restaurant_id

-- Test 3: Check RLS is enabled on sensitive tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('users', 'orders', 'order_items', 'menu_items', 'tables', 'restaurants')
ORDER BY tablename;
-- Expected: all have rowsecurity = true
```

---

## 🧪 Optional: Test RLS Policies Directly

If you want to test RLS with actual authentication:

```typescript
// Example test that should FAIL (cross-restaurant access blocked)
const user1Token = /* get token for restaurant 1 user */;
const user1Client = createClient(SUPABASE_URL, ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${user1Token}` } }
});

// User1 tries to read restaurant2's orders
const { data: hacked, error } = await user1Client
  .from('orders')
  .select('*')
  .eq('restaurant_id', 'RESTAURANT_2_UUID');

// Expected: error (permission denied) or empty data
// Should NOT return restaurant 2's orders
```

---

## 📊 What Was Fixed

### Issue 1: Orphaned `order_items.restaurant_id`
**Before**:
- Column existed but was never populated
- No FK constraint
- RLS policies couldn't use it effectively

**After**:
- All values populated from `orders.restaurant_id`
- FK constraint added: references `restaurants(id)`
- Index created for performance

### Issue 2: Incorrect RLS Policies
**Before**:
```sql
-- ❌ WRONG: Compares UUID restaurant with UUID user
USING (restaurant_id = auth.uid());
```

**After**:
```sql
-- ✅ CORRECT: Joins through users table
USING (
  restaurant_id in (
    select u.restaurant_id
    from public.users u
    where u.id = auth.uid()
  )
)
```

### Issue 3: Service Layer Gaps
**Before**:
- Some methods queried DB without filtering by restaurant
- `KitchenService.updateOrderStatus` used unfiltered lookup

**After**:
- All public methods now verify `restaurant_id`
- Internal calls use `*ForRestaurant` variants
- Tests verify cross-restaurant access is blocked

---

## 🚨 Rollback Plan (if needed)

If issues occur during deployment:

```bash
# Rollback database to previous state
# In Supabase SQL Editor, run:
# (save a backup first!)
ALTER TABLE order_items DROP CONSTRAINT fk_order_items_restaurant_id;
UPDATE order_items SET restaurant_id = NULL;

# Rollback code
git revert [commit-hash]
npm run build && npm run start:prod
```

---

## ✅ Post-Deployment Checklist

- [ ] Schema migration executed successfully in Supabase
- [ ] No data consistency warnings in SQL output
- [ ] Code deployed to production
- [ ] All npm tests pass: `npm test`
- [ ] Validation passed: `npm run validate:data-leakage`
- [ ] Manual RLS checks passed in Supabase
- [ ] Tested login/logout flows for multiple restaurants
- [ ] Confirmed users see only their own data
- [ ] Monitored logs for permission errors (should be minimal)

---

## 📞 Troubleshooting

### Issue: "Policy violates foreign key constraint"
**Cause**: `order_items.restaurant_id` is NULL and RLS tries to filter
**Fix**: Ensure `20-fix-data-leakage.sql` completed successfully. Run again to populate values.

### Issue: "User has permission denied"
**Cause**: User's `restaurant_id` is NULL in `users` table
**Fix**: Verify user was properly assigned to restaurant during registration

### Issue: Validation script fails
**Cause**: Missing environment variables or Supabase connection issue
**Fix**: 
```bash
# Check env vars
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Reconnect to Supabase
npm run validate:rls-policies
```

---

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `scripts/20-fix-data-leakage.sql` | Database schema corrections |
| `src/scripts/migration-fix-order-items.ts` | TypeScript migration helper |
| `src/scripts/validate-rls-policies.ts` | RLS policy validation |
| `scripts/check-unscoped-queries.js` | Static code analysis |
| `src/modules/*/[module].controller.spec.ts` | Security tests |

---

## 🎯 Success Criteria

✅ All order_items have restaurant_id populated
✅ No cross-restaurant data leakage in queries
✅ All RLS policies follow correct pattern (no auth.uid() comparisons)
✅ All unit tests pass
✅ Validation scripts show no issues
✅ Multiple restaurants can operate independently
✅ Service logs show no permission errors during normal operations

---

**Questions?** Review the SQL analysis in `/memories/repo/sql-analysis-findings.md`
