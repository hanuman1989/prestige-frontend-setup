# Destination Manager

The admin sidebar links to `/admin/destinations`. Dedicated routes use the existing Categories conventions:

- `/admin/destinations`: listing, search/type/status filters, backend pagination, and confirmed deletion.
- `/admin/destinations/create`: create form.
- `/admin/destinations/[id]/edit`: show request followed by the shared edit form.
- `/admin/destinations/[id]`: show request followed by destination details, SEO fields, image, settings, and backend timestamps.

All requests use `APIs.admin.destinations` and the existing authenticated Axios instance. The admin layout handles route protection and toast presentation; the backend enforces `manage-destinations` permission.

## Confirmed backend contract

Verified against the backend's `DestinationController`, `DestinationResource`, destination request validators, and image observer:

- List: `GET /admin/destinations`, with `page`, `per_page`, and optional `search`, `destination_type`, and `status`. `search` matches title or slug. Responses provide `data` and `pagination` with current/last page, total, range, and page size.
- Show: `GET /admin/destinations/{id}` returns the record in `data`.
- Create: `POST /admin/destinations` with multipart form data.
- Update: multipart `POST /admin/destinations/{id}` with `_method=PUT`, supplied by the existing API module. JSON updates continue to use `PUT`.
- Delete: `DELETE /admin/destinations/{id}`. The list refetches after success and moves back when the final page becomes empty.
- Destination type is integer `1` (Domestic) or `2` (International). Resource popularity/status are booleans; multipart values are `1` or `0`.
- Title and slug are required, up to 255 characters. Slug uses lowercase letters/numbers with single hyphens; uniqueness is validated by the backend. Meta title permits 255 characters; meta keywords/description permit 65,535. Description is optional.
- Optional images accept JPG/JPEG, PNG, or WebP, up to 2 MB. Render `image_url`; `image` is a storage path. Unchanged images are omitted from updates.

Backend field errors stay inline, submitted values are retained, unmapped errors remain visible, and the first editable failing field receives focus after submission. Text and timestamps are displayed without frontend normalization or date formatting. Slug generation/manual editing matches Categories. Description uses the same textarea as Categories.

## Shared image upload

`components/admin/common/ImageUpload.jsx` replaces the category-specific image component and inline upload UI. Both Category and Destination forms use it for file selection, drag/drop, previews, replacement, and discarding a selected replacement. Validation remains inside each form. Its `ImagePreview` export is used for table thumbnails and destination details. Object URLs are released on replacement/unmount.

The backend supports replacement but has no stored-image removal action. Discarding a selected file restores the existing image; the form sends no unsupported removal field. The destination routes, permission gate, migration, resource, validators, and image observer exist in the backend source. A running backend with its migration applied and browser-accessible image storage is required.
