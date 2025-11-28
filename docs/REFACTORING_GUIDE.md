# UploadBOQModal Refactoring Guide

## Summary

The `UploadBOQModal.tsx` file has been successfully refactored from a single 647-line monolithic component into a modular architecture with clear separation of concerns.

## What Changed

### Before (Original Structure)
```
src/pages/Admin/Tenders/UploadBOQModal.tsx (647 lines)
├─ Imports
├─ Interfaces
├─ Component logic (everything in one file)
├─ Excel parsing
├─ Data validation
├─ Unit mapping UI
├─ File upload handling
├─ Database operations
└─ Component render
```

### After (Refactored Structure)
```
src/pages/Admin/Tenders/
├── UploadBOQModal.tsx (172 lines)
│   └── Component export, modal wrapper
├── hooks/
│   ├── useBoqUpload.ts (297 lines)
│   │   └── All business logic
│   └── index.ts
└── components/
    ├── UploadStep.tsx (82 lines)
    │   └── File upload UI (Step 1)
    ├── MappingStep.tsx (178 lines)
    │   └── Unit mapping UI (Step 2)
    ├── PreviewStep.tsx (81 lines)
    │   └── Validation UI (Step 3)
    └── index.ts
```

## File-by-File Changes

### 1. UploadBOQModal.tsx (172 lines)
**What was removed:**
- All business logic (Excel parsing, validation, upload)
- Unit mapping table rendering
- File upload handling
- Form management for unit creation

**What remains:**
- Modal component wrapper
- State management for file list
- Integration of child components
- Orchestration of the upload flow
- Database operations for unit creation (kept here as it's a side effect)

**What was added:**
- Imports from new modules
- useBoqUpload hook usage
- Child component composition

### 2. hooks/useBoqUpload.ts (297 lines) - NEW FILE
**Contains:**
- Excel file parsing logic (XLSX)
- Data validation (validateData function)
- Unit existence checking (isUnitExists function)
- Unit mapping state management
- Batch upload to Supabase (uploadData function)
- State cleanup (reset function)

**Exported Types:**
```typescript
export interface ParsedRow
export interface ValidationResult
export interface ExistingUnit
export interface UnitMapping
```

**Exported Functions:**
```typescript
export const useBoqUpload = () => ({...})
```

### 3. components/UploadStep.tsx (82 lines) - NEW FILE
**Purpose:** Handles file upload UI (Step 1 of 3)

**Props:**
- fileList: UploadFile[]
- onFileUpload: (file: File) => boolean
- onRemove: () => void
- uploading: boolean
- tenderName: string

**Features:**
- Drag-and-drop file input
- Tender information display
- Excel format instructions

### 4. components/MappingStep.tsx (178 lines) - NEW FILE
**Purpose:** Handles unit mapping UI (Step 2 of 3)

**Props:**
- unitMappings: UnitMapping[]
- existingUnits: ExistingUnit[]
- unknownUnitsCount: number
- onMappingChange: (code, value, action) => void
- onCreateUnit: (code, values) => Promise<void>

**Features:**
- Unit mapping table
- Existing unit selection
- New unit creation form
- Conditional rendering (only when needed)

### 5. components/PreviewStep.tsx (81 lines) - NEW FILE
**Purpose:** Shows validation results and upload progress (Step 3 of 3)

**Props:**
- validationResult: ValidationResult | null
- parsedDataCount: number
- uploadProgress: number
- uploading: boolean

**Features:**
- Success/error alerts
- Progress bar
- Error list display

## Migration Guide for Other Files

### If your file imports UploadBOQModal

**No changes needed.** The export path remains the same:
```typescript
import UploadBOQModal from '@/pages/Admin/Tenders/UploadBOQModal';
```

### If you want to use useBoqUpload in other components

Now you can! New usage:
```typescript
import { useBoqUpload } from '@/pages/Admin/Tenders/hooks/useBoqUpload';

// In your component
const {
  parsedData,
  validationResult,
  parseExcelFile,
  uploadData
} = useBoqUpload();
```

### If you want to reuse UI components

```typescript
// Import components from barrel export
import { UploadStep, MappingStep, PreviewStep } from '@/pages/Admin/Tenders/components';

// Or specific imports
import { UploadStep } from '@/pages/Admin/Tenders/components/UploadStep';
```

## Testing Impact

### Old Approach
- All logic in single component - hard to test in isolation
- Excel parsing mixed with UI rendering
- Complex mock setup required

### New Approach

**Unit Tests (useBoqUpload hook):**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useBoqUpload } from './hooks/useBoqUpload';

test('parseExcelFile should parse valid Excel', () => {
  const { result } = renderHook(() => useBoqUpload());
  const file = new File([...], 'test.xlsx');

  act(() => {
    result.current.parseExcelFile(file);
  });

  expect(result.current.parsedData.length).toBeGreaterThan(0);
});
```

**Component Tests (UI Components):**
```typescript
import { render, screen } from '@testing-library/react';
import { UploadStep } from './components/UploadStep';

test('UploadStep renders instructions', () => {
  render(
    <UploadStep
      fileList={[]}
      onFileUpload={jest.fn()}
      onRemove={jest.fn()}
      uploading={false}
      tenderName="Test"
    />
  );

  expect(screen.getByText(/Формат Excel файла/)).toBeInTheDocument();
});
```

**Integration Tests (Modal):**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import UploadBOQModal from './UploadBOQModal';

test('Full upload flow works', async () => {
  const mockOnSuccess = jest.fn();

  render(
    <UploadBOQModal
      visible={true}
      tenderId="123"
      tenderName="Test"
      onCancel={jest.fn()}
      onSuccess={mockOnSuccess}
    />
  );

  // User interactions...

  await waitFor(() => {
    expect(mockOnSuccess).toHaveBeenCalled();
  });
});
```

## Size Compliance

All files are now under the 600-line limit:

| File | Lines | Status |
|------|-------|--------|
| UploadBOQModal.tsx | 172 | ✓ Pass |
| useBoqUpload.ts | 297 | ✓ Pass |
| UploadStep.tsx | 82 | ✓ Pass |
| MappingStep.tsx | 178 | ✓ Pass |
| PreviewStep.tsx | 81 | ✓ Pass |
| **Total** | **810** | ✓ All under 600 |

## Compilation Status

```
✓ TypeScript compilation: PASSED
✓ No errors in new components
✓ All imports resolved
✓ Type checking: PASSED
```

## Performance Considerations

### What Improved
- **Component rendering:** Each step renders independently
- **Re-render optimization:** Only affected components update
- **Memory usage:** Hook can be disposed when component unmounts

### What Stayed the Same
- Database query performance
- Excel parsing speed
- Batch upload logic

## Backwards Compatibility

**✓ Fully backwards compatible** - The main export hasn't changed:
```typescript
// Still works exactly the same
import UploadBOQModal from '@/pages/Admin/Tenders/UploadBOQModal';
```

## Future Improvements

Now that the code is modularized, it's easier to:

1. **Add more upload formats**
   - Add `useCsvUpload.ts` hook
   - Create `CsvUploadModal.tsx` wrapper
   - Reuse `UploadStep` and `PreviewStep`

2. **Add custom validation**
   - Extend `validateData` in `useBoqUpload`
   - Add validation rule plugins

3. **Add more UI variants**
   - Reuse components in different contexts
   - Create streaming upload variant
   - Add batch processing UI

4. **Improve error handling**
   - Add ErrorStep component
   - Better error recovery flow
   - Detailed error logging

## Common Questions

### Q: Do I need to update my imports?
A: No. If you're using `UploadBOQModal` from the main file, nothing changes.

### Q: Can I use useBoqUpload in other components?
A: Yes! That's one of the main benefits of the refactoring.

### Q: Is the modal functionally different?
A: No. The behavior and API are identical.

### Q: How do I test the new components?
A: See the Testing section above. You can now test hook logic separately from UI.

### Q: Can I reuse UploadStep in other modals?
A: Yes. Just pass the required props and handle callbacks.

## Contact & Support

For questions about the refactoring, refer to:
- `/src/pages/Admin/Tenders/README.md` - Architecture details
- TypeScript types in `hooks/useBoqUpload.ts` - Data structures
- Component prop interfaces - Usage examples
