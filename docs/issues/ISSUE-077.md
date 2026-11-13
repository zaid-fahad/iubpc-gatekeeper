# Issue #77: Fix participant data staying in localStorage instead of persisting to Supabase DB

## Problem Summary
Participants registering via Public Registration, AddAttendeeModal, or Gate Control are saved only to browser `localStorage` and fail to insert into the Supabase database.

## Root Causes
1. **Schema Mismatch**: The `attendees` table in Supabase does not have a `category` column (`PGRST204: Could not find the 'category' column of 'attendees' in the schema cache`).
2. **Silent Failure**: `insertAttendee` silently caught the Supabase error and fell back to local storage, returning `{ data: createdAttendee, error: null }` so callers believed the remote insert succeeded.
3. **Payload Truncation**: `dbPayload` in `insertAttendee` omitted valid DB columns (`avatar_url`, `additional_info`, `is_on_spot`, `checked_in_1`, `checked_in_2`, `token_given`).
4. **Result Array Expectation**: `GateControl` and `SelfEntryKiosk` expected `data[0]` while `insertAttendee` returned an object `{ data: createdAttendee }`.

## Solutions
1. Provide SQL migration `supabase/migrations/20261113000000_add_category_to_attendees.sql` to add `category` to the `attendees` table.
2. Update `insertAttendee` to include all valid DB columns (`avatar_url`, `additional_info`, `is_on_spot`, check-in flags).
3. Update `insertAttendee` to report true database errors when Supabase fails rather than masking them.
4. Add automatic local-to-cloud sync in `fetchEventAttendees` to push orphaned local attendees to Supabase.
5. Standardize attendee result handling in `GateControl` and `SelfEntryKiosk` using `Array.isArray(data) ? data[0] : data`.
